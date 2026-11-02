import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1 import api_router
from app.models import Vessel, Port, VoyageRoute, FuelReference, User
from app.core.security import get_password_hash
from app.data.seed_datasets import (
    seed_all_csv_files,
    VESSELS_DATA,
    PORTS_DATA,
    ROUTES_DATA,
    FUELS_DATA
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("naviqgreen")


def init_db_seeds():
    """
    Initializes database tables and seeds demo maritime vessels, routes, fuels, and ports if table is empty.
    Includes connection retry logic for container initialization.
    """
    import time
    max_retries = 10
    retry_delay = 2

    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except Exception as e:
            if attempt == max_retries:
                logger.error(f"Failed to connect to database after {max_retries} attempts: {e}")
                raise
            logger.warning(f"Database connection attempt {attempt}/{max_retries} failed ({e}). Retrying in {retry_delay}s...")
            time.sleep(retry_delay)

    db = SessionLocal()
    try:
        # Check if vessels exist
        if db.query(Vessel).count() == 0:
            logger.info("Database empty. Seeding initial maritime records...")
            seed_all_csv_files()
            
            # Seed fuels
            for f in FUELS_DATA:
                db.add(FuelReference(**f))
                
            # Seed ports
            for p in PORTS_DATA:
                db.add(Port(**p))
                
            # Seed routes
            for r in ROUTES_DATA:
                db.add(VoyageRoute(**r))
                
            # Seed vessels
            for v in VESSELS_DATA:
                db.add(Vessel(**v))
                
            # Seed demo user
            demo_user = User(
                email="captain@naviqgreen.maritime",
                hashed_password=get_password_hash("NaviQGreen2026!"),
                full_name="Admiral Elena Vance",
                role="fleet_manager"
            )
            db.add(demo_user)
            
            db.commit()
            logger.info("Successfully seeded 10 vessels, 6 ports, 4 trunk routes, and reference fuels.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
    init_db_seeds()
    try:
        from app.ml.fuel_predictor import FuelPredictor
        FuelPredictor.load()
        logger.info("FuelPredictor ML pipeline ready.")
    except Exception as e:
        logger.warning(f"Could not initialize FuelPredictor at startup: {e}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Quantum-Inspired Green Fleet Intelligence & Optimization Platform (SIH26138)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + ["*"] if settings.DEBUG else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler for sanitized responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal operational error occurred. Check server logs."}
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": "Smarter Fleet Decisions. Lower Operating Costs. Measurable Environmental Impact.",
        "problem_statement_id": "SIH26138",
        "theme": "Clean & Green Technology",
        "api_docs": "/docs",
        "version": "1.0.0"
    }

