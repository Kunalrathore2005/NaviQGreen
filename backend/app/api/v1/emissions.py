from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.emissions.fuel_costs_emissions_engine import FuelCostEmissionsEngine, FUEL_REFERENCE_DATA
from app.schemas import EmissionCalculationRequest, EmissionCalculationResponse, FuelReferenceResponse
from app.models import FuelReference, Port

router = APIRouter(prefix="/emissions", tags=["Fuel Cost & Emissions Engine"])

@router.get("/fuels-catalogue")
def get_fuels_catalogue(db: Session = Depends(get_db)):
    """
    Returns fuel reference data with Lower Heating Value, Tank-to-Wake, Well-to-Wake factors, and current bunker pricing.
    """
    db_fuels = db.query(FuelReference).all()
    if db_fuels:
        return db_fuels
    # Fallback to in-memory reference table
    return [
        {
            "fuel_code": code,
            "fuel_name": data["name"],
            "category": data["category"],
            "price_per_tonne_usd": data["price_per_tonne_usd"],
            "lower_heating_value_mj_per_kg": data["lhv_mj_per_kg"],
            "direct_emission_factor_tco2_per_tfuel": data["ttw_co2_factor"],
            "well_to_wake_emission_factor_tco2_per_tfuel": data["wtw_co2eq_factor"],
            "ch4_emission_factor_g_per_kg": data["ttw_ch4_factor_g_per_kg"],
            "n2o_emission_factor_g_per_kg": data["ttw_n2o_factor_g_per_kg"],
            "is_zero_carbon": data["is_zero_carbon"]
        }
        for code, data in FUEL_REFERENCE_DATA.items()
    ]

@router.post("/calculate", response_model=EmissionCalculationResponse)
def calculate_emissions(req: EmissionCalculationRequest, db: Session = Depends(get_db)):
    # Retrieve port specifics if shore power requested
    grid_emission_factor = 0.40
    grid_price = 0.17
    if req.port_code:
        port = db.query(Port).filter(Port.port_code == req.port_code).first()
        if port:
            grid_emission_factor = port.grid_emission_factor_kg_co2_per_kwh
            grid_price = port.electricity_price_kwh_usd
            
    eval_res = FuelCostEmissionsEngine.evaluate_voyage(
        base_vlsfo_consumption_tonnes=req.fuel_consumption_tonnes,
        fuel_type=req.fuel_type,
        berth_hours=req.berth_hours,
        use_shore_power=req.shore_power_used,
        auxiliary_power_kw=1000.0,
        grid_emission_factor=grid_emission_factor,
        grid_price_usd=grid_price
    )
    
    props = FuelCostEmissionsEngine.get_fuel_properties(req.fuel_type)
    
    return EmissionCalculationResponse(
        fuel_type=req.fuel_type,
        fuel_consumption_tonnes=eval_res["fuel_consumption_tonnes"],
        fuel_price_per_tonne_usd=props["price_per_tonne_usd"],
        fuel_cost_usd=eval_res["fuel_cost_usd"],
        tank_to_wake_co2_tonnes=eval_res["direct_emissions"]["co2_tonnes"],
        tank_to_wake_ch4_tonnes=eval_res["direct_emissions"]["ch4_tonnes"],
        tank_to_wake_n2o_tonnes=eval_res["direct_emissions"]["n2o_tonnes"],
        total_direct_ghg_co2eq_tonnes=eval_res["direct_emissions"]["total_direct_co2eq_tonnes"],
        well_to_wake_lifecycle_co2eq_tonnes=eval_res["lifecycle_emissions_tco2eq"],
        shore_power_electricity_kwh=eval_res["shore_power"]["electricity_kwh"],
        shore_power_cost_usd=eval_res["shore_power"]["shore_power_cost_usd"],
        shore_power_emissions_tco2=eval_res["shore_power"]["shore_power_emissions_tco2"],
        total_voyage_and_port_cost_usd=eval_res["total_cost_usd"],
        total_lifecycle_emissions_tco2eq=eval_res["total_lifecycle_emissions_tco2eq"]
    )

