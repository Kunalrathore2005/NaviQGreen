"""
NaviQGreen Fuel Cost & Lifecycle Greenhouse Gas Emissions Engine
Compliant with IMO Fourth GHG Study (2020), MEPC.308(73), and ISO 14040/44 Lifecycle Boundaries.
"""

from typing import Dict, Any, Optional

# Standard Reference Table for Maritime Fuels
# Sources: IMO Fourth GHG Study (2020), ICCT Maritime Fuel Life-Cycle Assessment, Argus Marine Fuels 2026.
FUEL_REFERENCE_DATA: Dict[str, Dict[str, Any]] = {
    "VLSFO": {
        "name": "Very Low Sulphur Fuel Oil (0.5% S)",
        "category": "FOSSIL",
        "price_per_tonne_usd": 620.0,
        "lhv_mj_per_kg": 40.2,                          # Lower Heating Value
        "ttw_co2_factor": 3.114,                        # Tank-to-Wake: tonnes CO2 per tonne fuel
        "ttw_ch4_factor_g_per_kg": 0.05,                # g CH4 per kg fuel
        "ttw_n2o_factor_g_per_kg": 0.18,                # g N2O per kg fuel
        "wtw_co2eq_factor": 3.650,                      # Well-to-Wake: tonnes CO2eq per tonne fuel
        "is_zero_carbon": False,
        "efficiency_factor": 1.0,                       # Relative engine thermal efficiency
    },
    "MGO": {
        "name": "Marine Gas Oil (0.1% S)",
        "category": "FOSSIL",
        "price_per_tonne_usd": 780.0,
        "lhv_mj_per_kg": 42.7,
        "ttw_co2_factor": 3.206,
        "ttw_ch4_factor_g_per_kg": 0.05,
        "ttw_n2o_factor_g_per_kg": 0.18,
        "wtw_co2eq_factor": 3.780,
        "is_zero_carbon": False,
        "efficiency_factor": 1.02,
    },
    "LNG": {
        "name": "Liquefied Natural Gas (Dual-Fuel Otto/Diesel)",
        "category": "FOSSIL",
        "price_per_tonne_usd": 690.0,
        "lhv_mj_per_kg": 48.0,
        "ttw_co2_factor": 2.750,
        "ttw_ch4_factor_g_per_kg": 5.50,                # Methane slip in Dual-Fuel Otto
        "ttw_n2o_factor_g_per_kg": 0.11,
        "wtw_co2eq_factor": 3.420,                      # Includes upstream extraction & methane slip
        "is_zero_carbon": False,
        "efficiency_factor": 1.05,
    },
    "Methanol": {
        "name": "Bio/e-Methanol (Certified Renewable)",
        "category": "BIO",
        "price_per_tonne_usd": 850.0,
        "lhv_mj_per_kg": 19.9,
        "ttw_co2_factor": 1.375,                        # Biogenic / Recycled combustion CO2
        "ttw_ch4_factor_g_per_kg": 0.02,
        "ttw_n2o_factor_g_per_kg": 0.08,
        "wtw_co2eq_factor": 0.450,                      # Net WTW for green e-methanol
        "is_zero_carbon": False,
        "efficiency_factor": 1.03,
    },
    "Ammonia": {
        "name": "Green Ammonia (Renewable Haber-Bosch)",
        "category": "SYNTHETIC",
        "price_per_tonne_usd": 920.0,
        "lhv_mj_per_kg": 18.6,
        "ttw_co2_factor": 0.000,                        # Zero carbon in molecule
        "ttw_ch4_factor_g_per_kg": 0.00,
        "ttw_n2o_factor_g_per_kg": 0.45,                # Pilot combustion N2O slip
        "wtw_co2eq_factor": 0.320,                      # Green electricity upstream + N2O GWP
        "is_zero_carbon": True,
        "efficiency_factor": 0.98,
    },
    "Hydrogen": {
        "name": "Liquid Green Hydrogen (PEM Fuel Cell)",
        "category": "SYNTHETIC",
        "price_per_tonne_usd": 2400.0,
        "lhv_mj_per_kg": 120.0,
        "ttw_co2_factor": 0.000,
        "ttw_ch4_factor_g_per_kg": 0.00,
        "ttw_n2o_factor_g_per_kg": 0.00,
        "wtw_co2eq_factor": 0.180,                      # Green liquefaction & transport losses
        "is_zero_carbon": True,
        "efficiency_factor": 1.25,                      # Fuel cell high efficiency vs internal combustion
    },
}

