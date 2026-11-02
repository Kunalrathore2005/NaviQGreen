from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import ScenarioLabResponse, ScenarioSimulateRequest
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/scenarios", tags=["Alternative Fuel Scenarios Lab"])

@router.get("", response_model=ScenarioLabResponse)
def get_default_scenarios(db: Session = Depends(get_db)):
    return ScenarioService.run_all_scenarios(db)

@router.post("/simulate", response_model=ScenarioLabResponse)
def simulate_scenario(req: ScenarioSimulateRequest, db: Session = Depends(get_db)):
    return ScenarioService.run_all_scenarios(db, custom_req=req)

