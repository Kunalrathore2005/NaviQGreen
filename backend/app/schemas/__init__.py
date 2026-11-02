from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "fleet_manager"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Vessel Schemas
class VesselBase(BaseModel):
    vessel_id: str
    vessel_name: str
    vessel_type: str
    deadweight_tonnage: float = Field(..., gt=0)
    cargo_capacity_tonnes: float = Field(..., gt=0)
    engine_power_kw: float = Field(..., gt=0)
    length_m: Optional[float] = None
    beam_m: Optional[float] = None
    draft_m: Optional[float] = None
    design_speed_knots: float = Field(..., gt=0)
    minimum_speed_knots: float = Field(default=10.0, gt=0)
    maximum_speed_knots: float = Field(default=24.0, gt=0)
    compatible_fuels: List[str] = ["VLSFO", "MGO"]
    availability_status: str = "AVAILABLE"
    maintenance_status: str = "GOOD"
    daily_charter_cost_usd: float = 15000.0
    crew_cost_per_day_usd: float = 4500.0
    data_source: str = "Engineering Standard Reference"
    is_hypothetical: bool = False
    notes: Optional[str] = None

class VesselCreate(VesselBase):
    pass

class VesselUpdate(BaseModel):
    vessel_name: Optional[str] = None
    vessel_type: Optional[str] = None
    deadweight_tonnage: Optional[float] = None
    cargo_capacity_tonnes: Optional[float] = None
    engine_power_kw: Optional[float] = None
    design_speed_knots: Optional[float] = None
    minimum_speed_knots: Optional[float] = None
    maximum_speed_knots: Optional[float] = None
    compatible_fuels: Optional[List[str]] = None
    availability_status: Optional[str] = None
    maintenance_status: Optional[str] = None
    daily_charter_cost_usd: Optional[float] = None
    crew_cost_per_day_usd: Optional[float] = None
    data_source: Optional[str] = None
    is_hypothetical: Optional[bool] = None
    notes: Optional[str] = None

