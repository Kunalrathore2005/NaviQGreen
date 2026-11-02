export interface Vessel {
  id: number;
  vessel_id: string;
  vessel_name: string;
  vessel_type: string;
  deadweight_tonnage: number;
  cargo_capacity_tonnes: number;
  engine_power_kw: number;
  length_m?: number | null;
  beam_m?: number | null;
  draft_m?: number | null;
  design_speed_knots: number;
  minimum_speed_knots: number;
  maximum_speed_knots: number;
  compatible_fuels: string[];
  availability_status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'RETIRED';
  maintenance_status: 'GOOD' | 'DUE_SOON' | 'UNDER_REPAIR';
  daily_charter_cost_usd: number;
  crew_cost_per_day_usd: number;
  data_source: string;
  is_hypothetical: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelReference {
  fuel_code: string;
  fuel_name: string;
  category: string;
  price_per_tonne_usd: number;
  lower_heating_value_mj_per_kg: number;
  direct_emission_factor_tco2_per_tfuel: number;
  well_to_wake_emission_factor_tco2_per_tfuel: number;
  ch4_emission_factor_g_per_kg: number;
  n2o_emission_factor_g_per_kg: number;
  is_zero_carbon: boolean;
}

export interface PredictionRequest {
  vessel_type: string;
  deadweight_tonnage: number;
  engine_power_kw: number;
  cargo_load_tonnes: number;
  speed_knots: number;
  distance_nm: number;
  fuel_type: string;
  wind_speed_knots: number;
  wave_height_m: number;
}

export interface PredictionResponse {
  predicted_fuel_consumption_kg: number;
  predicted_fuel_consumption_tonnes: number;
  estimated_voyage_hours: number;
  fuel_cost_usd: number;
  direct_co2_emissions_tonnes: number;
  well_to_wake_emissions_tonnes: number;
  model_name: string;
  model_version: string;
  data_provenance: string;
  confidence_interval_95_kg: [number, number];
  input_summary: Record<string, any>;
}

export interface AssignedVesselPlan {
  vessel_id: string;
  vessel_name: string;
  vessel_type: string;
  route_code: string;
  origin_port: string;
  destination_port: string;
  distance_nm: number;
  allocated_cargo_tonnes: number;
  capacity_utilization_pct: number;
  chosen_speed_knots: number;
  chosen_fuel: string;
  voyage_duration_hours: number;
  deadline_hours: number;
  arrival_margin_hours: number;
  fuel_consumption_tonnes: number;
  fuel_cost_usd: number;
  operating_cost_usd: number;
  total_cost_usd: number;
  direct_emissions_tco2: number;
  lifecycle_emissions_tco2eq: number;
  shore_power_applied: boolean;
}

export interface OptimizationResult {
  job_id: number;
  job_name: string;
  algorithm: string;
  status: string;
  is_feasible: boolean;
  runtime_ms: number;
  generations_run: number;
  random_seed: number;
  total_cost_usd: number;
  total_fuel_tonnes: number;
  total_lifecycle_emissions_tco2eq: number;
  total_cargo_fulfilled_tonnes: number;
  total_cargo_demanded_tonnes: number;
  cargo_fulfillment_rate_pct: number;
  fleet_capacity_utilization_pct: number;
  penalty_value: number;
  vessel_assignments: AssignedVesselPlan[];
  convergence_history: Array<{
    generation: number;
    best_objective: number;
    avg_objective: number;
    feasible_solutions: number;
    best_cost_usd: number;
    best_fuel_tonnes: number;
    best_emissions_tco2: number;
  }>;
  constraint_violations: string[];
  weights_used: { cost: number; fuel: number; emissions: number };
  created_at: string;
}

export interface ScenarioItem {
  scenario_name: string;
  scenario_type: string;
  fuel_tonnes: number;
  total_cost_usd: number;
  direct_emissions_tco2: number;
  lifecycle_emissions_tco2eq: number;
  cargo_fulfillment_pct: number;
  avg_speed_knots: number;
  cost_diff_pct_vs_baseline: number;
  emissions_diff_pct_vs_baseline: number;
  fuel_diff_pct_vs_baseline: number;
  feasibility: string;
  key_tradeoff: string;
}

export interface ScenarioResponse {
  baseline: ScenarioItem;
  scenarios: ScenarioItem[];
  insights: string[];
}

export interface BenchmarkAlgorithmResult {
  algorithm: string;
  best_objective: number;
  mean_objective: number;
  std_objective: number;
  best_cost_usd: number;
  best_emissions_tco2: number;
  best_fuel_tonnes: number;
  avg_runtime_ms: number;
  feasibility_rate_pct: number;
  evaluations_count: number;
  convergence_curve: Array<{
    generation: number;
    best_objective: number;
  }>;
}

export interface BenchmarkResponse {
  benchmark_name: string;
  problem_scale: string;
  total_vessels: number;
  total_routes: number;
  total_cargo_demand_tonnes: number;
  results: BenchmarkAlgorithmResult[];
  pareto_solutions: Array<{
    algorithm: string;
    cost_usd: number;
    lifecycle_emissions_tco2: number;
    fuel_tonnes: number;
  }>;
  recommendation: string;
}

export interface DashboardKPISummary {
  total_vessels: number;
  available_vessels: number;
  total_cargo_demand_tonnes: number;
  total_cargo_fulfilled_tonnes: number;
  fulfillment_rate_pct: number;
  predicted_monthly_fuel_tonnes: number;
  estimated_monthly_cost_usd: number;
  estimated_monthly_emissions_tco2: number;
  average_fleet_speed_knots: number;
  active_optimization_jobs: number;
  potential_savings_usd: number;
  potential_emissions_reduction_pct: number;
  recent_jobs: Array<{
    id: number;
    job_name: string;
    algorithm: string;
    status: string;
    is_feasible: boolean;
    objective_value: number;
    runtime_ms: number;
    created_at: string;
  }>;
  fuel_distribution: Array<{
    fuel: string;
    share_pct: number;
    cost_per_tonne: number;
    lifecycle_factor: number;
  }>;
  emissions_by_vessel_type: Array<{
    type: string;
    count: number;
    estimated_tco2: number;
  }>;
  speed_vs_consumption_curve: Array<{
    speed_knots: number;
    consumption_tonnes: number;
    voyage_hours: number;
    emissions_tco2: number;
  }>;
}

export interface DatasetMetadata {
  id: number;
  dataset_name: string;
  category: string;
  file_path: string;
  row_count: number;
  column_count: number;
  schema_definition: Record<string, string>;
  validation_summary: Record<string, any>;
  data_source: string;
  version: string;
  created_at: string;
}

export interface GlobalPort {
  code: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
  berths: number;
  shore_power: boolean;
  grid_carbon_g_kwh: number;
  lng_bunkering: boolean;
  bio_methanol_bunkering: boolean;
}

export interface ShippingCorridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_nm: number;
  avg_duration_days: number;
  eca_zones_crossed: string[];
  waypoints: [number, number][];
}

