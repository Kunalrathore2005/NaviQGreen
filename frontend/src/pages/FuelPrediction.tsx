import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Gauge,
  Cpu,
  RefreshCw,
  Fuel,
  DollarSign,
  Cloud,
  CheckCircle,
  Wind,
  Waves,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { PredictionRequest, PredictionResponse } from '../types';

export const FuelPrediction: React.FC = () => {
  const location = useLocation();
  const prefillVessel = (location.state as any)?.vessel;

  const [form, setForm] = useState<PredictionRequest>({
    vessel_type: prefillVessel?.vessel_type || 'Container',
    deadweight_tonnage: prefillVessel?.deadweight_tonnage || 120000,
    engine_power_kw: prefillVessel?.engine_power_kw || 58000,
    cargo_load_tonnes: prefillVessel ? prefillVessel.cargo_capacity_tonnes * 0.85 : 95000,
    speed_knots: prefillVessel?.design_speed_knots || 19.5,
    distance_nm: 3400,
    fuel_type: prefillVessel?.compatible_fuels?.[0] || 'VLSFO',
    wind_speed_knots: 14.0,
    wave_height_m: 1.6,
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [predicting, setPredicting] = useState<boolean>(false);
  const [training, setTraining] = useState<boolean>(false);

  const fetchModelInfo = async () => {
    try {
      const info = await api.getModelInfo();
      setModelInfo(info);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const res = await api.predictFuel(form);
      setPrediction(res);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleRetrain = async () => {
    if (!window.confirm('Retrain all candidate ML models on validated training dataset?')) return;
    setTraining(true);
    try {
      const res = await api.trainModel();
      alert(`Model trained successfully! Selected Top Performer: ${res.metrics.selected_model || res.message}`);
      fetchModelInfo();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white">Fuel Consumption Prediction Studio</h1>
            <Badge variant="cyan">Trained ML Model</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Physics-informed hydrodynamic regression pipeline predicting voyage fuel mass, bunker expenditure, and Well-to-Wake emissions.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={training}
          className="btn-ghost-marine text-xs flex items-center gap-2 py-2 px-3.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
          <span>{training ? 'Retraining Candidates...' : 'Retrain Pipeline'}</span>
        </button>
      </div>

      {/* Model Benchmark Card */}
      {modelInfo && (
        <div className="card-maritime p-4 border-cyan-brand/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-brand/10 text-cyan-brand">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{modelInfo.selected_model}</span>
                <Badge variant="emerald">{modelInfo.model_version}</Badge>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Target: {modelInfo.target_unit} across {modelInfo.training_samples} training samples
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Test R² Score</span>
              <span className="text-emerald-glow font-bold text-sm">{modelInfo.metrics.r2_score}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Mean Abs Error (MAE)</span>
              <span className="text-slate-200 font-bold text-sm">{modelInfo.metrics.mae.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">MAPE</span>
              <span className="text-cyan-brand font-bold text-sm">{modelInfo.metrics.mape}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Prediction Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 card-maritime p-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-cyan-brand" />
            <span>Voyage & Vessel Parameters</span>
          </h2>

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Vessel Class</label>
                <select
                  value={form.vessel_type}
                  onChange={(e) => setForm({ ...form, vessel_type: e.target.value })}
                  className="input-maritime w-full"
                >
                  <option value="Container">Container</option>
                  <option value="Bulk Carrier">Bulk Carrier</option>
                  <option value="Oil Tanker">Oil Tanker</option>
                  <option value="LNG Carrier">LNG Carrier</option>
                  <option value="General Cargo">General Cargo</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Fuel Type</label>
                <select
                  value={form.fuel_type}
                  onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                  className="input-maritime w-full"
                >
                  <option value="VLSFO">VLSFO (0.5% S)</option>
                  <option value="MGO">MGO (0.1% S)</option>
                  <option value="LNG">LNG Dual-Fuel</option>
                  <option value="Methanol">Bio/e-Methanol</option>
                  <option value="Ammonia">Green Ammonia</option>
                  <option value="Hydrogen">Liquid Hydrogen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Deadweight (DWT MT)</label>
                <input
                  type="number"
                  required
                  value={form.deadweight_tonnage}
                  onChange={(e) => setForm({ ...form, deadweight_tonnage: parseFloat(e.target.value) })}
                  className="input-maritime w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Engine Power (kW)</label>
                <input
                  type="number"
                  required
                  value={form.engine_power_kw}
                  onChange={(e) => setForm({ ...form, engine_power_kw: parseFloat(e.target.value) })}
                  className="input-maritime w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Cargo Load (MT)</label>
                <input
                  type="number"
                  required
                  value={form.cargo_load_tonnes}
                  onChange={(e) => setForm({ ...form, cargo_load_tonnes: parseFloat(e.target.value) })}
                  className="input-maritime w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Cruising Speed (knots)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.speed_knots}
                  onChange={(e) => setForm({ ...form, speed_knots: parseFloat(e.target.value) })}
                  className="input-maritime w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Voyage Distance (Nautical Miles)</label>
              <input
                type="number"
                required
                value={form.distance_nm}
                onChange={(e) => setForm({ ...form, distance_nm: parseFloat(e.target.value) })}
                className="input-maritime w-full"
              />
            </div>

            {/* Environmental Weather Conditions */}
            <div className="pt-2 border-t border-navy-750">
              <span className="block text-[11px] font-semibold text-cyan-brand uppercase tracking-wider mb-2">
                Environmental Added Resistance
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-slate-500" />
                    <span>Wind Speed (kts)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.wind_speed_knots}
                    onChange={(e) => setForm({ ...form, wind_speed_knots: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5 text-slate-500" />
                    <span>Significant Wave Height (m)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.wave_height_m}
                    onChange={(e) => setForm({ ...form, wave_height_m: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="btn-cyan w-full py-2.5 text-xs font-bold shadow-glow-cyan mt-2"
            >
              {predicting ? 'Evaluating Hydrodynamic Pipeline...' : 'Run Prediction Engine'}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-7 space-y-4">
          {prediction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard
                  title="Predicted Fuel Mass"
                  value={prediction.predicted_fuel_consumption_tonnes.toLocaleString()}
                  unit="MT"
                  subtitle={`${prediction.predicted_fuel_consumption_kg.toLocaleString()} kg`}
                  icon={Fuel}
                  color="cyan"
                />
                <MetricCard
                  title="Estimated Fuel Cost"
                  value={`$${prediction.fuel_cost_usd.toLocaleString()}`}
                  subtitle={`Bunker price: ${prediction.input_summary.fuel_type}`}
                  icon={DollarSign}
                  color="amber"
                />
                <MetricCard
                  title="Lifecycle GHG"
                  value={prediction.well_to_wake_emissions_tonnes.toLocaleString()}
                  unit="tCO2eq"
                  subtitle={`Direct TTW: ${prediction.direct_co2_emissions_tonnes} tCO2`}
                  icon={Cloud}
                  color="emerald"
                />
              </div>

              {/* Confidence Interval & Uncertainty Analysis */}
              <div className="card-maritime p-5 border-cyan-brand/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-glow" />
                    <span>95% Prediction Confidence Interval</span>
                  </h3>
                  <Badge variant="emerald">Valid Inference</Badge>
                </div>

                <div className="p-3.5 rounded-lg bg-navy-950/70 border border-navy-750 font-mono text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Lower Bound (2.5%)</span>
                    <span className="text-slate-200 font-bold">
                      {prediction.confidence_interval_95_kg[0].toLocaleString()} kg
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-cyan-brand block text-[10px] uppercase">Point Estimate</span>
                    <span className="text-cyan-brand font-bold text-sm">
                      {prediction.predicted_fuel_consumption_kg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Upper Bound (97.5%)</span>
                    <span className="text-slate-200 font-bold">
                      {prediction.confidence_interval_95_kg[1].toLocaleString()} kg
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <p>
                    <strong className="text-slate-300">Voyage Duration:</strong> {prediction.estimated_voyage_hours} hours ({(prediction.estimated_voyage_hours / 24).toFixed(1)} sea days at {form.speed_knots} kts)
                  </p>
                  <p>
                    <strong className="text-slate-300">Inference Engine:</strong> {prediction.model_name} ({prediction.model_version})
                  </p>
                  <p>
                    <strong className="text-slate-300">Provenance:</strong> {prediction.data_provenance}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-maritime p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Fuel className="w-12 h-12 text-cyan-brand/40 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Awaiting Prediction Inputs</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter vessel dimensions, speed, and distance on the left to evaluate fuel consumption and emissions using trained machine learning models.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