class VesselResponse(VesselBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Fuel Schemas
class FuelReferenceBase(BaseModel):
    fuel_code: str
    fuel_name: str
    category: str
    price_per_tonne_usd: float
    lower_heating_value_mj_per_kg: float
    direct_emission_factor_tco2_per_tfuel: float
    well_to_wake_emission_factor_tco2_per_tfuel: float
    ch4_emission_factor_g_per_kg: float = 0.0
    n2o_emission_factor_g_per_kg: float = 0.0
    availability_score: float = 1.0
    is_zero_carbon: bool = False
    data_source: str = "Fourth IMO GHG Study (2020)"
    price_reference_date: str = "2026-Q1"

class FuelReferenceResponse(FuelReferenceBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Port Schemas
class PortBase(BaseModel):
    port_code: str
    port_name: str
    country: str
    latitude: float
    longitude: float
    shore_power_available: bool = False
    shore_power_capacity_kw: float = 0.0
    electricity_price_kwh_usd: float = 0.15
    grid_emission_factor_kg_co2_per_kwh: float = 0.45
    available_fuels: List[str] = []
    data_source: str = "World Port Index"

class PortResponse(PortBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Voyage Schemas
class VoyageRouteBase(BaseModel):
    route_code: str
    origin_port_code: str
    destination_port_code: str
    distance_nm: float
    scheduled_departure: Optional[datetime] = None
    arrival_deadline_hours: float
    required_cargo_tonnes: float
    priority: str = "NORMAL"
    sea_state_douglas: int = 3
    avg_wind_speed_knots: float = 15.0
    avg_wave_height_m: float = 1.8
    data_source: str = "Standard Maritime Route Database"

class VoyageRouteResponse(VoyageRouteBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Dataset Schemas
class DatasetMetadataResponse(BaseModel):
    id: int
    dataset_name: str
    category: str
    file_path: str
    row_count: int
    column_count: int
    schema_definition: Dict[str, Any]
    validation_summary: Dict[str, Any]
    data_source: str
    version: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DatasetValidationReport(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    missing_values: Dict[str, int]
    suspicious_outliers: Dict[str, int]
    duplicates_count: int
    validation_status: str # "PASSED", "WARNING", "FAILED"
    issues: List[str]
    preview_rows: List[Dict[str, Any]]

# ML & Prediction Schemas
class PredictionRequest(BaseModel):
    vessel_type: str
    deadweight_tonnage: float
    engine_power_kw: float
    cargo_load_tonnes: float
    speed_knots: float
    distance_nm: float
    fuel_type: str = "VLSFO"
    wind_speed_knots: float = 12.0
    wave_height_m: float = 1.5

class PredictionResponse(BaseModel):
    predicted_fuel_consumption_kg: float
    predicted_fuel_consumption_tonnes: float
    estimated_voyage_hours: float
    fuel_cost_usd: float
    direct_co2_emissions_tonnes: float
    well_to_wake_emissions_tonnes: float
    model_name: str
    model_version: str
    data_provenance: str
    confidence_interval_95_kg: Optional[List[float]] = None
    input_summary: Dict[str, Any]

class ModelEvaluationMetrics(BaseModel):
    model_name: str
    mae: float
    rmse: float
    r2_score: float
    mape: float
    test_samples: int
    features_used: List[str]
    target_unit: str = "kg per voyage"
    trained_at: str

# Cost & Emissions Engine Schemas
class EmissionCalculationRequest(BaseModel):
    fuel_type: str
    fuel_consumption_tonnes: float
    auxiliary_fuel_tonnes: float = 0.0
    berth_hours: float = 0.0
    shore_power_used: bool = False
    port_code: Optional[str] = "SGSIN"

class EmissionCalculationResponse(BaseModel):
    fuel_type: str
    fuel_consumption_tonnes: float
    fuel_price_per_tonne_usd: float
    fuel_cost_usd: float
    tank_to_wake_co2_tonnes: float
    tank_to_wake_ch4_tonnes: float
    tank_to_wake_n2o_tonnes: float
    total_direct_ghg_co2eq_tonnes: float
    well_to_wake_lifecycle_co2eq_tonnes: float
    shore_power_electricity_kwh: float
    shore_power_cost_usd: float
    shore_power_emissions_tco2: float
    total_voyage_and_port_cost_usd: float
    total_lifecycle_emissions_tco2eq: float
    accounting_standard: str = "IMO 2020 GHG Methodology / GREET Marine WTW"

# Optimization Schemas
class FleetObjectiveWeights(BaseModel):
    cost: float = Field(default=0.4, ge=0.0, le=1.0)
    fuel: float = Field(default=0.3, ge=0.0, le=1.0)
    emissions: float = Field(default=0.3, ge=0.0, le=1.0)

class OptimizationConstraints(BaseModel):
    max_allowable_emissions_tco2: Optional[float] = None
    mandatory_shore_power: bool = False
    allowed_fuel_types: Optional[List[str]] = None
    max_voyage_delay_hours: float = 0.0

class OptimizationRunRequest(BaseModel):
    job_name: str = "Fleet Deployment Optimization"
    algorithm: str = "QEA" # QEA, GA, SA, EXACT_GREEDY
    selected_vessel_ids: Optional[List[str]] = None
    selected_route_codes: Optional[List[str]] = None
    weights: FleetObjectiveWeights = FleetObjectiveWeights()
    constraints: OptimizationConstraints = OptimizationConstraints()
    population_size: int = Field(default=30, ge=10, le=200)
    generations: int = Field(default=50, ge=10, le=500)
    random_seed: int = 42

class AssignedVesselPlan(BaseModel):
    vessel_id: str
    vessel_name: str
    vessel_type: str
    route_code: str
    origin_port: str
    destination_port: str
    distance_nm: float
    allocated_cargo_tonnes: float
    capacity_utilization_pct: float
    chosen_speed_knots: float
    chosen_fuel: str
    voyage_duration_hours: float
    deadline_hours: float
    arrival_margin_hours: float
    fuel_consumption_tonnes: float
    fuel_cost_usd: float
    operating_cost_usd: float
    total_cost_usd: float
    direct_emissions_tco2: float
    lifecycle_emissions_tco2eq: float
    shore_power_applied: bool

class OptimizationResultResponse(BaseModel):
    job_id: int
    job_name: str
    algorithm: str
    status: str
    is_feasible: bool
    runtime_ms: float
    generations_run: int
    random_seed: int
    total_cost_usd: float
    total_fuel_tonnes: float
    total_lifecycle_emissions_tco2eq: float
    total_cargo_fulfilled_tonnes: float
    total_cargo_demanded_tonnes: float
    cargo_fulfillment_rate_pct: float
    fleet_capacity_utilization_pct: float
    penalty_value: float
    vessel_assignments: List[AssignedVesselPlan]
    convergence_history: List[Dict[str, Any]]
    constraint_violations: List[str]
    weights_used: Dict[str, float]
    created_at: datetime

# Scenario Lab Schemas
class ScenarioSimulateRequest(BaseModel):
    scenario_type: str # BASELINE, SPEED_REDUCTION, LNG, METHANOL, HYDROGEN, AMMONIA, MIXED_FLEET, SHORE_POWER, CUSTOM
    speed_reduction_pct: float = 0.0
    selected_fuel: Optional[str] = None
    enable_shore_power: bool = False
    custom_fuel_price_multiplier: float = 1.0
    custom_emission_factor_multiplier: float = 1.0
    vessel_ids: Optional[List[str]] = None

class ScenarioComparisonItem(BaseModel):
    scenario_name: str
    scenario_type: str
    fuel_tonnes: float
    total_cost_usd: float
    direct_emissions_tco2: float
    lifecycle_emissions_tco2eq: float
    cargo_fulfillment_pct: float
    avg_speed_knots: float
    cost_diff_pct_vs_baseline: float
    emissions_diff_pct_vs_baseline: float
    fuel_diff_pct_vs_baseline: float
    feasibility: str
    key_tradeoff: str

class ScenarioLabResponse(BaseModel):
    baseline: ScenarioComparisonItem
    scenarios: List[ScenarioComparisonItem]
    insights: List[str]

# Benchmark Schemas
class BenchmarkRunRequest(BaseModel):
    benchmark_name: str = "Standard QEA vs Heuristic Baselines"
    problem_scale: str = "STANDARD" # SMALL, STANDARD, LARGE
    algorithms: List[str] = ["QEA", "GA", "SA", "EXACT_GREEDY"]
    population_size: int = 30
    generations: int = 40
    runs_per_algorithm: int = 3
    random_seed: int = 42

class AlgorithmBenchmarkResult(BaseModel):
    algorithm: str
    best_objective: float
    mean_objective: float
    std_objective: float
    best_cost_usd: float
    best_emissions_tco2: float
    best_fuel_tonnes: float
    avg_runtime_ms: float
    feasibility_rate_pct: float
    evaluations_count: int
    convergence_curve: List[Dict[str, Any]]

class BenchmarkSuiteResponse(BaseModel):
    benchmark_name: str
    problem_scale: str
    total_vessels: int
    total_routes: int
    total_cargo_demand_tonnes: float
    results: List[AlgorithmBenchmarkResult]
    pareto_solutions: List[Dict[str, Any]]
    recommendation: str

# Executive Dashboard Schema
class DashboardKPISummary(BaseModel):
    total_vessels: int
    available_vessels: int
    total_cargo_demand_tonnes: float
    total_cargo_fulfilled_tonnes: float
    fulfillment_rate_pct: float
    predicted_monthly_fuel_tonnes: float
    estimated_monthly_cost_usd: float
    estimated_monthly_emissions_tco2: float
    average_fleet_speed_knots: float
    active_optimization_jobs: int
    potential_savings_usd: float
    potential_emissions_reduction_pct: float
    recent_jobs: List[Dict[str, Any]]
    fuel_distribution: List[Dict[str, Any]]
    emissions_by_vessel_type: List[Dict[str, Any]]
    speed_vs_consumption_curve: List[Dict[str, Any]]
