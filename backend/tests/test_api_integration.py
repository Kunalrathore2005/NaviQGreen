import pytest
import sys
from pathlib import Path
from starlette.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app, init_db_seeds

@pytest.fixture(scope="module")
def client():
    init_db_seeds()
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("online", "degraded")
    assert data["service"] == "NaviQGreen Backend Engine"

def test_demo_login(client):
    response = client.post("/api/v1/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "captain@naviqgreen.maritime"

def test_vessels_list(client):
    response = client.get("/api/v1/vessels")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    assert any(v["vessel_id"] == "VES-CNT-01" for v in data)

def test_vessel_detail(client):
    response = client.get("/api/v1/vessels/VES-CNT-01")
    assert response.status_code == 200
    vessel = response.json()
    assert vessel["vessel_name"] == "Pacific Pioneer"
    assert "LNG" in vessel["compatible_fuels"]

def test_prediction_endpoint(client):
    payload = {
        "vessel_type": "Container",
        "deadweight_tonnage": 120000.0,
        "engine_power_kw": 58000.0,
        "cargo_load_tonnes": 95000.0,
        "speed_knots": 19.5,
        "distance_nm": 3200.0,
        "fuel_type": "VLSFO",
        "wind_speed_knots": 14.0,
        "wave_height_m": 1.6
    }
    response = client.post("/api/v1/prediction/predict", json=payload)
    assert response.status_code == 200
    pred = response.json()
    assert pred["predicted_fuel_consumption_kg"] > 0
    assert pred["fuel_cost_usd"] > 0
    assert pred["direct_co2_emissions_tonnes"] > 0

def test_emissions_calculation_endpoint(client):
    payload = {
        "fuel_type": "Methanol",
        "fuel_consumption_tonnes": 50.0,
        "berth_hours": 24.0,
        "shore_power_used": True,
        "port_code": "SGSIN"
    }
    response = client.post("/api/v1/emissions/calculate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["fuel_cost_usd"] > 0
    assert res["shore_power_electricity_kwh"] > 0

def test_optimization_run_qea(client):
    payload = {
        "job_name": "Integration Test QEA Run",
        "algorithm": "QEA",
        "population_size": 10,
        "generations": 10,
        "random_seed": 42
    }
    response = client.post("/api/v1/optimization/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "QEA"
    assert "vessel_assignments" in data
    assert len(data["convergence_history"]) == 10

def test_scenarios_lab_endpoint(client):
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert len(data["scenarios"]) >= 6

def test_dashboard_summary_endpoint(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_vessels"] >= 5
    assert data["total_cargo_demand_tonnes"] > 0
    assert "speed_vs_consumption_curve" in data

