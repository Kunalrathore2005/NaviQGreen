# NaviQGreen — System Architecture

**Project Identity**: NaviQGreen (Quantum-Inspired Green Fleet Intelligence & Optimization Platform)  
**SIH Problem Statement ID**: SIH26138  
**Theme**: Clean & Green Technology  

---

## 1. Architectural Topology

NaviQGreen is structured as a decoupled, microservice-ready full-stack enterprise platform:

```
[ React 18 + Vite + Tailwind CSS SPA ]
                 │
                 ▼  REST API (HTTP/JSON)
[ FastAPI High-Performance Application ]
   ├── Authentication & Security (JWT, Argon2/PBKDF2)
   ├── Fleet & Vessel Management Service (CRUD, CSV Import/Export)
   ├── Maritime GIS Digital Twin Service (/api/v1/geospatial)
   │      ├── Global Shipping Corridors & Bottleneck Waypoints (Suez, Cape, Malacca)
   │      ├── IMO Tier III Emission Control Areas (ECAs) Geofencing
   │      ├── Deepwater Ports & Cold-Ironing Shore Power Grid Carbon Factors
   │      └── Live Vessel Telemetry with Heading Vectors & IMO CII Ratings (A-E)
   ├── Quantum State & Q-Bit Lab Simulator (/api/v1/quantum-lab)
   │      ├── 2D Hilbert / Bloch Unit Circle State Vector Math (|ψ⟩ = α|0⟩ + β|1⟩)
   │      ├── Han & Kim (2002) 2D Unitary Rotation Gate Operator U(Δθ)
   │      ├── Monte Carlo Wavefunction Collapse Measurement Simulation
   │      └── Shannon Entropy Catastrophe Diversity Restoration Engine
   ├── Dataset Ingestion & Validation Engine (Automated Outlier & Type Checks)
   ├── Physics-Grounded Machine Learning Pipeline (XGBoost, Random Forest)
   ├── Fuel Cost & Lifecycle Emissions Engine (IMO 4th GHG & GWP Accounting)
   ├── Mathematical Fleet Optimization Engine
   │      ├── QEA (Quantum-Inspired Evolutionary Algorithm with Q-bits)
   │      ├── GA (Genetic Algorithm Baseline)
   │      ├── SA (Simulated Annealing Baseline)
   │      └── Exact Greedy Deterministic Baseline
   ├── Decarbonization Scenarios Simulator (Slow Steaming, LNG, e-Methanol, NH3, H2)
   └── Benchmark & Reporting Service (Pareto Frontiers, CSV/JSON Exports)
                 │
                 ▼
[ Relational Persistence Layer (PostgreSQL 16 / SQLite Engine) ]
```

---

## 2. Component Boundaries & Independence

1. **Frontend Presentation (`/frontend`)**:
   - Zero hardcoded mock metrics.
   - Built with React 18, TypeScript, Tailwind CSS, Leaflet, and Recharts.
   - **16 distinct functional interfaces** communicating with backend via typed Axios client.
   - 1-Click Demo Commander login bypasses onboarding friction during evaluation.

2. **API & Business Logic Layer (`/backend/app`)**:
   - Modular REST routes under `/api/v1` (`geospatial.py`, `quantum_lab.py`, `vessels.py`, `prediction.py`, `emissions.py`, `optimization.py`, etc.).
   - Strict Pydantic v2 request/response schema validation contracts.
   - Dependency injection for database sessions and security tokens.

3. **Inference & Optimization Engines (`/backend/app/ml` and `/backend/app/optimization`)**:
   - Pure, decoupled algorithmic modules independently unit-testable without database or network connections.
   - Standardized problem instance interface guarantees that QEA, GA, SA, and Exact baselines solve the exact same mathematical formulation under identical computational constraints.

---

## 3. Geospatial AIS Digital Twin Architecture

The Maritime GIS Digital Twin (`/geospatial`) provides an interactive geospatial view of international commercial maritime traffic and infrastructure:

