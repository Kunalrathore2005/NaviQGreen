import axios from 'axios';
import {
  Vessel,
  PredictionRequest,
  PredictionResponse,
  OptimizationResult,
  ScenarioResponse,
  BenchmarkResponse,
  DashboardKPISummary,
  DatasetMetadata,
  FuelReference,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Request interceptor to attach JWT if logged in
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('naviq_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Auth
  demoLogin: async () => {
    const res = await apiClient.post('/auth/demo-login');
    if (res.data.access_token) {
      localStorage.setItem('naviq_access_token', res.data.access_token);
      localStorage.setItem('naviq_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('naviq_access_token', res.data.access_token);
      localStorage.setItem('naviq_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (data: { email: string; password: string; full_name?: string; role?: string }) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('naviq_access_token');
    localStorage.removeItem('naviq_user');
  },
  getCurrentUser: () => {
    const u = localStorage.getItem('naviq_user');
    return u ? JSON.parse(u) : null;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardKPISummary> => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },

  // Vessels
  getVessels: async (params?: { type?: string; status?: string; search?: string }): Promise<Vessel[]> => {
    const res = await apiClient.get('/vessels', { params });
    return res.data;
  },
  getVesselById: async (id: string): Promise<Vessel> => {
    const res = await apiClient.get(`/vessels/${id}`);
    return res.data;
  },
  createVessel: async (data: Partial<Vessel>): Promise<Vessel> => {
    const res = await apiClient.post('/vessels', data);
    return res.data;
  },
  updateVessel: async (id: string, data: Partial<Vessel>): Promise<Vessel> => {
    const res = await apiClient.put(`/vessels/${id}`, data);
    return res.data;
  },
  deleteVessel: async (id: string): Promise<void> => {
    await apiClient.delete(`/vessels/${id}`);
  },
  importVesselsCsv: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/vessels/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getVesselsExportUrl: () => `${API_BASE_URL}/vessels/export-csv/download`,

  // Fuel Prediction
  getModelInfo: async () => {
    const res = await apiClient.get('/prediction/model-info');
    return res.data;
  },
  trainModel: async () => {
    const res = await apiClient.post('/prediction/train');
    return res.data;
  },
  predictFuel: async (payload: PredictionRequest): Promise<PredictionResponse> => {
    const res = await apiClient.post('/prediction/predict', payload);
    return res.data;
  },

  // Emissions & Cost
  getFuelsCatalogue: async (): Promise<FuelReference[]> => {
    const res = await apiClient.get('/emissions/fuels-catalogue');
    return res.data;
  },
  calculateEmissions: async (payload: {
    fuel_type: string;
    fuel_consumption_tonnes: number;
    berth_hours?: number;
    shore_power_used?: boolean;
    port_code?: string;
  }) => {
    const res = await apiClient.post('/emissions/calculate', payload);
    return res.data;
  },

  // Optimization
  runOptimization: async (payload: {
    job_name?: string;
    algorithm?: string;
    selected_vessel_ids?: string[];
    selected_route_codes?: string[];
    weights?: { cost: number; fuel: number; emissions: number };
    constraints?: { max_allowable_emissions_tco2?: number; mandatory_shore_power?: boolean };
    population_size?: number;
    generations?: number;
    random_seed?: number;
  }): Promise<OptimizationResult> => {
    const res = await apiClient.post('/optimization/run', payload);
    return res.data;
  },
  getOptimizationJobs: async () => {
    const res = await apiClient.get('/optimization/jobs');
    return res.data;
  },
  getOptimizationJobById: async (jobId: number): Promise<OptimizationResult> => {
    const res = await apiClient.get(`/optimization/jobs/${jobId}`);
    return res.data;
  },

  // Scenarios
  getScenarios: async (): Promise<ScenarioResponse> => {
    const res = await apiClient.get('/scenarios');
    return res.data;
  },
  simulateScenario: async (payload: {
    scenario_type?: string;
    speed_reduction_pct?: number;
    selected_fuel?: string;
    enable_shore_power?: boolean;
    custom_fuel_price_multiplier?: number;
    custom_emission_factor_multiplier?: number;
  }): Promise<ScenarioResponse> => {
    const res = await apiClient.post('/scenarios/simulate', payload);
    return res.data;
  },

  // Benchmarks
  runBenchmarks: async (payload: {
    benchmark_name?: string;
    problem_scale?: string;
    algorithms?: string[];
    population_size?: number;
    generations?: number;
    runs_per_algorithm?: number;
    random_seed?: number;
  }): Promise<BenchmarkResponse> => {
    const res = await apiClient.post('/benchmarks/run', payload);
    return res.data;
  },
  getDefaultBenchmark: async (): Promise<BenchmarkResponse> => {
    const res = await apiClient.get('/benchmarks/default');
    return res.data;
  },

  // Datasets
  getDatasets: async (): Promise<DatasetMetadata[]> => {
    const res = await apiClient.get('/datasets');
    return res.data;
  },
  validateDatasetFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/datasets/validate-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  uploadDataset: async (file: File, category: string, dataSource: string, version: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('data_source', dataSource);
    formData.append('version', version);
    const res = await apiClient.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getDatasetPreview: async (datasetId: number) => {
    const res = await apiClient.get(`/datasets/${datasetId}/preview`);
    return res.data;
  },

  // Reports
  getOptimizationCsvUrl: (jobId: number) => `${API_BASE_URL}/reports/optimization/${jobId}/csv`,
  getOptimizationJson: async (jobId: number) => {
    const res = await apiClient.get(`/reports/optimization/${jobId}/json`);
    return res.data;
  },

  // Geospatial Maritime Digital Twin
  getGeospatialSummary: async () => {
    const res = await apiClient.get('/geospatial/summary');
    return res.data;
  },
  getShippingCorridors: async () => {
    const res = await apiClient.get('/geospatial/corridors');
    return res.data;
  },
  getLiveVessels: async () => {
    const res = await apiClient.get('/geospatial/vessels');
    return res.data;
  },
  getECAZones: async () => {
    const res = await apiClient.get('/geospatial/ecas');
    return res.data;
  },
  getWorldPorts: async () => {
    const res = await apiClient.get('/geospatial/ports');
    return res.data;
  },

  // Quantum-Inspired Laboratory
  getQuantumSpec: async () => {
    const res = await apiClient.get('/quantum-lab/spec');
    return res.data;
  },
  rotateQuantumGate: async (params: {
    alpha: number;
    beta: number;
    x_bit: number;
    best_bit: number;
    is_worse: boolean;
    step_size_deg: number;
  }) => {
    const res = await apiClient.post('/quantum-lab/rotate', params);
    return res.data;
  },
  measureQuantumBit: async (params: { alpha: number; beta: number; trials: number }) => {
    const res = await apiClient.post('/quantum-lab/measure', params);
    return res.data;
  },
  simulateQuantumCatastrophe: async (params: { num_bits: number; stagnation_bias: number }) => {
    const res = await apiClient.post('/quantum-lab/catastrophe', params);
    return res.data;
  },
};

