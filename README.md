# NaviQGreen — Quantum-Inspired Green Fleet Intelligence & Optimization Platform

[![SIH Problem Statement](https://img.shields.io/badge/SIH%20Problem%20Statement-SIH26138-00B4D8?style=flat-square)](https://www.sih.gov.in/)
[![Theme](https://img.shields.io/badge/Theme-Clean%20%26%20Green%20Technology-10B981?style=flat-square)](https://www.sih.gov.in/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy%20%7C%20Pydantic-0B192C?style=flat-square)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20TailwindCSS-38BDF8?style=flat-square)](https://react.dev/)
[![ML Pipeline](https://img.shields.io/badge/ML%20Engine-XGBoost%20%7C%20Scikit--Learn-F59E0B?style=flat-square)](https://xgboost.readthedocs.io/)
[![Optimization](https://img.shields.io/badge/Optimizer-Quantum--Inspired%20QEA%20%7C%20GA%20%7C%20SA-8B5CF6?style=flat-square)](./docs/qea_specification.md)
[![Tests](https://img.shields.io/badge/Tests-31%20Passed%20(100%25)-10B981?style=flat-square)](./backend/tests)

> **NaviQGreen** is a full-stack, enterprise-grade decision-support platform designed for commercial shipowners, charterers, and port authorities. It unites **physics-informed machine learning**, a **unit-consistent Well-to-Wake (WTW) lifecycle emissions engine**, and a genuine classical **Quantum-Inspired Evolutionary Algorithm (QEA)** to answer the core operational question:
> 
> *"Given an available fleet, cargo commitments, routes, weather conditions, and environmental regulations, which feasible fleet configuration minimizes voyage cost, fuel consumption, and lifecycle greenhouse gas emissions?"*

---

## 1. Executive Summary & Capabilities

Commercial maritime shipping carries over 80% of global trade volume while accounting for approximately 3% of global anthropogenic greenhouse gas emissions. Under the **International Maritime Organization (IMO) 2030/2050 Decarbonization Strategy** and the **European Union Emissions Trading System (EU ETS)**, fleet operators face strict carbon intensity targets alongside escalating bunker fuel costs.

NaviQGreen solves this multi-dimensional challenge through an integrated software suite:
- **Maritime GIS Digital Twin**: Real-time Leaflet geospatial map displaying global container & tanker corridors (Suez, Cape of Good Hope, Transatlantic, Malacca), IMO Tier III ECAs, cold-ironing smart ports, live vessel telemetry with heading vectors and CII ratings, and an interactive slow-steaming hydrodynamics simulator ($P \propto v^{3.15}$) backed by 100% free, zero-watermark open GIS tiles (Esri Dark Canvas, Ocean Bathymetry, OSM Night).
- **Interactive Quantum State & Q-Bit Lab**: Educational and analytical visualizer rendering the 2D Hilbert / Bloch unit circle ($|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$), real-time Han & Kim (2002) reversible unitary rotation gates $U(\Delta\theta)$, Monte Carlo wavefunction collapse simulator, and Shannon entropy catastrophe recovery operator.
- **Hydrodynamic ML Fuel Predictor**: Physics-informed gradient boosting models (XGBoost $R^2 = 0.9932$, $\text{MAPE} = 5.25\%$) estimating fuel burn across vessel classes, hull conditions, draft variations, and Beaufort sea states.
- **Unit-Consistent Cost & Emissions Engine**: Calculations for Tank-to-Wake (TTW) combustion, Well-to-Wake (WTW) upstream emissions, IPCC AR5 Global Warming Potentials ($CH_4$, $N_2O$), and port cold ironing (shore power).
- **Quantum-Inspired Optimization Engine (QEA)**: A classical evolutionary metaheuristic using probabilistic Q-bits and Han & Kim 2D unitary rotation gates to explore high-dimensional combinatorial fleet assignment problems without local minima trapping.
- **Empirical Benchmarking Laboratory**: Fair, budget-controlled scientific comparison of QEA against classical Genetic Algorithm (GA), Simulated Annealing (SA), and Exact Deterministic baselines.
- **Alternative Fuel Scenario Simulator**: Head-to-head operational analysis of transitional fuels (VLSFO, LNG, Bio-Methanol, Green Ammonia, Hydrogen, Shore Power).
- **Interactive Full-Stack Web Platform**: Responsive, high-density React 18 + TypeScript analytical UI styled in deep maritime navy (`#060D17`), ocean blue, and sustainability emerald.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------+
|                           REACT 18 + TYPESCRIPT SPA UI                            |
|  Tailwind CSS | Recharts Data Visualization | Lucide Icons | Axios Client Interceptor  |
|                                                                                   |
|  [Dashboard]      [Maritime GIS Twin]  [Fleet Manager]    [Vessel Detail]         |
|  [Quantum Lab]    [Dataset Studio]     [ML Predictor]     [Emissions & Cost]      |
|  [Optimizer]      [Results Lab]        [Alternative Fuels][Benchmarks Lab]        |
|  [History]        [Reports Center]     [Settings]         [Authentication]        |
+-----------------------------------------------------------------------------------+
                                          |
                                 REST APIs (HTTP / JSON)
                                          v
+-----------------------------------------------------------------------------------+
|                             FASTAPI REST API SERVER                               |
|                     Pydantic v2 Validation | JWT Security                         |
|                                                                                   |
|  +-------------------------+  +-------------------------+  +-------------------+  |
|  | Fleet & Vessel Service  |  | Dataset Ingestion & QA  |  | ML Predictor      |  |
|  | CRUD, Hydrodynamics, CSV|  | Schema check, Outliers  |  | XGBoost, Intervals|  |
|  +-------------------------+  +-------------------------+  +-------------------+  |
|  +-------------------------+  +-------------------------+  +-------------------+  |
|  | Lifecycle Emissions Eng |  | Maritime GIS AIS Engine |  | Quantum Lab Engine|  |
|  | WTW, TTW, IPCC AR5, LHV |  | Corridors, ECAs, Ports  |  | Bloch, Gates, Entr|  |
|  +-------------------------+  +-------------------------+  +-------------------+  |
|  +-------------------------+  +-------------------------+  +-------------------+  |
|  | Multi-Objective MINLP   |  | Benchmark Suite         |  | Optimization Core |  |
|  | Cost, GHG, Schedule     |  | Pareto, Multi-run       |  | QEA, GA, SA, Exact|  |
|  +-------------------------+  +-------------------------+  +-------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                                 SQLAlchemy 2.0 ORM
                                          v
+-----------------------------------------------------------------------------------+
|                        RELATIONAL DATA STORE & STORAGE                            |
|       PostgreSQL 16 (Production) / SQLite (Zero-Dependency Local Development)     |
|       Artifact Repository: Trained Model Weights (.joblib) & Metadata (.json)     |
|       Geospatial Waypoints & Bathymetry Layer Definitions                         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Key Pages & Modules

The web platform provides **16 interconnected operational pages**:

1. **Executive Dashboard (`/`)**: Real-time high-level KPIs (active vessels, scheduled cargo, fuel consumption, operating costs, GHG emissions), speed-consumption curve, fuel mix breakdown, recent optimization runs, and prominent interactive showcase banners for the GIS Twin and Quantum Lab.
2. **Maritime GIS Digital Twin (`/geospatial`)**: Interactive global maritime GIS twin powered by Leaflet and open-access zero-watermark tiles (Esri Dark Canvas, Ocean Bathymetry, OSM Night). Features 4 global shipping trunks (Asia-Europe via Suez, Asia-Europe via Cape, Transatlantic, Gulf-Singapore VLCC), IMO Tier III Emission Control Areas, smart deepwater ports with shore power (cold-ironing) and grid carbon intensity, live AIS vessel telemetry with heading vectors and CII ratings (A-E), and an interactive slow-steaming hydrodynamics simulator ($P \propto v^{3.15}$).
3. **Quantum State & Q-Bit Lab (`/quantum-lab`)**: Interactive quantum simulation workspace with 2D Hilbert / Bloch unit circle ($|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$), real-time parameter controls for Han & Kim (2002) reversible unitary rotation gates $U(\Delta\theta)$, Monte Carlo wavefunction collapse simulator, and Shannon entropy catastrophe recovery operator.
4. **Fleet Management (`/fleet`)**: Complete CRUD operations for vessels (DWT, engine power, design speed, fuel compatibility, status), search/filter by vessel class, add vessel modal, and bulk CSV import/export with row-level error reporting.
5. **Vessel Details (`/fleet/:id`)**: In-depth hydrodynamic profile, speed envelope, consumption curves, engine specifications, commercial charter rates, and data provenance tags.
6. **Dataset Management (`/datasets`)**: Ingestion workspace with file upload, preview modal, column mapping, missing value detection, statistical outlier screening ($3.5\sigma$), and provenance lineage.
7. **Fuel Prediction Studio (`/prediction`)**: Interactive ML inference portal predicting fuel consumption with 95% confidence intervals, energy equivalence (GJ), and model retraining controls.
8. **Emissions & Cost Calculator (`/calculator`)**: Interactive carbon accounting engine evaluating Tank-to-Wake (TTW) vs. Well-to-Wake (WTW), IPCC AR5 GWP100 equivalents, carbon tax impact, and port cold ironing savings.
9. **Optimization Workspace (`/optimization`)**: Formulation studio for cargo requirements, routes, deadlines, objective weights ($w_C, w_E, w_T$), and algorithm selection (QEA, GA, SA, Deterministic).
10. **Optimization Results (`/results/:id`)**: Deployment plan inspect, vessel-to-route assignment matrix, objective breakdown, convergence history chart, feasibility status, and CSV/JSON export.
11. **Alternative Fuel Scenarios (`/scenarios`)**: Decarbonization laboratory modeling transitional fuels (HFO, VLSFO, LNG, e-Methanol, Ammonia, Hydrogen) across fleet compliance horizons.
12. **Benchmark Laboratory (`/benchmarks`)**: Empirical scientific testing suite comparing QEA, GA, SA, and Exact baselines, displaying multi-run convergence curves and Pareto trade-off frontiers.
13. **Experiment History (`/history`)**: Chronological audit trail of optimization runs, parameter configurations, and solution metrics.
14. **Reports & Exports (`/reports`)**: Central download center for voyage deployment plans, carbon audit ledgers, and fleet registers in CSV and JSON formats.
15. **Settings & Telemetry (`/settings`)**: System health diagnostics, ML model metadata, database telemetry, and naval engineering formula documentation.
16. **Authentication & Access (`/login`)**: Operator authentication with JWT tokens, account registration, and **1-Click Demo Commander Access** for instant demonstration.

---

## 4. Mathematical & Algorithmic Foundations

### 4.1 Ship Resistance & Fuel Hydrodynamics
Propulsion power requirements follow the non-linear Admiralty resistance law modified for wave drag:

$$P_{\text{req}} = \frac{\Delta^{2/3} \cdot v^{3.15}}{C_a} \cdot \left(1 + \gamma_{\text{weather}} \cdot \left(\frac{\text{BN}}{8}\right)^{1.5}\right)$$

Where $\Delta$ is vessel displacement (lightship + deadweight payload), $v$ is cruising speed in knots, $C_a$ is the calibrated Admiralty coefficient, and $\text{BN}$ is the Beaufort scale wind/wave number.

### 4.2 Multi-Objective Fleet Deployment (MINLP)
$$\min_{\vec{x}} \quad \mathcal{F}(\vec{x}) = w_C \cdot \frac{C_{\text{total}}(\vec{x})}{C_{\text{ref}}} + w_E \cdot \frac{E_{\text{WTW}}(\vec{x})}{E_{\text{ref}}} + w_T \cdot \frac{T_{\text{max}}(\vec{x})}{T_{\text{ref}}} + \sum_{j} \Pi_j(\vec{x})$$

**Subject to:**
- Total delivered cargo $\ge$ Target demand.
- Voyage completion time $\le$ Delivery deadline.
- Operating speed within certified limits: $v_i^{\min} \le v_i \le v_i^{\max}$.
- Vessel operational availability and dry-dock status.
- Port-fuel compatibility and shore power infrastructure.

### 4.3 Quantum-Inspired Evolutionary Algorithm (QEA)
Unlike standard Genetic Algorithms that maintain binary bit-strings, QEA represents individual solutions as probabilistic **Q-bit vectors**:

$$q_j = \begin{bmatrix} \alpha_j \\ \beta_j \end{bmatrix}, \quad \text{with} \quad |\alpha_j|^2 + |\beta_j|^2 = 1$$

Where $|\beta_j|^2$ is the probability that decision variable bit $j$ collapses to state $1$ upon measurement.

#### Han & Kim 2D Unitary Rotation Gate
Q-bit states evolve toward the elite best solution using a unitary rotation operator:

$$\begin{bmatrix} \alpha_j^{(t+1)} \\ \beta_j^{(t+1)} \end{bmatrix} = \begin{bmatrix} \cos(\Delta \theta_j) & -\sin(\Delta \theta_j) \\ \sin(\Delta \theta_j) & \cos(\Delta \theta_j) \end{bmatrix} \begin{bmatrix} \alpha_j^{(t)} \\ \beta_j^{(t)} \end{bmatrix}$$

The rotation angle $\Delta \theta_j$ is determined via the Han & Kim (2002) sign-lookup table comparing the measured bit $x_j$, elite bit $b_j$, and fitness advantage $f(\vec{x}) < f(\vec{b})$.

---

## 5. Quickstart & Deployment

### Option A: Docker Compose (Recommended)

1. **Clone the repository and copy environment template**:
   ```bash
   cp .env.example .env
   ```
2. **Build and start all services**:
   ```bash
   docker compose up --build -d
   ```
3. **Open the platform in your browser**:
   - **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   - **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Backend Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

4. **Sign in using seeded demo credentials**:
   - **Email**: `operator@naviqgreen.maritime`
   - **Password**: `NaviQ2026!Secure`
   - *(Or click the 1-Click Demo Commander Access button on the login screen).*

---

### Option B: Bare-Metal Local Development (Windows / macOS / Linux)

#### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend server (auto-seeds SQLite database naviqgreen.db)
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

#### 2. Frontend Setup
```bash
# In a separate terminal
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Verification & Automated Test Suite

NaviQGreen includes 31 automated unit and integration tests covering the emissions engine, ML predictor, optimization algorithms, geospatial corridors, quantum lab simulation, and REST API endpoints.

```bash
# Run complete test suite inside container
docker exec naviqgreen-backend python -m pytest tests -v
# Or locally
pytest backend/tests -v
```

Expected output:
```text
tests/test_api_integration.py::test_health_endpoint PASSED               [  3%]
tests/test_api_integration.py::test_demo_login PASSED                    [  6%]
tests/test_api_integration.py::test_vessels_list PASSED                  [  9%]
tests/test_api_integration.py::test_vessel_detail PASSED                 [ 12%]
tests/test_api_integration.py::test_prediction_endpoint PASSED           [ 16%]
tests/test_api_integration.py::test_emissions_calculation_endpoint PASSED [ 19%]
tests/test_api_integration.py::test_optimization_run_qea PASSED          [ 22%]
tests/test_api_integration.py::test_scenarios_lab_endpoint PASSED        [ 25%]
tests/test_api_integration.py::test_dashboard_summary_endpoint PASSED    [ 29%]
tests/test_emissions_engine.py::test_fuel_properties_retrieval PASSED    [ 32%]
tests/test_emissions_engine.py::test_equivalent_fuel_mass_energy_consistency PASSED [ 35%]
tests/test_emissions_engine.py::test_fuel_cost_calculation PASSED        [ 38%]
tests/test_emissions_engine.py::test_direct_emissions_and_gwp PASSED     [ 41%]
tests/test_emissions_engine.py::test_lifecycle_emissions PASSED          [ 45%]
tests/test_emissions_engine.py::test_shore_power_calculation PASSED      [ 48%]
tests/test_emissions_engine.py::test_evaluate_voyage_full_pipeline PASSED [ 51%]
tests/test_geospatial_and_quantum_lab.py::test_geospatial_summary_and_corridors PASSED [ 54%]
tests/test_geospatial_and_quantum_lab.py::test_geospatial_vessels_and_ecas PASSED [ 58%]
tests/test_geospatial_and_quantum_lab.py::test_quantum_lab_spec PASSED   [ 61%]
tests/test_geospatial_and_quantum_lab.py::test_quantum_lab_rotation_operator PASSED [ 64%]
tests/test_geospatial_and_quantum_lab.py::test_quantum_lab_measurement_collapse PASSED [ 67%]
tests/test_geospatial_and_quantum_lab.py::test_quantum_lab_catastrophe_operator PASSED [ 70%]
tests/test_ml_predictor.py::test_fuel_predictor_availability PASSED      [ 74%]
tests/test_ml_predictor.py::test_fuel_predictor_inference_reasonable_bounds PASSED [ 77%]
tests/test_ml_predictor.py::test_fuel_predictor_speed_cubic_sensitivity PASSED [ 80%]
tests/test_ml_predictor.py::test_fuel_predictor_invalid_inputs PASSED    [ 83%]
tests/test_optimization.py::test_candidate_evaluation_feasible PASSED    [ 87%]
tests/test_optimization.py::test_candidate_evaluation_infeasible_deadline PASSED [ 90%]
tests/test_optimization.py::test_qea_solver_execution_and_reproducibility PASSED [ 93%]
tests/test_optimization.py::test_ga_and_sa_baselines PASSED              [ 96%]
tests/test_optimization.py::test_exact_greedy_baseline PASSED            [100%]

======================= 31 passed, 2 warnings in 18.08s ========================
```

To verify the frontend TypeScript and production bundle:
```bash
cd frontend
npm run build
```

---

## 7. Project Directory Structure

```text
Navi Q Green Project/
|-- backend/
|   |-- app/
|   |   |-- api/v1/             # REST API routers (vessels, prediction, geospatial, quantum_lab, etc.)
|   |   |   |-- geospatial.py   # GIS shipping corridors, ports, ECAs, and live vessel positions
|   |   |   `-- quantum_lab.py  # Han & Kim 2D unitary gate math, collapse & entropy simulator
|   |   |-- core/               # Configuration, security, database engine
|   |   |-- data/               # Seed generator & hydrodynamics generator
|   |   |-- emissions/          # Unit-consistent fuel & emissions calculation engine
|   |   |-- ml/                 # Machine learning pipeline (XGBoost, RF, GB)
|   |   |-- models/             # SQLAlchemy ORM database models
|   |   |-- optimization/       # QEA, GA, SA, and problem formulation
|   |   |-- schemas/            # Pydantic v2 validation contracts
|   |   |-- services/           # Business logic & services layer
|   |   `-- main.py             # FastAPI entrypoint & database lifespan seeder
|   |-- artifacts/              # Serialized ML model artifacts & metadata
|   |-- data/                   # Seed CSV datasets
|   |-- tests/                  # Automated pytest suite (31 tests)
|   |   `-- test_geospatial_and_quantum_lab.py # Geospatial & Quantum Lab integration tests
|   |-- Dockerfile              # Production Python backend container
|   `-- requirements.txt        # Backend dependencies
|-- frontend/
|   |-- src/
|   |   |-- components/         # Reusable UI components (MaritimeMap, Sidebar, Header, etc.)
|   |   |   `-- MaritimeMap.tsx # Leaflet GIS map with zero-watermark Esri & OSM basemaps
|   |   |-- pages/              # 16 operational application views
|   |   |   |-- GeospatialMap.tsx # AIS Digital Twin with slow-steaming hydrodynamics
|   |   |   `-- QuantumLab.tsx    # Bloch Unit Circle & Q-Bit rotation visualizer
|   |   |-- services/           # Axios API client
|   |   |-- styles/             # Tailwind CSS & maritime dark theme
|   |   |-- types/              # TypeScript interfaces & types
|   |   |-- App.tsx             # Root router configuration
|   |   `-- main.tsx            # React 18 DOM mount point
|   |-- Dockerfile              # Production Nginx frontend container
|   |-- nginx.conf              # Nginx reverse proxy configuration
|   `-- package.json            # Frontend dependencies
|-- docs/
|   |-- architecture.md         # System architecture & component documentation
|   |-- benchmarking.md         # Scientific benchmarking protocol & results
|   |-- datasets_provenance.md  # Data lineage, standards & physical calibration
|   |-- deployment.md           # Docker & local operations guide
|   |-- emissions_boundaries.md # IMO, IPCC AR5 & WTW emissions math
|   |-- fuel_modeling.md        # Naval hydrodynamics & ML methodology
|   |-- mathematical_optimization.md # MINLP formulation & constraints
|   `-- qea_specification.md    # Q-bit evolutionary algorithm specification
|-- docker-compose.yml          # Multi-container orchestration (DB, API, Web)
|-- .env.example                # Environment variables template
`-- README.md                   # Master project documentation
```

---

## 8. Regulatory & Scientific Citations

1. **IMO MEPC.308(73)**: *2018 Guidelines on the method of calculation of the attained Energy Efficiency Design Index (EEDI) for new ships*.
2. **Fourth IMO GHG Study 2020**: *International Maritime Organization, London, UK*.
3. **IPCC AR5**: *Climate Change 2013: The Physical Science Basis. Contribution of Working Group I to the Fifth Assessment Report of the Intergovernmental Panel on Climate Change*.
4. **Han, K.-H., & Kim, J.-H. (2002)**: *Quantum-inspired evolutionary algorithm for a class of combinatorial optimization problems*. IEEE Transactions on Evolutionary Computation, 6(6), 580-593.
5. **Holtrop, J., & Mennen, G. G. J. (1982)**: *An approximate power prediction method*. International Shipbuilding Progress, 29(335), 166-170.

---

## 9. License & Integrity Statement

Developed for **Smart India Hackathon (SIH 2026)** under Problem Statement **SIH26138** (*Clean & Green Technology*).
All experimental numbers, training metrics, and benchmark results are generated deterministically through reproducible classical code. No proprietary or paid APIs are required.

