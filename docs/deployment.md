# Deployment & Operations Guide

## 1. System Requirements

### Hardware Requirements
- **CPU**: Dual-core x86_64 / ARM64 processor (Quad-core recommended).
- **RAM**: Minimum 4 GB (8 GB recommended for simultaneous ML training and QEA benchmarking).
- **Disk Space**: ~2 GB free storage (Docker images and persistent PostgreSQL volume).

### Software Prerequisites
- **Option A (Containerized)**:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows with WSL 2 or macOS / Linux)
  - Docker Compose v2.20+
- **Option B (Local Bare-Metal)**:
  - Python 3.10 to 3.13
  - Node.js 18.x to 22.x + npm 9+
  - Git

---

## 2. Docker Compose Deployment (Recommended for Production/Evaluation)

NaviQGreen is packaged with a multi-container Docker Compose architecture:
- `db`: PostgreSQL 16 Alpine with persistent data volume (`postgres_data`).
- `backend`: FastAPI Python application with automated database migrations, ML runtime, and healthcheck.
- `frontend`: High-performance Nginx Alpine web server serving the optimized React 18 production bundle and reverse-proxying API requests.

### Step 1: Clone & Configure Environment
In the repository root directory, copy the environment template:
```powershell
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Review `.env` settings:
```ini
ENVIRONMENT=production
PROJECT_NAME="NaviQGreen Platform"
DATABASE_URL=postgresql+psycopg2://naviq:greenfleet_secret_2026@db:5432/naviqgreen
JWT_SECRET_KEY=change-this-to-a-secure-random-64-character-string
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS="http://localhost,http://localhost:3000,http://localhost:80"
```

### Step 2: Build and Launch Services
Run Docker Compose in detached mode:
```powershell
docker compose up --build -d
```

### Step 3: Verify Container Health
```powershell
docker compose ps
```
Expected output:
```text
NAME                     IMAGE                  COMMAND                  SERVICE    STATUS
naviqgreen-backend-1    naviqgreen-backend     "uvicorn app.main:ap…"   backend    running (healthy)
naviqgreen-db-1         postgres:16-alpine     "docker-entrypoint.s…"   db         running (healthy)
naviqgreen-frontend-1   naviqgreen-frontend    "/docker-entrypoint.…"   frontend   running (healthy)
```

### Step 4: Access Application
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000) (or [http://localhost](http://localhost))
- **Interactive REST API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Reference**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Backend Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Step 5: Demo Operator Credentials
The platform automatically seeds an operational demonstration account on first startup:
- **Email**: `operator@naviqgreen.maritime`
- **Password**: `NaviQ2026!Secure`
- *Alternatively, click the **1-Click Demo Commander Access** button on the login screen.*

---

## 3. Local Bare-Metal Development Setup (Windows / macOS / Linux)

For active rapid development without running Docker:

### 3.1 Backend Setup
1. Open terminal in the repository root.
2. Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Verify local SQLite configuration in `.env`:
   ```ini
   DATABASE_URL=sqlite:///./naviqgreen.db
   ```
5. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --app-dir backend --reload --port 8000
   ```
   *The database schema and initial seed vessels, ports, fuels, and ML models will auto-generate upon startup.*

### 3.2 Frontend Setup
1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at [http://localhost:5173](http://localhost:5173) (Vite proxies API calls to `http://localhost:8000`).

---

## 4. Automated Testing & Verification

Run the comprehensive test suite to confirm mathematical, ML, and integration validity:
```bash
# Run all backend unit & integration tests
pytest backend/tests -v

# Run with coverage report
pytest backend/tests --cov=backend/app --cov-report=term-missing
```

To verify the frontend build:
```bash
cd frontend
npm run build
```

---

## 5. Troubleshooting & FAQ

### Port 8000 or 3000 Already in Use
If another service occupies port 8000 or 3000, adjust the mapping in `docker-compose.yml` or run uvicorn with `--port 8001`:
```yaml
ports:
  - "3001:80" # Frontend on 3001
  - "8001:8000" # Backend on 8001
```

### Database Authentication Error
Ensure the PostgreSQL container is fully healthy before backend requests arrive. Docker Compose handles this via `condition: service_healthy` on the `db` service.

### Preserving Data Across Container Restarts
The `postgres_data` Docker volume maintains all database state, imported datasets, trained models, and benchmark runs permanently. To completely reset the database:
```powershell
docker compose down -v
docker compose up --build -d
```

### GIS Map Cartography & Zero API Key Requirement
NaviQGreen's Maritime GIS Digital Twin (`/geospatial`) operates completely free of charge without requiring any third-party API keys, credit cards, or external developer tokens (complying strictly with SIH Problem Statement Rule #11):
- **Default Tile Provider**: Esri World Dark Gray Canvas (zero watermark, high-contrast dark theme).
- **Alternative Basemaps**: Esri Ocean Bathymetry (depth contours) & OpenStreetMap Night Mode.
- Operators can switch basemap layers in real time via the top-left **GIS Layers** control panel.


