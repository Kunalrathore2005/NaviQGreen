from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import BenchmarkRunRequest, BenchmarkSuiteResponse
from app.services.benchmark_service import BenchmarkService

router = APIRouter(prefix="/benchmarks", tags=["Benchmark Laboratory"])

@router.post("/run", response_model=BenchmarkSuiteResponse)
def run_benchmark_laboratory(req: BenchmarkRunRequest, db: Session = Depends(get_db)):
    return BenchmarkService.run_benchmark(db, req)

@router.get("/default", response_model=BenchmarkSuiteResponse)
def get_default_benchmark(db: Session = Depends(get_db)):
    default_req = BenchmarkRunRequest(
        benchmark_name="NaviQGreen Quantum-Inspired Benchmark Suite",
        problem_scale="STANDARD",
        algorithms=["QEA", "GA", "SA", "EXACT_GREEDY"],
        population_size=20,
        generations=25,
        runs_per_algorithm=2,
        random_seed=42
    )
    return BenchmarkService.run_benchmark(db, default_req)

