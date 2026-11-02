from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.vessels import router as vessels_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.prediction import router as prediction_router
from app.api.v1.emissions import router as emissions_router
from app.api.v1.optimization import router as optimization_router
from app.api.v1.scenarios import router as scenarios_router
from app.api.v1.benchmarks import router as benchmarks_router
from app.api.v1.reports import router as reports_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.geospatial import router as geospatial_router
from app.api.v1.quantum_lab import router as quantum_lab_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(vessels_router)
api_router.include_router(datasets_router)
api_router.include_router(prediction_router)
api_router.include_router(emissions_router)
api_router.include_router(optimization_router)
api_router.include_router(scenarios_router)
api_router.include_router(benchmarks_router)
api_router.include_router(reports_router)
api_router.include_router(dashboard_router)
api_router.include_router(geospatial_router)
api_router.include_router(quantum_lab_router)

