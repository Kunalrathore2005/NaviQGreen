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

def test_geospatial_summary_and_corridors(client):
    res = client.get("/api/v1/geospatial/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["status"] == "online"
    assert summary["total_monitored_vessels"] > 0
    assert summary["active_global_corridors"] > 0

    corr_res = client.get("/api/v1/geospatial/corridors")
    assert corr_res.status_code == 200
    corridors = corr_res.json()
    assert len(corridors) >= 4
    assert any(c["id"] == "corridor-asia-europe-suez" for c in corridors)

def test_geospatial_vessels_and_ecas(client):
    v_res = client.get("/api/v1/geospatial/vessels")
    assert v_res.status_code == 200
    vessels = v_res.json()
    assert len(vessels) >= 5
    assert any("cii_rating" in v for v in vessels)

    eca_res = client.get("/api/v1/geospatial/ecas")
    assert eca_res.status_code == 200
    ecas = eca_res.json()
    assert len(ecas) >= 2

def test_quantum_lab_spec(client):
    res = client.get("/api/v1/quantum-lab/spec")
    assert res.status_code == 200
    spec = res.json()
    assert "Han, K. H." in spec["citation"]
    assert len(spec["han_kim_lookup_table"]) > 0

def test_quantum_lab_rotation_operator(client):
    # Test CCW rotation when x=0, b=1, alpha*beta > 0
    payload = {
        "alpha": 0.707106,
        "beta": 0.707106,
        "x_bit": 0,
        "best_bit": 1,
        "fitness_is_worse": True,
        "step_size_deg": 4.5
    }
    res = client.post("/api/v1/quantum-lab/rotate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["delta_theta_applied_deg"] == 4.5
    # Probability of 1 should increase after rotation toward |1>
    assert data["state_after"]["p_one"] > data["state_before"]["p_one"]
    # Check unit circle normalization sum(P) == 1
    p_sum = data["state_after"]["p_zero"] + data["state_after"]["p_one"]
    assert pytest.approx(p_sum, abs=1e-3) == 1.0

def test_quantum_lab_measurement_collapse(client):
    payload = {
        "alpha": 0.707106,
        "beta": 0.707106,
        "num_measurements": 500
    }
    res = client.post("/api/v1/quantum-lab/measure", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["trials"] == 500
    assert data["measured_zeros"] + data["measured_ones"] == 500
    # Head sequence length check
    assert len(data["sample_head_sequence"]) == 20

def test_quantum_lab_catastrophe_operator(client):
    payload = {
        "num_bits": 12,
        "stagnation_bias": 0.99
    }
    res = client.post("/api/v1/quantum-lab/catastrophe", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["num_bits"] == 12
    assert data["catastrophe_triggered"] is True
    # After catastrophe reset, state should be restored to max entropy superposition (H ~ 1.0)
    assert data["entropy_after"] >= 0.99
