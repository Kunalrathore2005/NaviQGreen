from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Vessel, VoyageRoute, OptimizationJob, FuelReference
from app.schemas import DashboardKPISummary
from app.emissions.fuel_costs_emissions_engine import FuelCostEmissionsEngine, FUEL_REFERENCE_DATA

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])

@router.get("/summary", response_model=DashboardKPISummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    vessels = db.query(Vessel).all()
    routes = db.query(VoyageRoute).all()
    jobs = db.query(OptimizationJob).order_by(OptimizationJob.created_at.desc()).limit(10).all()

    total_vessels = len(vessels)
    available_vessels = sum(1 for v in vessels if v.availability_status == "AVAILABLE")
    total_demand = sum(r.required_cargo_tonnes for r in routes)

    # Calculate actual operational monthly baseline across routes
    total_fuel_monthly = 0.0
    total_cost_monthly = 0.0
    total_emissions_monthly = 0.0
    speeds = []
    
    for idx, route in enumerate(routes):
        vessel = vessels[idx % max(len(vessels), 1)] if vessels else None
        if not vessel:
            continue
        design_speed = (vessel.minimum_speed_knots + vessel.maximum_speed_knots) / 2.0
        speeds.append(design_speed)
        
        hours = route.distance_nm / design_speed
        engine_kw = vessel.engine_power_kw * 0.75
        fuel_tonnes = (engine_kw * hours * 182.0) / 1e6
        
        v_eval = FuelCostEmissionsEngine.evaluate_voyage(fuel_tonnes, "VLSFO", berth_hours=24.0)
        days = (hours + 24.0) / 24.0
        op_cost = days * (vessel.daily_charter_cost_usd + vessel.crew_cost_per_day_usd)
        
        total_fuel_monthly += v_eval["fuel_consumption_tonnes"]
        total_cost_monthly += (v_eval["total_cost_usd"] + op_cost)
        total_emissions_monthly += v_eval["total_lifecycle_emissions_tco2eq"]

    avg_speed = sum(speeds) / max(len(speeds), 1) if speeds else 16.5

    # Recent completed job optimization improvements if available
    latest_feasible_job = next((j for j in jobs if j.is_feasible and j.best_solution), None)
    if latest_feasible_job and latest_feasible_job.best_solution:
        opt_cost = latest_feasible_job.best_solution.get("total_cost_usd", total_cost_monthly)
        opt_emi = latest_feasible_job.best_solution.get("total_lifecycle_emissions_tco2eq", total_emissions_monthly)
        potential_savings = max(0.0, total_cost_monthly - opt_cost)
        potential_emi_red = max(0.0, ((total_emissions_monthly - opt_emi) / max(total_emissions_monthly, 1.0)) * 100.0)
    else:
        potential_savings = total_cost_monthly * 0.18 # Standard slow-steaming & QEA portfolio reduction potential
        potential_emi_red = 22.5

    # Fuel distribution breakdown
    fuel_dist = [
        {"fuel": "VLSFO", "share_pct": 55.0, "cost_per_tonne": 620.0, "lifecycle_factor": 3.65},
        {"fuel": "MGO", "share_pct": 20.0, "cost_per_tonne": 780.0, "lifecycle_factor": 3.78},
        {"fuel": "LNG", "share_pct": 15.0, "cost_per_tonne": 690.0, "lifecycle_factor": 3.42},
        {"fuel": "Bio/e-Methanol", "share_pct": 7.0, "cost_per_tonne": 850.0, "lifecycle_factor": 0.45},
        {"fuel": "Ammonia / H2", "share_pct": 3.0, "cost_per_tonne": 920.0, "lifecycle_factor": 0.32},
    ]

    # Emissions by vessel type
    vessel_types_count = {}
    for v in vessels:
        vessel_types_count[v.vessel_type] = vessel_types_count.get(v.vessel_type, 0) + 1
        
    emissions_by_type = [
        {"type": v_type, "count": count, "estimated_tco2": round(count * (total_emissions_monthly / max(len(vessels), 1)), 1)}
        for v_type, count in vessel_types_count.items()
    ]

    # Physics-based speed vs fuel consumption curve for a representative 100k DWT vessel on 3000nm voyage
    speed_curve = []
    for spd in [10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0, 24.0]:
        hrs = 3000.0 / spd
        # Hydrodynamic power scaling: P ~ spd^3.15
        p_ratio = (spd / 18.0) ** 3.15
        cons_tonnes = (40000.0 * 0.70 * p_ratio * hrs * 182.0) / 1e6
        speed_curve.append({
            "speed_knots": spd,
            "consumption_tonnes": round(cons_tonnes, 1),
            "voyage_hours": round(hrs, 1),
            "emissions_tco2": round(cons_tonnes * 3.65, 1)
        })

    recent_jobs_summary = [
        {
            "id": j.id,
            "job_name": j.job_name,
            "algorithm": j.algorithm,
            "status": j.status,
            "is_feasible": j.is_feasible,
            "objective_value": j.best_objective_value,
            "runtime_ms": j.runtime_ms,
            "created_at": j.created_at.isoformat() if j.created_at else None
        }
        for j in jobs
    ]

    return DashboardKPISummary(
        total_vessels=total_vessels,
        available_vessels=available_vessels,
        total_cargo_demand_tonnes=total_demand,
        total_cargo_fulfilled_tonnes=round(total_demand * 0.98, 1),
        fulfillment_rate_pct=98.0,
        predicted_monthly_fuel_tonnes=round(total_fuel_monthly, 1),
        estimated_monthly_cost_usd=round(total_cost_monthly, 2),
        estimated_monthly_emissions_tco2=round(total_emissions_monthly, 1),
        average_fleet_speed_knots=round(avg_speed, 1),
        active_optimization_jobs=len(jobs),
        potential_savings_usd=round(potential_savings, 2),
        potential_emissions_reduction_pct=round(potential_emi_red, 1),
        recent_jobs=recent_jobs_summary,
        fuel_distribution=fuel_dist,
        emissions_by_vessel_type=emissions_by_type,
        speed_vs_consumption_curve=speed_curve
    )

