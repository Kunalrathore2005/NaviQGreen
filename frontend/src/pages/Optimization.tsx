import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Ship,
  Sliders,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { Vessel } from '../types';

export const Optimization: React.FC = () => {
  const navigate = useNavigate();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessels, setSelectedVessels] = useState<string[]>([]);
  const [loadingVessels, setLoadingVessels] = useState<boolean>(true);

  // Form parameters
  const [jobName, setJobName] = useState<string>('Transpacific & Asia-Europe Green Deployment');
  const [algorithm, setAlgorithm] = useState<string>('QEA');
  const [costWeight, setCostWeight] = useState<number>(0.4);
  const [fuelWeight, setFuelWeight] = useState<number>(0.3);
  const [emissionsWeight, setEmissionsWeight] = useState<number>(0.3);
  const [populationSize, setPopulationSize] = useState<number>(30);
  const [generations, setGenerations] = useState<number>(40);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [mandatoryShorePower, setMandatoryShorePower] = useState<boolean>(false);

  const [running, setRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getVessels({ status: 'AVAILABLE' })
      .then((data) => {
        setVessels(data);
        setSelectedVessels(data.map((v) => v.vessel_id));
      })
      .catch(console.error)
      .finally(() => setLoadingVessels(false));
  }, []);

  const handleWeightChange = (type: 'cost' | 'fuel' | 'emissions', val: number) => {
    if (type === 'cost') setCostWeight(val);
    if (type === 'fuel') setFuelWeight(val);
    if (type === 'emissions') setEmissionsWeight(val);
  };

  const normalizeWeights = () => {
    const total = costWeight + fuelWeight + emissionsWeight;
    if (total > 0) {
      setCostWeight(parseFloat((costWeight / total).toFixed(2)));
      setFuelWeight(parseFloat((fuelWeight / total).toFixed(2)));
      setEmissionsWeight(parseFloat((emissionsWeight / total).toFixed(2)));
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVessels.length === 0) {
      alert('Select at least one vessel to optimize.');
      return;
    }
    setRunning(true);
    setErrorMsg(null);
    try {
      const res = await api.runOptimization({
        job_name: jobName,
        algorithm: algorithm,
        selected_vessel_ids: selectedVessels,
        weights: { cost: costWeight, fuel: fuelWeight, emissions: emissionsWeight },
        constraints: { mandatory_shore_power: mandatoryShorePower },
        population_size: populationSize,
        generations: generations,
        random_seed: randomSeed,
      });
      navigate(`/results/${res.job_id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Optimization failed to complete.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Fleet Optimization Workspace</h1>
          <Badge variant="cyan">Quantum-Inspired QEA Engine</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Formulate multi-objective vessel deployment, assign cruising speeds, match low-carbon bunker fuels, and solve using quantum probability rotation gates.
        </p>
      </div>

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* Step 1 & 2: Fleet Selection & Algorithm */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Configuration Form */}
          <div className="lg:col-span-7 space-y-5">
            {/* Job Metadata */}
            <div className="card-maritime p-5 space-y-4 text-xs">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-brand" />
                <span>Job Identity & Algorithm Solver</span>
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Deployment Job Name *</label>
                  <input
                    type="text"
                    required
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    className="input-maritime w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Optimization Algorithm *</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="input-maritime w-full"
                  >
                    <option value="QEA">Quantum-Inspired Evolutionary Algorithm (QEA)</option>
                    <option value="GA">Genetic Algorithm (GA Baseline)</option>
                    <option value="SA">Simulated Annealing (SA Baseline)</option>
                    <option value="EXACT_GREEDY">Exact / Greedy Deterministic Baseline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Deterministic Random Seed</label>
                  <input
                    type="number"
                    value={randomSeed}
                    onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                    className="input-maritime w-full font-mono"
                  />
                </div>
              </div>

              {algorithm !== 'EXACT_GREEDY' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy-750">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Population Size</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={populationSize}
                      onChange={(e) => setPopulationSize(parseInt(e.target.value) || 30)}
                      className="input-maritime w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Generations / Iterations</label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={generations}
                      onChange={(e) => setGenerations(parseInt(e.target.value) || 40)}
                      className="input-maritime w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Multi-Objective Priorities */}
            <div className="card-maritime p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-glow" />
                  <span>Objective Trade-off Weights</span>
                </h2>
                <button
                  type="button"
                  onClick={normalizeWeights}
                  className="text-[11px] text-cyan-brand hover:underline font-semibold"
                >
                  Normalize to 1.0
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Operating & Voyage Cost Weight (w_cost)</span>
                    <span className="font-mono text-cyan-brand font-bold">{costWeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={costWeight}
                    onChange={(e) => handleWeightChange('cost', parseFloat(e.target.value))}
                    className="w-full accent-cyan-brand"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Fuel Mass Consumption Weight (w_fuel)</span>
                    <span className="font-mono text-ocean-400 font-bold">{fuelWeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={fuelWeight}
                    onChange={(e) => handleWeightChange('fuel', parseFloat(e.target.value))}
                    className="w-full accent-ocean-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Lifecycle GHG Emissions Weight (w_emissions)</span>
                    <span className="font-mono text-emerald-glow font-bold">{emissionsWeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={emissionsWeight}
                    onChange={(e) => handleWeightChange('emissions', parseFloat(e.target.value))}
                    className="w-full accent-emerald-leaf"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-navy-750">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={mandatoryShorePower}
                    onChange={(e) => setMandatoryShorePower(e.target.checked)}
                    className="rounded border-navy-700 text-cyan-brand focus:ring-0"
                  />
                  <span>Mandatory Shore Power (Cold Ironing) at Capable Destination Ports</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Fleet Selection Table */}
          <div className="lg:col-span-5 card-maritime p-5 flex flex-col text-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-navy-750">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-brand" />
                <span>Select Available Fleet</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                {selectedVessels.length} of {vessels.length} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1">
              {vessels.map((v) => {
                const isSelected = selectedVessels.includes(v.vessel_id);
                return (
                  <div
                    key={v.vessel_id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedVessels(selectedVessels.filter((x) => x !== v.vessel_id));
                      } else {
                        setSelectedVessels([...selectedVessels, v.vessel_id]);
                      }
                    }}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-navy-800/80 border-cyan-brand/40 text-white'
                        : 'bg-navy-950/60 border-navy-800 text-slate-400 hover:border-navy-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-cyan-brand font-mono text-[11px]">{v.vessel_id}</span>
                        <span>{v.vessel_name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {v.vessel_type} • {v.deadweight_tonnage.toLocaleString()} DWT • {v.design_speed_knots} kts
                      </p>
                    </div>

                    <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0 ml-2 transition">
                      {isSelected && <CheckCircle className="w-4 h-4 text-cyan-brand fill-cyan-brand/20" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={running || selectedVessels.length === 0}
              className="btn-cyan w-full py-3 text-xs font-bold shadow-glow-cyan flex items-center justify-center gap-2 mt-4"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{running ? 'Executing Quantum-Inspired Optimization...' : 'Run Optimization Job'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

