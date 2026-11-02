import pytest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.ml.fuel_predictor import FuelPredictor

def test_fuel_predictor_availability():
    assert FuelPredictor.is_available() is True
    meta = FuelPredictor.get_metadata()
    assert "metrics" in meta
    assert "selected_model" in meta
    assert meta["metrics"]["r2_score"] > 0.90

def test_fuel_predictor_inference_reasonable_bounds():
    pred = FuelPredictor.predict_voyage(
        vessel_type="Container",
        deadweight_tonnage=120000.0,
        engine_power_kw=58000.0,
        cargo_load_tonnes=95000.0,
        speed_knots=20.0,
        distance_nm=3000.0,
        fuel_type="VLSFO",
        wind_speed_knots=15.0,
        wave_height_m=1.8
    )
    
    assert pred["predicted_fuel_consumption_kg"] > 10000.0
    assert pred["predicted_fuel_consumption_tonnes"] > 10.0
    assert pred["estimated_voyage_hours"] == 150.0 # 3000 / 20
    assert pred["fuel_cost_usd"] > 0.0
    assert pred["direct_co2_emissions_tonnes"] > 0.0
    assert pred["well_to_wake_emissions_tonnes"] > 0.0
    assert len(pred["confidence_interval_95_kg"]) == 2
    assert pred["confidence_interval_95_kg"][0] < pred["predicted_fuel_consumption_kg"]
    assert pred["confidence_interval_95_kg"][1] > pred["predicted_fuel_consumption_kg"]

def test_fuel_predictor_speed_cubic_sensitivity():
    # Naval architecture physical test: higher speed should consume significantly more fuel
    pred_slow = FuelPredictor.predict_voyage(
        vessel_type="Container",
        deadweight_tonnage=120000.0,
        engine_power_kw=58000.0,
        cargo_load_tonnes=95000.0,
        speed_knots=14.0,
        distance_nm=3000.0,
        fuel_type="VLSFO"
    )
    
    pred_fast = FuelPredictor.predict_voyage(
        vessel_type="Container",
        deadweight_tonnage=120000.0,
        engine_power_kw=58000.0,
        cargo_load_tonnes=95000.0,
        speed_knots=22.0,
        distance_nm=3000.0,
        fuel_type="VLSFO"
    )
    
    # 22 knots vs 14 knots should have notably higher consumption
    assert pred_fast["predicted_fuel_consumption_kg"] > pred_slow["predicted_fuel_consumption_kg"] * 1.5

def test_fuel_predictor_invalid_inputs():
    with pytest.raises(ValueError):
        FuelPredictor.predict_voyage(
            vessel_type="Container",
            deadweight_tonnage=120000.0,
            engine_power_kw=58000.0,
            cargo_load_tonnes=95000.0,
            speed_knots=-5.0, # Negative speed
            distance_nm=3000.0
        )

