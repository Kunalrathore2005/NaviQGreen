from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import OptimizationJob, Vessel, VoyageRoute
from app.optimization.problem import (
    ProblemVessel,
    ProblemRoute,
    FleetProblemInstance,
    SolutionEvaluation
)
from app.optimization.qea import QEASolver
from app.optimization.baselines import GASolver, SASolver, ExactGreedySolver
from app.schemas import (
    OptimizationRunRequest,
    OptimizationResultResponse,
    AssignedVesselPlan
)

router = APIRouter(prefix="/optimization", tags=["Fleet Optimization Engine"])

@router.post("/run", response_model=OptimizationResultResponse)
def run_optimization(req: OptimizationRunRequest, db: Session = Depends(get_db)):
    # 1. Fetch available vessels
    vessel_query = db.query(Vessel).filter(Vessel.availability_status == "AVAILABLE")
    if req.selected_vessel_ids:
        vessel_query = vessel_query.filter(Vessel.vessel_id.in_(req.selected_vessel_ids))
    db_vessels = vessel_query.all()
    
    if not db_vessels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available vessels matching criteria found in fleet."
        )

    # 2. Fetch routes
    route_query = db.query(VoyageRoute)
    if req.selected_route_codes:
        route_query = route_query.filter(VoyageRoute.route_code.in_(req.selected_route_codes))
    db_routes = route_query.all()
    
    if not db_routes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No voyage routes selected or found."
        )

    # Build problem instance
    vessels = [
        ProblemVessel(
            vessel_id=v.vessel_id,
            vessel_name=v.vessel_name,
            vessel_type=v.vessel_type,
            deadweight_tonnage=v.deadweight_tonnage,
            cargo_capacity_tonnes=v.cargo_capacity_tonnes,
            engine_power_kw=v.engine_power_kw,
            min_speed_knots=v.minimum_speed_knots,
            max_speed_knots=v.maximum_speed_knots,
            compatible_fuels=v.compatible_fuels,
            daily_charter_cost_usd=v.daily_charter_cost_usd,
            crew_cost_per_day_usd=v.crew_cost_per_day_usd
        )
        for v in db_vessels
    ]

    routes = [
        ProblemRoute(
            route_code=r.route_code,
            origin_port=r.origin_port_code,
            destination_port=r.destination_port_code,
            distance_nm=r.distance_nm,
            required_cargo_tonnes=r.required_cargo_tonnes,
            arrival_deadline_hours=r.arrival_deadline_hours,
            wind_speed_knots=r.avg_wind_speed_knots,
            wave_height_m=r.avg_wave_height_m,
            destination_has_shore_power=True
        )
        for r in db_routes
    ]

    instance = FleetProblemInstance(
        vessels=vessels,
        routes=routes,
        weight_cost=req.weights.cost,
        weight_fuel=req.weights.fuel,
        weight_emissions=req.weights.emissions,
        max_emissions_cap_tco2=req.constraints.max_allowable_emissions_tco2,
        mandatory_shore_power=req.constraints.mandatory_shore_power
    )

    # Execute selected algorithm
    algo = req.algorithm.upper().strip()
    if algo == "QEA":
        solver = QEASolver(instance, population_size=req.population_size, generations=req.generations, random_seed=req.random_seed)
        res = solver.solve()
    elif algo == "GA":
        solver = GASolver(instance, population_size=req.population_size, generations=req.generations, random_seed=req.random_seed)
        res = solver.solve()
    elif algo == "SA":
        solver = SASolver(instance, population_size=req.population_size, generations=req.generations, random_seed=req.random_seed)
        res = solver.solve()
    elif algo in ("EXACT_GREEDY", "EXACT", "GREEDY"):
        solver = ExactGreedySolver(instance)
        res = solver.solve()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported algorithm '{req.algorithm}'. Supported: QEA, GA, SA, EXACT_GREEDY."
        )

    ev: SolutionEvaluation = res["best_evaluation"]

    # Save job record
    job = OptimizationJob(
        job_name=req.job_name,
        status="COMPLETED",
        algorithm=algo,
        population_size=req.population_size,
        generations=req.generations,
        random_seed=req.random_seed,
        weights=req.weights.model_dump(),
        constraints=req.constraints.model_dump(),
        is_feasible=res["is_feasible"],
        best_objective_value=res["best_objective"],
        best_solution={
            "assignments": [a.__dict__ for a in ev.assignments],
            "total_cost_usd": ev.total_cost_usd,
            "total_fuel_tonnes": ev.total_fuel_tonnes,
            "total_lifecycle_emissions_tco2eq": ev.total_lifecycle_emissions_tco2eq,
            "total_cargo_fulfilled_tonnes": ev.total_cargo_fulfilled_tonnes,
            "total_cargo_demanded_tonnes": ev.total_cargo_demanded_tonnes,
            "cargo_fulfillment_rate_pct": ev.cargo_fulfillment_rate_pct,
            "fleet_capacity_utilization_pct": ev.fleet_capacity_utilization_pct,
            "penalty_value": ev.penalty_value,
            "constraint_violations": ev.constraint_violations
        },
        convergence_history=res["convergence_history"],
        runtime_ms=res["runtime_ms"],
        completed_at=datetime.utcnow()
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Build response
    assignments_plan = [
        AssignedVesselPlan(
            vessel_id=a.vessel_id,
            vessel_name=a.vessel_name,
            vessel_type=a.vessel_type,
            route_code=a.route_code,
            origin_port=a.origin_port,
            destination_port=a.destination_port,
            distance_nm=a.distance_nm,
            allocated_cargo_tonnes=a.allocated_cargo_tonnes,
            capacity_utilization_pct=a.capacity_utilization_pct,
            chosen_speed_knots=a.chosen_speed_knots,
            chosen_fuel=a.chosen_fuel,
            voyage_duration_hours=a.voyage_duration_hours,
            deadline_hours=a.deadline_hours,
            arrival_margin_hours=a.arrival_margin_hours,
            fuel_consumption_tonnes=a.fuel_consumption_tonnes,
            fuel_cost_usd=a.fuel_cost_usd,
            operating_cost_usd=a.operating_cost_usd,
            total_cost_usd=a.total_cost_usd,
            direct_emissions_tco2=a.direct_emissions_tco2,
            lifecycle_emissions_tco2eq=a.lifecycle_emissions_tco2eq,
            shore_power_applied=a.shore_power_applied
        )
        for a in ev.assignments
    ]

    return OptimizationResultResponse(
        job_id=job.id,
        job_name=job.job_name,
        algorithm=job.algorithm,
        status=job.status,
        is_feasible=ev.is_feasible,
        runtime_ms=job.runtime_ms,
        generations_run=res["generations_run"],
        random_seed=job.random_seed,
        total_cost_usd=ev.total_cost_usd,
        total_fuel_tonnes=ev.total_fuel_tonnes,
        total_lifecycle_emissions_tco2eq=ev.total_lifecycle_emissions_tco2eq,
        total_cargo_fulfilled_tonnes=ev.total_cargo_fulfilled_tonnes,
        total_cargo_demanded_tonnes=ev.total_cargo_demanded_tonnes,
        cargo_fulfillment_rate_pct=ev.cargo_fulfillment_rate_pct,
        fleet_capacity_utilization_pct=ev.fleet_capacity_utilization_pct,
        penalty_value=ev.penalty_value,
        vessel_assignments=assignments_plan,
        convergence_history=res["convergence_history"],
        constraint_violations=ev.constraint_violations,
        weights_used=job.weights,
        created_at=job.created_at
    )

@router.get("/jobs")
def list_optimization_jobs(db: Session = Depends(get_db)):
    jobs = db.query(OptimizationJob).order_by(OptimizationJob.created_at.desc()).limit(50).all()
    return jobs

@router.get("/jobs/{job_id}", response_model=OptimizationResultResponse)
def get_optimization_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Optimization job not found.")
        
    solution = job.best_solution or {}
    raw_assignments = solution.get("assignments", [])
    
    assignments_plan = [
        AssignedVesselPlan(
            vessel_id=a["vessel_id"],
            vessel_name=a["vessel_name"],
            vessel_type=a["vessel_type"],
            route_code=a["route_code"],
            origin_port=a["origin_port"],
            destination_port=a["destination_port"],
            distance_nm=a["distance_nm"],
            allocated_cargo_tonnes=a["allocated_cargo_tonnes"],
            capacity_utilization_pct=a["capacity_utilization_pct"],
            chosen_speed_knots=a["chosen_speed_knots"],
            chosen_fuel=a["chosen_fuel"],
            voyage_duration_hours=a["voyage_duration_hours"],
            deadline_hours=a["deadline_hours"],
            arrival_margin_hours=a["arrival_margin_hours"],
            fuel_consumption_tonnes=a["fuel_consumption_tonnes"],
            fuel_cost_usd=a["fuel_cost_usd"],
            operating_cost_usd=a["operating_cost_usd"],
            total_cost_usd=a["total_cost_usd"],
            direct_emissions_tco2=a["direct_emissions_tco2"],
            lifecycle_emissions_tco2eq=a["lifecycle_emissions_tco2eq"],
            shore_power_applied=a["shore_power_applied"]
        )
        for a in raw_assignments
    ]

    return OptimizationResultResponse(
        job_id=job.id,
        job_name=job.job_name,
        algorithm=job.algorithm,
        status=job.status,
        is_feasible=job.is_feasible,
        runtime_ms=job.runtime_ms,
        generations_run=job.generations,
        random_seed=job.random_seed,
        total_cost_usd=solution.get("total_cost_usd", 0.0),
        total_fuel_tonnes=solution.get("total_fuel_tonnes", 0.0),
        total_lifecycle_emissions_tco2eq=solution.get("total_lifecycle_emissions_tco2eq", 0.0),
        total_cargo_fulfilled_tonnes=solution.get("total_cargo_fulfilled_tonnes", 0.0),
        total_cargo_demanded_tonnes=solution.get("total_cargo_demanded_tonnes", 0.0),
        cargo_fulfillment_rate_pct=solution.get("cargo_fulfillment_rate_pct", 0.0),
        fleet_capacity_utilization_pct=solution.get("fleet_capacity_utilization_pct", 0.0),
        penalty_value=solution.get("penalty_value", 0.0),
        vessel_assignments=assignments_plan,
        convergence_history=job.convergence_history or [],
        constraint_violations=solution.get("constraint_violations", []),
        weights_used=job.weights,
        created_at=job.created_at
    )

