"""
NaviQGreen Fleet Optimization Problem Definition
Defines decision variables, constraints, objective evaluation, and candidate repairs.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import math
from app.emissions.fuel_costs_emissions_engine import FuelCostEmissionsEngine

@dataclass
class ProblemVessel:
    vessel_id: str
    vessel_name: str
    vessel_type: str
    deadweight_tonnage: float
    cargo_capacity_tonnes: float
    engine_power_kw: float
    min_speed_knots: float
    max_speed_knots: float
    compatible_fuels: List[str]
    daily_charter_cost_usd: float
    crew_cost_per_day_usd: float
    is_available: bool = True

@dataclass
class ProblemRoute:
    route_code: str
    origin_port: str
    destination_port: str
    distance_nm: float
    required_cargo_tonnes: float
    arrival_deadline_hours: float
    wind_speed_knots: float = 14.0
    wave_height_m: float = 1.5
    destination_has_shore_power: bool = False
    port_grid_emission_factor: float = 0.40
    port_electricity_price: float = 0.17

@dataclass
class FleetProblemInstance:
    vessels: List[ProblemVessel]
    routes: List[ProblemRoute]
    weight_cost: float = 0.4
    weight_fuel: float = 0.3
    weight_emissions: float = 0.3
    max_emissions_cap_tco2: Optional[float] = None
    mandatory_shore_power: bool = False
    ref_cost_usd: float = 500000.0        # Reference normalization factor
    ref_fuel_tonnes: float = 600.0         # Reference normalization factor
    ref_emissions_tco2: float = 2000.0     # Reference normalization factor

@dataclass
class RouteAssignment:
    vessel_id: str
    vessel_name: str
    vessel_type: str
    route_code: str
    origin_port: str
    destination_port: str
    distance_nm: float
    allocated_cargo_tonnes: float
    capacity_utilization_pct: float
    chosen_speed_knots: float
    chosen_fuel: str
    voyage_duration_hours: float
    deadline_hours: float
    arrival_margin_hours: float
    fuel_consumption_tonnes: float
    fuel_cost_usd: float
    operating_cost_usd: float
    total_cost_usd: float
    direct_emissions_tco2: float
    lifecycle_emissions_tco2eq: float
    shore_power_applied: bool

@dataclass
class SolutionEvaluation:
    is_feasible: bool
    objective_value: float
    total_cost_usd: float
    total_fuel_tonnes: float
    total_lifecycle_emissions_tco2eq: float
    total_direct_emissions_tco2: float
    total_cargo_fulfilled_tonnes: float
    total_cargo_demanded_tonnes: float
    cargo_fulfillment_rate_pct: float
    fleet_capacity_utilization_pct: float
    penalty_value: float
    constraint_violations: List[str]
    assignments: List[RouteAssignment]


def evaluate_fleet_solution(
    instance: FleetProblemInstance,
    assignments_matrix: List[List[int]], # [vessel_idx][route_idx] binary 0 or 1
    speeds: List[float],                 # speed for each vessel
    fuel_choices: List[str],             # fuel choice for each vessel
    shore_power_choices: List[bool]      # shore power choice for each vessel
) -> SolutionEvaluation:
    """
    Evaluates a candidate fleet deployment solution.
    Calculates exact voyage physics, fuel consumption, costs, emissions, and verifies all constraints.
    """
    violations = []
    penalty = 0.0
    
    total_fuel_tonnes = 0.0
    total_cost_usd = 0.0
    total_direct_emissions = 0.0
    total_lifecycle_emissions = 0.0
    total_allocated_cargo = 0.0
    total_demanded_cargo = sum(r.required_cargo_tonnes for r in instance.routes)
    
    route_allocated_cargo: Dict[str, float] = {r.route_code: 0.0 for r in instance.routes}
    vessel_assigned_count: Dict[str, int] = {v.vessel_id: 0 for v in instance.vessels}
    
    detailed_assignments: List[RouteAssignment] = []
    
    for v_idx, vessel in enumerate(instance.vessels):
        assigned_routes = [r_idx for r_idx, assigned in enumerate(assignments_matrix[v_idx]) if assigned == 1]
        
        # Single voyage constraint per vessel in scheduling period
        if len(assigned_routes) > 1:
            violations.append(f"Vessel {vessel.vessel_id} assigned to multiple routes ({len(assigned_routes)})")
            penalty += 1000.0 * (len(assigned_routes) - 1)
            
        for r_idx in assigned_routes:
            route = instance.routes[r_idx]
            vessel_assigned_count[vessel.vessel_id] += 1
            
            speed = speeds[v_idx]
            fuel = fuel_choices[v_idx]
            use_shore_power = shore_power_choices[v_idx]
            
            # Constraint: Speed bounds
            if speed < vessel.min_speed_knots or speed > vessel.max_speed_knots:
                violations.append(f"Vessel {vessel.vessel_id} speed {speed:.1f} kts outside allowable [{vessel.min_speed_knots}, {vessel.max_speed_knots}]")
                penalty += 500.0
                speed = max(vessel.min_speed_knots, min(speed, vessel.max_speed_knots))
                
            # Constraint: Fuel compatibility
            if fuel not in vessel.compatible_fuels:
                violations.append(f"Vessel {vessel.vessel_id} assigned incompatible fuel {fuel}")
                penalty += 800.0
                fuel = vessel.compatible_fuels[0] # repair fallback
                
            # Schedule / Voyage duration
            voyage_hours = route.distance_nm / speed
            if voyage_hours > route.arrival_deadline_hours:
                hours_late = voyage_hours - route.arrival_deadline_hours
                violations.append(f"Vessel {vessel.vessel_id} misses deadline on {route.route_code} by {hours_late:.1f} hours")
                penalty += 50.0 * hours_late # Heavy penalty per delayed hour
                
            arrival_margin = route.arrival_deadline_hours - voyage_hours
            
            # Cargo allocation
            cargo_alloc = min(vessel.cargo_capacity_tonnes, route.required_cargo_tonnes)
            route_allocated_cargo[route.route_code] += cargo_alloc
            total_allocated_cargo += cargo_alloc
            cap_util = (cargo_alloc / max(vessel.cargo_capacity_tonnes, 1.0)) * 100.0
            
            # Physics-based fuel consumption calculation:
            # P_prop ~ engine_kw * (cargo_load/dwt)^(2/3) * (speed/design_speed)^3.15 * weather
            load_factor = cargo_alloc / max(vessel.deadweight_tonnage, 1.0)
            design_speed = (vessel.min_speed_knots + vessel.max_speed_knots) / 2.0
            
            power_frac = 0.85 * ((0.3 + 0.7 * load_factor) ** (2.0 / 3.0)) * ((speed / design_speed) ** 3.15)
            weather_mult = 1.0 + (0.002 * (route.wind_speed_knots ** 1.8) + 0.03 * (route.wave_height_m ** 1.9)) / 100.0
            required_kw = min(max(vessel.engine_power_kw * power_frac * weather_mult, vessel.engine_power_kw * 0.18), vessel.engine_power_kw * 0.98)
            
            # Marine engine SFOC (~180 g/kWh)
            engine_energy_kwh = required_kw * voyage_hours
            vlsfo_fuel_tonnes = (engine_energy_kwh * 182.0) / 1e6
            
            # Shore power berth hours: ~24 hours average discharge/load time
            berth_hours = 24.0
            has_shore = route.destination_has_shore_power and use_shore_power
            
            # Evaluate voyage emissions & costs
            voyage_eval = FuelCostEmissionsEngine.evaluate_voyage(
                base_vlsfo_consumption_tonnes=vlsfo_fuel_tonnes,
                fuel_type=fuel,
                berth_hours=berth_hours,
                use_shore_power=has_shore,
                auxiliary_power_kw=1000.0,
                grid_emission_factor=route.port_grid_emission_factor,
                grid_price_usd=route.port_electricity_price
            )
            
            # Time-based operating costs (daily charter + crew)
            voyage_days = (voyage_hours + berth_hours) / 24.0
            daily_operating_rate = vessel.daily_charter_cost_usd + vessel.crew_cost_per_day_usd
            operating_cost = voyage_days * daily_operating_rate
            
            trip_total_cost = voyage_eval["total_cost_usd"] + operating_cost
            
            total_fuel_tonnes += voyage_eval["fuel_consumption_tonnes"]
            total_cost_usd += trip_total_cost
            total_direct_emissions += voyage_eval["direct_emissions"]["total_direct_co2eq_tonnes"]
            total_lifecycle_emissions += voyage_eval["total_lifecycle_emissions_tco2eq"]
            
            detailed_assignments.append(RouteAssignment(
                vessel_id=vessel.vessel_id,
                vessel_name=vessel.vessel_name,
                vessel_type=vessel.vessel_type,
                route_code=route.route_code,
                origin_port=route.origin_port,
                destination_port=route.destination_port,
                distance_nm=route.distance_nm,
                allocated_cargo_tonnes=round(cargo_alloc, 1),
                capacity_utilization_pct=round(cap_util, 1),
                chosen_speed_knots=round(speed, 1),
                chosen_fuel=fuel,
                voyage_duration_hours=round(voyage_hours, 1),
                deadline_hours=round(route.arrival_deadline_hours, 1),
                arrival_margin_hours=round(arrival_margin, 1),
                fuel_consumption_tonnes=round(voyage_eval["fuel_consumption_tonnes"], 2),
                fuel_cost_usd=round(voyage_eval["fuel_cost_usd"], 2),
                operating_cost_usd=round(operating_cost, 2),
                total_cost_usd=round(trip_total_cost, 2),
                direct_emissions_tco2=round(voyage_eval["direct_emissions"]["total_direct_co2eq_tonnes"], 2),
                lifecycle_emissions_tco2eq=round(voyage_eval["total_lifecycle_emissions_tco2eq"], 2),
                shore_power_applied=has_shore
            ))
            
    # Check cargo demand fulfillment per route
    for route in instance.routes:
        fulfilled = route_allocated_cargo[route.route_code]
        if fulfilled < route.required_cargo_tonnes * 0.95: # Allow small 5% tolerance
            shortfall = route.required_cargo_tonnes - fulfilled
            violations.append(f"Route {route.route_code} cargo shortfall of {shortfall:.0f} tonnes")
            penalty += 15.0 * shortfall # Substantial penalty per unfulfilled tonne
            
    # Check emission cap constraint if configured
    if instance.max_emissions_cap_tco2 is not None:
        if total_lifecycle_emissions > instance.max_emissions_cap_tco2:
            excess = total_lifecycle_emissions - instance.max_emissions_cap_tco2
            violations.append(f"Lifecycle emissions {total_lifecycle_emissions:.1f} tCO2 exceeds cap by {excess:.1f} tCO2")
            penalty += 500.0 * excess
            
    # Multi-objective weighted sum:
    norm_cost = total_cost_usd / max(instance.ref_cost_usd, 1.0)
    norm_fuel = total_fuel_tonnes / max(instance.ref_fuel_tonnes, 1.0)
    norm_emissions = total_lifecycle_emissions / max(instance.ref_emissions_tco2, 1.0)
    
    total_objective = (
        instance.weight_cost * norm_cost +
        instance.weight_fuel * norm_fuel +
        instance.weight_emissions * norm_emissions +
        penalty
    )
    
    fulfillment_pct = (total_allocated_cargo / max(total_demanded_cargo, 1.0)) * 100.0
    
    # Fleet capacity utilization
    total_available_capacity = sum(
        v.cargo_capacity_tonnes for v in instance.vessels
        if vessel_assigned_count[v.vessel_id] > 0
    )
    fleet_util_pct = (total_allocated_cargo / max(total_available_capacity, 1.0)) * 100.0 if total_available_capacity > 0 else 0.0
    
    is_feasible = (len(violations) == 0)
    
    return SolutionEvaluation(
        is_feasible=is_feasible,
        objective_value=round(total_objective, 4),
        total_cost_usd=round(total_cost_usd, 2),
        total_fuel_tonnes=round(total_fuel_tonnes, 2),
        total_lifecycle_emissions_tco2eq=round(total_lifecycle_emissions, 2),
        total_direct_emissions_tco2=round(total_direct_emissions, 2),
        total_cargo_fulfilled_tonnes=round(total_allocated_cargo, 1),
        total_cargo_demanded_tonnes=round(total_demanded_cargo, 1),
        cargo_fulfillment_rate_pct=round(fulfillment_pct, 1),
        fleet_capacity_utilization_pct=round(fleet_util_pct, 1),
        penalty_value=round(penalty, 2),
        constraint_violations=violations,
        assignments=detailed_assignments
    )