export interface ECAZone {
  id: string;
  name: string;
  regulation: string;
  color: string;
  fill_color: string;
  coordinates: [number, number][];
}

export interface LiveVessel {
  id: string;
  name: string;
  type: string;
  dwt: number;
  fuel_type: string;
  speed_knots: number;
  design_speed: number;
  lat: number;
  lng: number;
  heading: number;
  route_id: string;
  origin: string;
  destination: string;
  eta_days: number;
  cargo_tonnes: number;
  fuel_burn_mt_day: number;
  co2e_rate_t_day: number;
  cii_rating: string;
  shore_power_equipped: boolean;
  status: string;
}

export interface QuantumStateVector {
  alpha: number;
  beta: number;
  p_zero: number;
  p_one: number;
  theta_deg: number;
}

export interface QuantumRotateResponse {
  status: string;
  rule_applied: string;
  delta_theta_applied_deg: number;
  rotation_matrix: number[][];
  state_before: QuantumStateVector;
  state_after: QuantumStateVector;
}

export interface QuantumMeasureResponse {
  trials: number;
  theoretical_p_zero: number;
  theoretical_p_one: number;
  measured_zeros: number;
  measured_ones: number;
  empirical_frequency_zero: number;
  empirical_frequency_one: number;
  sample_head_sequence: number[];
  convergence_delta: number;
}

export interface QuantumCatastropheResponse {
  num_bits: number;
  entropy_before: number;
  catastrophe_threshold: number;
  catastrophe_triggered: boolean;
  entropy_after: number;
  entropy_gain_pct: number;
  bits_before: Array<{
    bit_index: number;
    alpha: number;
    beta: number;
    p_zero: number;
    p_one: number;
    entropy: number;
  }>;
  bits_after: Array<{
    bit_index: number;
    alpha: number;
    beta: number;
    p_zero: number;
    p_one: number;
    entropy: number;
    reset_applied: boolean;
  }>;
}


