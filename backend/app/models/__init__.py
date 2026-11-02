import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    ANALYST = "analyst"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default=UserRole.FLEET_MANAGER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vessel(Base):
    __tablename__ = "vessels"
    
    id = Column(Integer, primary_key=True, index=True)
    vessel_id = Column(String(64), unique=True, index=True, nullable=False)
    vessel_name = Column(String(255), nullable=False)
    vessel_type = Column(String(100), nullable=False) # Container, Bulk Carrier, Oil Tanker, LNG Carrier, General Cargo
    deadweight_tonnage = Column(Float, nullable=False)
    cargo_capacity_tonnes = Column(Float, nullable=False)
    engine_power_kw = Column(Float, nullable=False)
    length_m = Column(Float, nullable=True)
    beam_m = Column(Float, nullable=True)
    draft_m = Column(Float, nullable=True)
    design_speed_knots = Column(Float, nullable=False)
    minimum_speed_knots = Column(Float, nullable=False, default=10.0)
    maximum_speed_knots = Column(Float, nullable=False, default=24.0)
    compatible_fuels = Column(JSON, nullable=False) # e.g. ["VLSFO", "MGO", "LNG"]
    availability_status = Column(String(50), nullable=False, default="AVAILABLE") # AVAILABLE, IN_TRANSIT, MAINTENANCE, RETIRED
    maintenance_status = Column(String(50), nullable=False, default="GOOD") # GOOD, DUE_SOON, UNDER_REPAIR
    daily_charter_cost_usd = Column(Float, nullable=False, default=15000.0)
    crew_cost_per_day_usd = Column(Float, nullable=False, default=4500.0)
    data_source = Column(String(255), nullable=False, default="Engineering Standard Reference")
    is_hypothetical = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FuelReference(Base):
    __tablename__ = "fuel_references"
    
    id = Column(Integer, primary_key=True, index=True)
    fuel_code = Column(String(32), unique=True, index=True, nullable=False) # VLSFO, MGO, LNG, Methanol, Ammonia, Hydrogen
    fuel_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False) # FOSSIL, BIO, SYNTHETIC, ELECTRIC
    price_per_tonne_usd = Column(Float, nullable=False)
    lower_heating_value_mj_per_kg = Column(Float, nullable=False)
    direct_emission_factor_tco2_per_tfuel = Column(Float, nullable=False) # Tank-to-Wake CO2
    well_to_wake_emission_factor_tco2_per_tfuel = Column(Float, nullable=False) # Total Lifecycle CO2eq
    ch4_emission_factor_g_per_kg = Column(Float, default=0.0)
    n2o_emission_factor_g_per_kg = Column(Float, default=0.0)
    availability_score = Column(Float, default=1.0) # 0 to 1 index
    is_zero_carbon = Column(Boolean, default=False)
    data_source = Column(String(255), default="Fourth IMO GHG Study (2020) & Argus Bunker Index")
    price_reference_date = Column(String(64), default="2026-Q1")

class Port(Base):
    __tablename__ = "ports"
    
    id = Column(Integer, primary_key=True, index=True)
    port_code = Column(String(32), unique=True, index=True, nullable=False)
    port_name = Column(String(128), nullable=False)
    country = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    shore_power_available = Column(Boolean, default=False)
    shore_power_capacity_kw = Column(Float, default=0.0)
    electricity_price_kwh_usd = Column(Float, default=0.15)
    grid_emission_factor_kg_co2_per_kwh = Column(Float, default=0.45)
    available_fuels = Column(JSON, default=list)
    data_source = Column(String(255), default="World Port Index & National Grid Disclosures")

class VoyageRoute(Base):
    __tablename__ = "voyage_routes"
    
    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String(64), unique=True, index=True, nullable=False)
    origin_port_code = Column(String(32), nullable=False)
    destination_port_code = Column(String(32), nullable=False)
    distance_nm = Column(Float, nullable=False)
    scheduled_departure = Column(DateTime, nullable=True)
    arrival_deadline_hours = Column(Float, nullable=False)
    required_cargo_tonnes = Column(Float, nullable=False)
    priority = Column(String(32), default="NORMAL") # HIGH, NORMAL, LOW
    sea_state_douglas = Column(Integer, default=3) # 1-8
    avg_wind_speed_knots = Column(Float, default=15.0)
    avg_wave_height_m = Column(Float, default=1.8)
    data_source = Column(String(255), default="Standard Maritime Route Database")

class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False) # OBSERVED, ENGINEERING_REFERENCE, SYNTHETIC_DEMO, USER_UPLOADED
    file_path = Column(String(512), nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    schema_definition = Column(JSON, default=dict)
    validation_summary = Column(JSON, default=dict)
    data_source = Column(String(255), nullable=False)
    version = Column(String(32), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionRecord(Base):
    __tablename__ = "prediction_records"
    
    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(64), nullable=False)
    vessel_id = Column(String(64), nullable=False)
    vessel_type = Column(String(64), nullable=False)
    speed_knots = Column(Float, nullable=False)
    cargo_load_tonnes = Column(Float, nullable=False)
    distance_nm = Column(Float, nullable=False)
    fuel_type = Column(String(32), nullable=False)
    weather_factor = Column(Float, default=1.0)
    predicted_consumption_kg = Column(Float, nullable=False)
    predicted_consumption_tonnes = Column(Float, nullable=False)
    fuel_cost_usd = Column(Float, nullable=False)
    direct_emissions_tco2 = Column(Float, nullable=False)
    lifecycle_emissions_tco2 = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OptimizationJob(Base):
    __tablename__ = "optimization_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String(128), nullable=False)
    status = Column(String(32), default="QUEUED") # QUEUED, RUNNING, COMPLETED, FAILED
    algorithm = Column(String(32), nullable=False) # QEA, GA, SA, EXACT_GREEDY
    population_size = Column(Integer, default=30)
    generations = Column(Integer, default=50)
    random_seed = Column(Integer, default=42)
    weights = Column(JSON, nullable=False) # {"cost": 0.4, "fuel": 0.3, "emissions": 0.3}
    constraints = Column(JSON, nullable=False)
    is_feasible = Column(Boolean, default=False)
    best_objective_value = Column(Float, nullable=True)
    best_solution = Column(JSON, nullable=True)
    convergence_history = Column(JSON, default=list) # [{gen: 0, best: ..., avg: ...}]
    runtime_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    benchmark_name = Column(String(128), nullable=False)
    instance_config = Column(JSON, nullable=False)
    algorithms_run = Column(JSON, nullable=False) # ["QEA", "GA", "SA"]
    comparative_results = Column(JSON, nullable=False) # Metric comparisons
    execution_timestamp = Column(DateTime, default=datetime.utcnow)

class ScenarioRecord(Base):
    __tablename__ = "scenario_records"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String(128), nullable=False)
    scenario_type = Column(String(64), nullable=False) # BASELINE, SPEED_REDUCTION, LNG, METHANOL, HYDROGEN, AMMONIA, MIXED_FLEET, SHORE_POWER, CUSTOM
    parameters = Column(JSON, nullable=False)
    calculated_cost_usd = Column(Float, nullable=False)
    calculated_fuel_tonnes = Column(Float, nullable=False)
    calculated_direct_emissions_tco2 = Column(Float, nullable=False)
    calculated_lifecycle_emissions_tco2 = Column(Float, nullable=False)
    cargo_fulfillment_rate = Column(Float, default=1.0)
    cost_diff_pct = Column(Float, default=0.0)
    emissions_diff_pct = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

