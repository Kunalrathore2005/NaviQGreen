from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.ml.fuel_predictor import FuelPredictor

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Database ping
    db_healthy = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_healthy = False
        
    ml_healthy = FuelPredictor.is_available()
    
    return {
        "status": "online" if db_healthy else "degraded",
        "service": "NaviQGreen Backend Engine",
        "version": "1.0.0",
        "database_connected": db_healthy,
        "ml_pipeline_ready": ml_healthy,
        "quantum_inspired_solver_ready": True
    }

