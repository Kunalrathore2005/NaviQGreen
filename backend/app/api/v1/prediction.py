from fastapi import APIRouter, HTTPException, status
from app.schemas import PredictionRequest, PredictionResponse
from app.ml.fuel_predictor import FuelPredictor, train_and_evaluate_pipeline

router = APIRouter(prefix="/prediction", tags=["Fuel Consumption Prediction"])

@router.get("/model-info")
def get_model_info():
    if not FuelPredictor.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML pipeline artifact not ready. Trigger retraining via /prediction/train."
        )
    return FuelPredictor.get_metadata()

@router.post("/train")
def train_model():
    """
    Retrains candidate models (Dummy, Random Forest, Gradient Boosting, XGBoost),
    evaluates on held-out test data, selects top performer, and saves serialized artifact.
    """
    try:
        metadata = train_and_evaluate_pipeline()
        return {
            "status": "success",
            "message": f"Successfully trained and deployed {metadata['selected_model']}",
            "metrics": metadata["metrics"],
            "all_candidates": metadata["all_candidate_metrics"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training failed: {str(e)}"
        )

@router.post("/predict", response_model=PredictionResponse)
def predict_fuel(req: PredictionRequest):
    try:
        result = FuelPredictor.predict_voyage(
            vessel_type=req.vessel_type,
            deadweight_tonnage=req.deadweight_tonnage,
            engine_power_kw=req.engine_power_kw,
            cargo_load_tonnes=req.cargo_load_tonnes,
            speed_knots=req.speed_knots,
            distance_nm=req.distance_nm,
            fuel_type=req.fuel_type,
            wind_speed_knots=req.wind_speed_knots,
            wave_height_m=req.wave_height_m
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction error: {str(e)}")