### 3.1 Open-Access Cartographic Tile Architecture (Zero-Watermark, No API Key)
To strictly adhere to SIH Rule #11 (*"Do not require paid APIs or proprietary hardware"*), the platform utilizes open, unrestricted enterprise GIS tile layers without external API keys or watermarks:
- **Esri World Dark Gray Canvas** (`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`): Default sleek, dark charcoal/navy canvas matching `#060D17`.
- **Esri Ocean Bathymetry** (`https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`): Deep marine bathymetric contours and continental shelves.
- **OpenStreetMap Night Mode** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png` with CSS color inversion): Community-powered cartography with zero usage limitations.

### 3.2 Geospatial Domain Layers
1. **Shipping Corridors**: Multimodal polyline trajectories with choke points (Suez Canal, Bab-el-Mandeb, Strait of Malacca, Strait of Gibraltar, Cape of Good Hope).
2. **IMO Emission Control Areas (ECAs)**: Geofenced polygons (North Sea/English Channel, North American Gulf Coast) enforcing $0.10\%$ sulfur and Tier III $\text{NO}_x$ limits.
3. **Smart Port Nodes**: Berthing hubs (Rotterdam, Singapore, Shanghai, Antwerp, Jebel Ali, Houston) parameterized with cold-ironing shore power availability and localized electrical grid carbon intensity ($g\text{CO}_2/\text{kWh}$).
4. **Live Fleet Telemetry**: Vessels rendered with heading rotation angles, speeds, current cargo loads, fuel types (Bio-Methanol, LNG, VLSFO, Hydrogen Fuel Cell), and calculated IMO Carbon Intensity Indicator (CII) ratings (**A** through **E**).
5. **Slow-Steaming Hydrodynamics Simulator**: Interactive speed scrubber evaluating cubic power law fuel savings ($P \propto v^{3.15}$) against arrival schedule delay penalties.

---

## 4. Quantum Lab Simulator Architecture

The Quantum State & Q-Bit Lab (`/quantum-lab`) provides interactive verification of quantum-inspired evolutionary computing:

1. **2D Hilbert / Bloch Unit Circle**:
   $$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle, \quad |\alpha|^2 + |\beta|^2 = 1$$
   SVG-rendered interactive state vector with real-time probability amplitudes $|\alpha|^2$ and $|\beta|^2$.
2. **Han & Kim (2002) 2D Unitary Rotation Gate Operator**:
   $$\begin{bmatrix} \alpha' \\ \beta' \end{bmatrix} = \begin{bmatrix} \cos(\Delta\theta) & -\sin(\Delta\theta) \\ \sin(\Delta\theta) & \cos(\Delta\theta) \end{bmatrix} \begin{bmatrix} \alpha \\ \beta \end{bmatrix}$$
   Step-by-step gate evaluation comparing candidate bit $x_i$, elite best bit $b_i$, and sign determination based on $\text{sgn}(\alpha_i \cdot \beta_i)$.
3. **Monte Carlo Collapse Experiment**:
   Simulates $N$ independent measurements collapsing the superposition into classical states $|0\rangle$ or $|1\rangle$, validating convergence toward theoretical Born rule probabilities.
4. **Shannon Entropy Catastrophe Operator**:
   Monitors population diversity:
   $$H(Q) = -\sum_{i} \left( |\alpha_i|^2 \log_2 |\alpha_i|^2 + |\beta_i|^2 \log_2 |\beta_i|^2 \right)$$
   When $H(Q) < 0.15$, catastrophe recovery resets stagnant qubits back to maximum superposition ($\alpha = \beta = \frac{1}{\sqrt{2}}$), escaping premature local optima.

---

## 5. REST API Contracts for Geospatial & Quantum Lab

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/geospatial/summary` | Fleet AIS count, clean fuel adoption %, tracked tonnage, active corridors |
| `GET` | `/api/v1/geospatial/corridors` | Global shipping corridors with GeoJSON waypoints and distances |
| `GET` | `/api/v1/geospatial/vessels` | Live vessel positions, headings, speeds, CII ratings, fuel burn rates |
| `GET` | `/api/v1/geospatial/ports` | Major world ports, shore power status, grid emission factors |
| `GET` | `/api/v1/geospatial/ecas` | IMO Tier III Emission Control Area geofence polygon coordinates |
| `GET` | `/api/v1/quantum-lab/spec` | Han & Kim mathematical specification and full rotation lookup table |
| `POST` | `/api/v1/quantum-lab/rotate` | Computes 2D unitary rotation matrix transformation on input state |
| `POST` | `/api/v1/quantum-lab/measure` | Monte Carlo measurement collapse simulation ($N$ trials) |
| `POST` | `/api/v1/quantum-lab/catastrophe` | Simulates stagnation and executes Shannon entropy catastrophe reset |

