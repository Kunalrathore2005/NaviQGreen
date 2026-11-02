import pytest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.optimization.problem import (
    ProblemVessel,
    ProblemRoute,
    FleetProblemInstance,
    evaluate_fleet_solution
)
from app.optimization.qea import QEASolver
from app.optimization.baselines import GASolver, SASolver, ExactGreedySolver

@pytest.fixture
def sample_instance():
    vessels = [
        ProblemVessel(
            vessel_id="V1",
            vessel_name="Carrier Alpha",
            vessel_type="Container",
            deadweight_tonnage=100000.0,
            cargo_capacity_tonnes=90000.0,
            engine_power_kw=50000.0,
            min_speed_knots=12.0,
            max_speed_knots=24.0,
            compatible_fuels=["VLSFO", "LNG"],
            daily_charter_cost_usd=25000.0,
            crew_cost_per_day_usd=5000.0
        ),
        ProblemVessel(
            vessel_id="V2",
            vessel_name="Carrier Beta",
            vessel_type="Container",
            deadweight_tonnage=70000.0,
            cargo_capacity_tonnes=65000.0,
            engine_power_kw=35000.0,
            min_speed_knots=11.0,
            max_speed_knots=22.0,
            compatible_fuels=["VLSFO", "Methanol"],
            daily_charter_cost_usd=18000.0,
            crew_cost_per_day_usd=4200.0
        ),
    ]
    
    routes = [
        ProblemRoute(
            route_code="R1",
            origin_port="SGSIN",
            destination_port="NLRTM",
            distance_nm=4000.0,
            required_cargo_tonnes=80000.0,
            arrival_deadline_hours=250.0,
            destination_has_shore_power=True
        )
    ]
    
    return FleetProblemInstance(vessels=vessels, routes=routes)

def test_candidate_evaluation_feasible(sample_instance):
    # Assign Vessel V1 to Route R1
    matrix = [[1], [0]]
    speeds = [18.0, 15.0]
    fuels = ["VLSFO", "VLSFO"]
    shores = [True, False]
    
    evaluation = evaluate_fleet_solution(sample_instance, matrix, speeds, fuels, shores)
    assert evaluation.is_feasible is True
    assert evaluation.total_cost_usd > 0
    assert evaluation.total_fuel_tonnes > 0
    assert evaluation.total_lifecycle_emissions_tco2eq > 0
    assert len(evaluation.assignments) == 1
    assert evaluation.cargo_fulfillment_rate_pct >= 95.0

def test_candidate_evaluation_infeasible_deadline(sample_instance):
    # Assign Vessel V1 at very slow speed (too slow for deadline 250h on 4000nm -> 4000/12 = 333h > 250h)
    matrix = [[1], [0]]
    speeds = [12.0, 15.0]
    fuels = ["VLSFO", "VLSFO"]
    shores = [False, False]
    
    evaluation = evaluate_fleet_solution(sample_instance, matrix, speeds, fuels, shores)
    assert evaluation.is_feasible is False
    assert any("misses deadline" in v for v in evaluation.constraint_violations)
    assert evaluation.penalty_value > 0

def test_qea_solver_execution_and_reproducibility(sample_instance):
    qea1 = QEASolver(sample_instance, population_size=10, generations=10, random_seed=42)
    res1 = qea1.solve()
    
    assert res1["algorithm"] == "QEA"
    assert "best_objective" in res1
    assert len(res1["convergence_history"]) == 10
    assert res1["runtime_ms"] > 0
    
    # Reproducibility check with same seed
    qea2 = QEASolver(sample_instance, population_size=10, generations=10, random_seed=42)
    res2 = qea2.solve()
    assert res1["best_objective"] == res2["best_objective"]
    assert res1["best_binary"] == res2["best_binary"]

def test_ga_and_sa_baselines(sample_instance):
    ga = GASolver(sample_instance, population_size=10, generations=10, random_seed=42)
    res_ga = ga.solve()
    assert res_ga["algorithm"] == "GA"
    assert res_ga["best_objective"] > 0
    assert len(res_ga["convergence_history"]) == 10
    
    sa = SASolver(sample_instance, population_size=10, generations=10, random_seed=42)
    res_sa = sa.solve()
    assert res_sa["algorithm"] == "SA"
    assert res_sa["best_objective"] > 0
    assert len(res_sa["convergence_history"]) == 10

def test_exact_greedy_baseline(sample_instance):
    exact = ExactGreedySolver(sample_instance)
    res_exact = exact.solve()
    assert res_exact["algorithm"] == "EXACT_GREEDY"
    assert res_exact["best_evaluation"] is not None

