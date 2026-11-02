"""
NaviQGreen Machine Learning Pipeline for Vessel Fuel Consumption Prediction
Trains, evaluates, serializes, and serves physics-informed ML models.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from app.core.config import settings
from app.emissions.fuel_costs_emissions_engine import FuelCostEmissionsEngine

logger = logging.getLogger("naviqgreen.ml")

CATEGORICAL_FEATURES = ["vessel_type", "fuel_type"]
NUMERICAL_FEATURES = [
    "deadweight_tonnage",
    "engine_power_kw",
    "cargo_load_tonnes",
    "load_factor",
    "speed_knots",
    "distance_nm",
    "voyage_duration_hours",
    "wind_speed_knots",
    "wave_height_m",
]

TARGET_COL = "fuel_consumption_kg"

MODEL_ARTIFACT_PATH = Path(settings.ARTIFACTS_DIR) / "fuel_model_v1.joblib"
METADATA_ARTIFACT_PATH = Path(settings.ARTIFACTS_DIR) / "model_metadata.json"


def train_and_evaluate_pipeline(
    csv_path: Optional[str] = None,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Executes the training workflow:
    1. Loads dataset
    2. Validates features and target
    3. Train/test split (80/20)
    4. Evaluates Dummy, Random Forest, Gradient Boosting, XGBoost
    5. Selects top performer based on R2 and MAE
    6. Serializes model artifact and metadata
    """
    if csv_path is None:
        csv_path = str(Path(settings.DATASETS_DIR) / "fuel_consumption_training.csv")
        
    if not Path(csv_path).exists():
        logger.info(f"Training dataset {csv_path} not found. Generating seed datasets...")
        from app.data.seed_datasets import seed_all_csv_files
        seed_all_csv_files()

    df = pd.read_csv(csv_path)
    
    # Feature validation
    missing_cols = [c for c in CATEGORICAL_FEATURES + NUMERICAL_FEATURES + [TARGET_COL] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")
        
    X = df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    y = df[TARGET_COL]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state
    )
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ]
    )
    
    candidates = {
        "DummyBaseline": DummyRegressor(strategy="median"),
        "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=16, random_state=random_state, n_jobs=-1),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=6, random_state=random_state),
    }
    
    if XGBOOST_AVAILABLE:
        candidates["XGBoost"] = XGBRegressor(n_estimators=120, learning_rate=0.08, max_depth=6, random_state=random_state, n_jobs=-1)
        
    results = {}
    best_name = None
    best_r2 = -float("inf")
    best_pipeline = None
    
    for name, estimator in candidates.items():
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", estimator)
        ])
        
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))
        mape = float(np.mean(np.abs((y_test - preds) / np.maximum(y_test, 1e-5))) * 100.0)
        
        results[name] = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(r2, 4),
            "mape": round(mape, 2),
        }
        
        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            best_pipeline = pipeline

    # Calculate residual standard deviation for confidence interval
    best_preds = best_pipeline.predict(X_test)
    residuals = y_test - best_preds
    residual_std = float(np.std(residuals))

    metadata = {
        "selected_model": best_name,
        "model_version": "v1.2.0-hydro-physics",
        "trained_date": pd.Timestamp.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": results[best_name],
        "all_candidate_metrics": results,
        "residual_std_kg": round(residual_std, 2),
        "target_col": TARGET_COL,
        "target_unit": "kg per voyage",
        "data_provenance": "NaviQGreen Hydrodynamic Physics-Informed Fleet Dataset (Calibrated on IMO 4th GHG Study Baselines)",
        "limitations": "Model assumes displacement hull forms between 8-25 knots under Douglas sea states 1-6. Not calibrated for high-speed planing craft or extreme arctic ice navigation."
    }
    
    # Save artifacts
    Path(settings.ARTIFACTS_DIR).mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipeline, MODEL_ARTIFACT_PATH)
    with open(METADATA_ARTIFACT_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Successfully trained and saved model {best_name} with R2={best_r2:.4f}")
    return metadata


class FuelPredictor:
    """
    Inference service for vessel fuel consumption prediction.
    """
    _pipeline = None
    _metadata = None
    
    @classmethod
    def load(cls):
        if cls._pipeline is None:
            if not MODEL_ARTIFACT_PATH.exists() or not METADATA_ARTIFACT_PATH.exists():
                logger.info("Artifact not found, training initial pipeline...")
                train_and_evaluate_pipeline()
                
            cls._pipeline = joblib.load(MODEL_ARTIFACT_PATH)
            with open(METADATA_ARTIFACT_PATH, "r", encoding="utf-8") as f:
                cls._metadata = json.load(f)

    @classmethod
    def is_available(cls) -> bool:
        return MODEL_ARTIFACT_PATH.exists() and METADATA_ARTIFACT_PATH.exists()

    @classmethod
    def get_metadata(cls) -> Dict[str, Any]:
        cls.load()
        return cls._metadata or {}

    @classmethod
    def predict_voyage(
        cls,
        vessel_type: str,
        deadweight_tonnage: float,
        engine_power_kw: float,
        cargo_load_tonnes: float,
        speed_knots: float,
        distance_nm: float,
        fuel_type: str = "VLSFO",
        wind_speed_knots: float = 14.0,
        wave_height_m: float = 1.5,
    ) -> Dict[str, Any]:
        """
        Validates inputs and predicts fuel consumption, costs, and emissions.
        """
        cls.load()
        
        # Physical bounds validation
        if speed_knots <= 0:
            raise ValueError("Speed must be strictly positive.")
        if distance_nm <= 0:
            raise ValueError("Distance must be strictly positive.")
        if deadweight_tonnage <= 0:
            raise ValueError("Deadweight tonnage must be positive.")
            
        load_factor = min(max(cargo_load_tonnes / max(deadweight_tonnage, 1.0), 0.05), 1.05)
        voyage_hours = distance_nm / speed_knots
        
        input_dict = {
            "vessel_type": [vessel_type],
            "fuel_type": [fuel_type],
            "deadweight_tonnage": [deadweight_tonnage],
            "engine_power_kw": [engine_power_kw],
            "cargo_load_tonnes": [cargo_load_tonnes],
            "load_factor": [load_factor],
            "speed_knots": [speed_knots],
            "distance_nm": [distance_nm],
            "voyage_duration_hours": [voyage_hours],
            "wind_speed_knots": [wind_speed_knots],
            "wave_height_m": [wave_height_m],
        }
        
        input_df = pd.DataFrame(input_dict)
        pred_kg = float(cls._pipeline.predict(input_df)[0])
        pred_kg = max(pred_kg, 100.0) # Lower physical limit
        pred_tonnes = pred_kg / 1000.0
        
        # 95% Confidence interval based on test residual std error (1.96 * sigma)
        sigma = cls._metadata.get("residual_std_kg", pred_kg * 0.04)
        lower_bound_kg = max(100.0, pred_kg - 1.96 * sigma)
        upper_bound_kg = pred_kg + 1.96 * sigma
        
        # Emissions and costs evaluation
        eval_res = FuelCostEmissionsEngine.evaluate_voyage(
            base_vlsfo_consumption_tonnes=pred_tonnes,
            fuel_type=fuel_type
        )
        
        return {
            "predicted_fuel_consumption_kg": round(pred_kg, 1),
            "predicted_fuel_consumption_tonnes": round(pred_tonnes, 3),
            "estimated_voyage_hours": round(voyage_hours, 2),
            "fuel_cost_usd": eval_res["fuel_cost_usd"],
            "direct_co2_emissions_tonnes": eval_res["direct_emissions"]["total_direct_co2eq_tonnes"],
            "well_to_wake_emissions_tonnes": eval_res["lifecycle_emissions_tco2eq"],
            "model_name": cls._metadata.get("selected_model", "GradientBoosting"),
            "model_version": cls._metadata.get("model_version", "v1.0"),
            "data_provenance": cls._metadata.get("data_provenance", "NaviQGreen Physics Baseline"),
            "confidence_interval_95_kg": [round(lower_bound_kg, 1), round(upper_bound_kg, 1)],
            "input_summary": {
                "vessel_type": vessel_type,
                "deadweight_tonnage": deadweight_tonnage,
                "speed_knots": speed_knots,
                "distance_nm": distance_nm,
                "cargo_load_tonnes": cargo_load_tonnes,
                "fuel_type": fuel_type,
            }
        }

