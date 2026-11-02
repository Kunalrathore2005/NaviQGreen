import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  Cpu,
  TrendingDown,
  Clock,
  CheckCircle,
  RefreshCw,
  GitCompare,
  ScatterChart as ScatterIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Badge } from '../components/Badge';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { BenchmarkResponse } from '../types';

export const Benchmarks: React.FC = () => {
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);

  // Benchmark run parameters
  const [problemScale, setProblemScale] = useState<string>('STANDARD');
  const [popSize, setPopSize] = useState<number>(20);
  const [generations, setGenerations] = useState<number>(25);
  const [runsPerAlgo, setRunsPerAlgo] = useState<number>(2);
  const [seed, setSeed] = useState<number>(42);

  const fetchDefaultBenchmark = async () => {
    setLoading(true);
    try {
      const res = await api.getDefaultBenchmark();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaultBenchmark();
  }, []);

  const handleRunBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res = await api.runBenchmarks({
        problem_scale: problemScale,
        algorithms: ['QEA', 'GA', 'SA', 'EXACT_GREEDY'],
        population_size: popSize,
        generations: generations,
        runs_per_algorithm: runsPerAlgo,
        random_seed: seed,
      });
      setData(res);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Benchmark execution failed.');
    } finally {
      setRunning(false);
    }
  };

  // Prepare convergence curves overlay
  const qeaCurve = data?.results.find((r) => r.algorithm === 'QEA')?.convergence_curve || [];
  const gaCurve = data?.results.find((r) => r.algorithm === 'GA')?.convergence_curve || [];
  const saCurve = data?.results.find((r) => r.algorithm === 'SA')?.convergence_curve || [];

  const maxLen = Math.max(qeaCurve.length, gaCurve.length, saCurve.length);
  const overlayConvergence = [];
  for (let i = 0; i < maxLen; i++) {
    overlayConvergence.push({
      gen: i + 1,
      QEA: qeaCurve[i]?.best_objective,
      GA: gaCurve[i]?.best_objective,
      SA: saCurve[i]?.best_objective,
    });
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Quantum-Inspired Benchmark Laboratory</h1>
          <Badge variant="cyan">Multi-Algorithm Comparative Lab</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Rigorous classical benchmarking of the Quantum-Inspired Evolutionary Algorithm (QEA) against Genetic Algorithm (GA), Simulated Annealing (SA), and Exact baselines under identical evaluation budgets.
        </p>
      </div>

      {/* Benchmark Control Bar */}
      <div className="card-maritime p-5 border-cyan-brand/20">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-cyan-brand" />
          <span>Execute Controlled Benchmark Experiment</span>
        </h2>

        <form onSubmit={handleRunBenchmark} className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Problem Scale</label>
            <select
              value={problemScale}
              onChange={(e) => setProblemScale(e.target.value)}
              className="input-maritime w-full"
            >
              <option value="SMALL">Small (4 Vessels, 2 Routes)</option>
              <option value="STANDARD">Standard (8 Vessels, 4 Routes)</option>
              <option value="LARGE">Large (All Fleet, All Routes)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Population Size</label>
            <input
              type="number"
              min="10"
              max="50"
              value={popSize}
              onChange={(e) => setPopSize(parseInt(e.target.value) || 20)}
              className="input-maritime w-full"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Generations</label>
            <input
              type="number"
              min="10"
              max="100"
              value={generations}
              onChange={(e) => setGenerations(parseInt(e.target.value) || 25)}
              className="input-maritime w-full"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Runs Per Algo</label>
            <input
              type="number"
              min="1"
              max="5"
              value={runsPerAlgo}
              onChange={(e) => setRunsPerAlgo(parseInt(e.target.value) || 2)}
              className="input-maritime w-full"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Deterministic Seed</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
              className="input-maritime w-full font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={running}
              className="btn-cyan w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow-cyan"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{running ? 'Benchmarking...' : 'Execute Suite'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comparative Convergence Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-maritime p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-cyan-brand" />
              <span>Comparative Convergence History (Best Objective vs Generation)</span>
            </h2>
            <span className="text-[11px] text-slate-400">Lower is better</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overlayConvergence}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" opacity={0.5} />
                <XAxis dataKey="gen" stroke="#94A3B8" fontSize={11} label={{ value: 'Generation', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#94A3B8" fontSize={11} label={{ value: 'Objective Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0B192C', borderColor: '#00B4D8', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="QEA" stroke="#00B4D8" strokeWidth={3} dot={false} name="QEA (Quantum-Inspired)" />
                <Line type="monotone" dataKey="GA" stroke="#10B981" strokeWidth={2} dot={false} name="GA (Genetic Algorithm)" />
                <Line type="monotone" dataKey="SA" stroke="#F59E0B" strokeWidth={2} dot={false} name="SA (Simulated Annealing)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pareto Front (Cost vs Emissions) */}
        <div className="lg:col-span-4 card-maritime p-5 flex flex-col justify-between text-xs">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Non-Dominated Pareto Frontier</h2>
            <p className="text-slate-400 text-[11px] mb-3">
              Trade-off solutions where neither cost nor emissions can be improved without degrading the other.
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {data?.pareto_solutions.map((p, i) => (
                <div key={i} className="p-2.5 rounded bg-navy-950/70 border border-navy-750 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-cyan-brand font-mono text-[11px] block">{p.algorithm}</span>
                    <span className="text-slate-300">${(p.cost_usd / 1000).toFixed(1)}k Cost</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-glow font-bold block">{p.lifecycle_emissions_tco2.toFixed(1)} tCO2</span>
                    <span className="text-slate-400 text-[10px]">{p.fuel_tonnes.toFixed(1)} MT fuel</span>
                  </div>
                </div>
              ))}
              {(!data?.pareto_solutions || data.pareto_solutions.length === 0) && (
                <div className="text-slate-400 py-4 text-center">No Pareto solutions generated yet.</div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-navy-750 text-[11px] text-slate-400">
            QEA rotation gates guide chromosomes efficiently along the trade-off frontier.
          </div>
        </div>
      </div>

      {/* Comparative Metrics Table */}
      <div className="card-maritime p-5">
        <h2 className="text-sm font-bold text-white mb-3">Empirical Algorithm Performance Benchmark</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Best Objective</th>
                <th className="py-2.5 px-3">Mean ± Std</th>
                <th className="py-2.5 px-3">Best Cost</th>
                <th className="py-2.5 px-3">Best GHG</th>
                <th className="py-2.5 px-3">Best Fuel</th>
                <th className="py-2.5 px-3">Avg Runtime</th>
                <th className="py-2.5 px-3">Feasibility Rate</th>
                <th className="py-2.5 px-3">Evaluations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {data?.results.map((r) => (
                <tr key={r.algorithm} className="hover:bg-navy-800/40 transition">
                  <td className="py-2.5 px-3">
                    <Badge variant={r.algorithm === 'QEA' ? 'cyan' : r.algorithm === 'GA' ? 'emerald' : 'navy'}>
                      {r.algorithm}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{r.best_objective.toFixed(4)}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {r.mean_objective.toFixed(4)} ± {r.std_objective.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">${r.best_cost_usd.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-glow font-bold">{r.best_emissions_tco2.toLocaleString()} t</td>
                  <td className="py-2.5 px-3 font-mono text-ocean-400">{r.best_fuel_tonnes.toLocaleString()} MT</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{r.avg_runtime_ms.toFixed(1)} ms</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={r.feasibility_rate_pct === 100 ? 'emerald' : 'amber'}>
                      {r.feasibility_rate_pct}%
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{r.evaluations_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Scientific Recommendation */}
      {data?.recommendation && (
        <div className="card-maritime p-5 border-cyan-brand/20 text-xs">
          <h3 className="font-bold text-cyan-brand uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-glow" />
            <span>Benchmark Evaluation Conclusion</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">{data.recommendation}</p>
        </div>
      )}
    </div>
  );
};

