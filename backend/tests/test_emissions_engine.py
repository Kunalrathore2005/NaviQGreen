import pytest
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.emissions.fuel_costs_emissions_engine import (
    FuelCostEmissionsEngine,
    FUEL_REFERENCE_DATA,
    GWP_CH4,
    GWP_N2O
)

def test_fuel_properties_retrieval():
    vlsfo = FuelCostEmissionsEngine.get_fuel_properties("VLSFO")
    assert vlsfo["category"] == "FOSSIL"
    assert vlsfo["lhv_mj_per_kg"] == 40.2
    assert vlsfo["ttw_co2_factor"] == 3.114
    
    # Unknown fuel should fallback safely
    unknown = FuelCostEmissionsEngine.get_fuel_properties("UNKNOWN_FUEL")
    assert unknown["name"] == vlsfo["name"]

def test_equivalent_fuel_mass_energy_consistency():
    # 100 tonnes of VLSFO
    base_tonnes = 100.0
    
    # Methanol has roughly half LHV (19.9 vs 40.2), so roughly double mass required
    methanol_tonnes = FuelCostEmissionsEngine.calculate_equivalent_fuel_mass(base_tonnes, "Methanol")
    assert methanol_tonnes > 190.0
    assert methanol_tonnes < 210.0
    
    # Hydrogen has triple LHV (120 vs 40.2) + 25% fuel cell efficiency bonus, so much less mass required
    h2_tonnes = FuelCostEmissionsEngine.calculate_equivalent_fuel_mass(base_tonnes, "Hydrogen")
    assert h2_tonnes < 35.0
    assert h2_tonnes > 25.0

def test_fuel_cost_calculation():
    tonnes = 50.0
    vlsfo_cost = FuelCostEmissionsEngine.calculate_fuel_cost(tonnes, "VLSFO")
    expected = 50.0 * 620.0
    assert vlsfo_cost == expected
    
    # Custom price
    custom_cost = FuelCostEmissionsEngine.calculate_fuel_cost(tonnes, "VLSFO", custom_price_per_tonne=700.0)
    assert custom_cost == 35000.0

def test_direct_emissions_and_gwp():
    tonnes = 10.0
    emissions = FuelCostEmissionsEngine.calculate_direct_emissions(tonnes, "VLSFO")
    
    expected_co2 = 10.0 * 3.114
    assert emissions["co2_tonnes"] == round(expected_co2, 4)
    assert emissions["ch4_tonnes"] == 0.0005 # (0.05 * 10) / 1000
    assert emissions["total_direct_co2eq_tonnes"] >= emissions["co2_tonnes"]
    
    # Zero carbon molecule test: Ammonia produces zero molecular CO2
    ammonia_emissions = FuelCostEmissionsEngine.calculate_direct_emissions(tonnes, "Ammonia")
    assert ammonia_emissions["co2_tonnes"] == 0.0

def test_lifecycle_emissions():
    tonnes = 10.0
    wtw = FuelCostEmissionsEngine.calculate_lifecycle_emissions(tonnes, "VLSFO")
    assert wtw == round(10.0 * 3.650, 4)
    
    # Green hydrogen lifecycle emissions
    h2_wtw = FuelCostEmissionsEngine.calculate_lifecycle_emissions(tonnes, "Hydrogen")
    assert h2_wtw == round(10.0 * 0.180, 4)

def test_shore_power_calculation():
    res = FuelCostEmissionsEngine.calculate_shore_power(
        berth_hours=24.0,
        auxiliary_power_demand_kw=1000.0,
        electricity_price_kwh_usd=0.20,
        grid_emission_factor_kg_co2_kwh=0.50
    )
    assert res["electricity_kwh"] == 24000.0
    assert res["shore_power_cost_usd"] == 4800.0 # 24000 * 0.20
    assert res["shore_power_emissions_tco2"] == 12.0 # (24000 * 0.50) / 1000

def test_evaluate_voyage_full_pipeline():
    eval_res = FuelCostEmissionsEngine.evaluate_voyage(
        base_vlsfo_consumption_tonnes=50.0,
        fuel_type="LNG",
        berth_hours=12.0,
        use_shore_power=True
    )
    assert "fuel_consumption_tonnes" in eval_res
    assert "total_cost_usd" in eval_res
    assert "total_lifecycle_emissions_tco2eq" in eval_res
    assert eval_res["total_cost_usd"] > 0
    assert eval_res["total_lifecycle_emissions_tco2eq"] > 0