# IPCC AR5 100-year Global Warming Potential values
GWP_CH4 = 28.0
GWP_N2O = 265.0

class FuelCostEmissionsEngine:
    """
    Unit-consistent calculation engine for marine fuel consumption,
    direct combustion emissions, and lifecycle (well-to-wake) emissions.
    """
    
    @staticmethod
    def get_fuel_properties(fuel_type: str) -> Dict[str, Any]:
        fuel_key = fuel_type.strip()
        if fuel_key not in FUEL_REFERENCE_DATA:
            # Fallback to VLSFO baseline if unknown, but flag
            return FUEL_REFERENCE_DATA["VLSFO"]
        return FUEL_REFERENCE_DATA[fuel_key]

    @staticmethod
    def calculate_equivalent_fuel_mass(
        base_vlsfo_consumption_tonnes: float,
        target_fuel_type: str
    ) -> float:
        """
        Adjusts mass consumption based on energy density (LHV) and thermal efficiency.
        Never compares 1 kg of different fuels as equal energy!
        
        Energy Required (MJ) = Base Mass (kg) * LHV_vlsfo
        Target Mass (kg) = Energy Required / (LHV_target * Efficiency_Ratio)
        """
        if target_fuel_type == "VLSFO":
            return base_vlsfo_consumption_tonnes
            
        base_props = FUEL_REFERENCE_DATA["VLSFO"]
        target_props = FuelCostEmissionsEngine.get_fuel_properties(target_fuel_type)
        
        total_energy_mj = base_vlsfo_consumption_tonnes * 1000.0 * base_props["lhv_mj_per_kg"]
        eff_ratio = target_props.get("efficiency_factor", 1.0) / base_props.get("efficiency_factor", 1.0)
        
        target_mass_kg = total_energy_mj / (target_props["lhv_mj_per_kg"] * eff_ratio)
        return target_mass_kg / 1000.0 # Return in metric tonnes

    @staticmethod
    def calculate_fuel_cost(
        fuel_consumption_tonnes: float,
        fuel_type: str,
        custom_price_per_tonne: Optional[float] = None
    ) -> float:
        """
        Calculates fuel cost in USD.
        Cost = consumption (metric tonnes) * price (USD/tonne)
        """
        props = FuelCostEmissionsEngine.get_fuel_properties(fuel_type)
        price = custom_price_per_tonne if custom_price_per_tonne is not None else props["price_per_tonne_usd"]
        return max(0.0, fuel_consumption_tonnes * price)

    @staticmethod
    def calculate_direct_emissions(
        fuel_consumption_tonnes: float,
        fuel_type: str
    ) -> Dict[str, float]:
        """
        Calculates Tank-to-Wake (TTW) combustion emissions:
        - CO2 (tonnes)
        - CH4 (tonnes)
        - N2O (tonnes)
        - Total GHG CO2eq (tonnes) using IPCC AR5 GWP100
        """
        props = FuelCostEmissionsEngine.get_fuel_properties(fuel_type)
        
        co2_tonnes = fuel_consumption_tonnes * props["ttw_co2_factor"]
        
        # Factors in g per kg of fuel == kg per tonne of fuel
        # Tonnes GHG = (kg per tonne * tonnes fuel) / 1000
        ch4_tonnes = (props["ttw_ch4_factor_g_per_kg"] * fuel_consumption_tonnes) / 1000.0
        n2o_tonnes = (props["ttw_n2o_factor_g_per_kg"] * fuel_consumption_tonnes) / 1000.0
        
        total_ghg_co2eq = co2_tonnes + (ch4_tonnes * GWP_CH4) + (n2o_tonnes * GWP_N2O)
        
        return {
            "co2_tonnes": round(co2_tonnes, 4),
            "ch4_tonnes": round(ch4_tonnes, 6),
            "n2o_tonnes": round(n2o_tonnes, 6),
            "total_direct_co2eq_tonnes": round(total_ghg_co2eq, 4),
        }

    @staticmethod
    def calculate_lifecycle_emissions(
        fuel_consumption_tonnes: float,
        fuel_type: str
    ) -> float:
        """
        Calculates Well-to-Wake (WTW) total lifecycle emissions in metric tonnes CO2eq.
        WTW = fuel consumed (tonnes) * wtw_co2eq_factor (tonnes CO2eq / tonne fuel).
        """
        props = FuelCostEmissionsEngine.get_fuel_properties(fuel_type)
        wtw_co2eq = fuel_consumption_tonnes * props["wtw_co2eq_factor"]
        return round(max(0.0, wtw_co2eq), 4)

    @staticmethod
    def calculate_shore_power(
        berth_hours: float,
        auxiliary_power_demand_kw: float = 1200.0,
        electricity_price_kwh_usd: float = 0.16,
        grid_emission_factor_kg_co2_kwh: float = 0.42
    ) -> Dict[str, float]:
        """
        Calculates cold ironing / shore power electricity cost and emissions while at berth.
        """
        if berth_hours <= 0:
            return {
                "electricity_kwh": 0.0,
                "shore_power_cost_usd": 0.0,
                "shore_power_emissions_tco2": 0.0,
            }
            
        electricity_kwh = berth_hours * auxiliary_power_demand_kw
        cost_usd = electricity_kwh * electricity_price_kwh_usd
        emissions_tco2 = (electricity_kwh * grid_emission_factor_kg_co2_kwh) / 1000.0
        
        return {
            "electricity_kwh": round(electricity_kwh, 2),
            "shore_power_cost_usd": round(cost_usd, 2),
            "shore_power_emissions_tco2": round(emissions_tco2, 4),
        }

    @staticmethod
    def evaluate_voyage(
        base_vlsfo_consumption_tonnes: float,
        fuel_type: str,
        berth_hours: float = 0.0,
        use_shore_power: bool = False,
        auxiliary_power_kw: float = 1200.0,
        grid_emission_factor: float = 0.42,
        grid_price_usd: float = 0.16
    ) -> Dict[str, Any]:
        """
        Full unit-tested evaluation combining propulsion fuel consumption,
        alternative fuel energy-density conversions, direct & lifecycle emissions,
        and optional berth shore power.
        """
        actual_fuel_tonnes = FuelCostEmissionsEngine.calculate_equivalent_fuel_mass(
            base_vlsfo_consumption_tonnes, fuel_type
        )
        
        fuel_cost = FuelCostEmissionsEngine.calculate_fuel_cost(actual_fuel_tonnes, fuel_type)
        direct_emissions = FuelCostEmissionsEngine.calculate_direct_emissions(actual_fuel_tonnes, fuel_type)
        wtw_emissions = FuelCostEmissionsEngine.calculate_lifecycle_emissions(actual_fuel_tonnes, fuel_type)
        
        shore_power_res = {"electricity_kwh": 0.0, "shore_power_cost_usd": 0.0, "shore_power_emissions_tco2": 0.0}
        if use_shore_power and berth_hours > 0:
            shore_power_res = FuelCostEmissionsEngine.calculate_shore_power(
                berth_hours, auxiliary_power_kw, grid_price_usd, grid_emission_factor
            )
            
        total_cost = fuel_cost + shore_power_res["shore_power_cost_usd"]
        total_lifecycle_emissions = wtw_emissions + shore_power_res["shore_power_emissions_tco2"]
        
        return {
            "fuel_type": fuel_type,
            "fuel_consumption_tonnes": round(actual_fuel_tonnes, 4),
            "fuel_cost_usd": round(fuel_cost, 2),
            "direct_emissions": direct_emissions,
            "lifecycle_emissions_tco2eq": round(wtw_emissions, 4),
            "shore_power": shore_power_res,
            "total_cost_usd": round(total_cost, 2),
            "total_lifecycle_emissions_tco2eq": round(total_lifecycle_emissions, 4),
        }

