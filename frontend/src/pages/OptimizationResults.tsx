import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu,
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  Ship,
  Clock,
  DollarSign,
  Fuel,
  Cloud,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { OptimizationResult } from '../types';

export const OptimizationResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      api.getOptimizationJobById(parseInt(id, 10))
        .then(setResult)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-brand text-sm">
        Retrieving Optimization Results...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card-maritime p-12 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Job Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">No optimization job found with ID #{id}.</p>
        <button onClick={() => navigate('/optimization')} className="btn-cyan text-xs">
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/optimization')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-brand transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Optimization Workspace</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">{result.job_name}</h1>
            <Badge variant={result.is_feasible ? 'emerald' : 'rose'}>
              {result.is_feasible ? 'FEASIBLE PLAN' : 'INFEASIBLE CONSTRAINTS'}
            </Badge>
            <Badge variant="cyan">{result.algorithm}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Job #{result.job_id} • Runtime: {result.runtime_ms.toFixed(1)} ms • {result.generations_run} Generations • Seed: {result.random_seed}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getOptimizationCsvUrl(result.job_id)}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost-marine text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-glow" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={async () => {
              const data = await api.getOptimizationJson(result.job_id);
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `naviqgreen_job_${result.job_id}.json`;
              a.click();
            }}
            className="btn-ghost-marine text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <FileCode className="w-4 h-4 text-cyan-brand" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Operating Cost"
          value={`$${result.total_cost_usd.toLocaleString()}`}
          subtitle="Bunker + Charter + Port Charges"
          icon={DollarSign}
          color="amber"
        />
        <MetricCard
          title="Total Fuel Consumed"
          value={result.total_fuel_tonnes.toLocaleString()}
          unit="MT"
          subtitle="Equivalent energy adjusted"
          icon={Fuel}
          color="ocean"
        />
        <MetricCard
          title="Lifecycle Emissions (WTW)"
          value={result.total_lifecycle_emissions_tco2eq.toLocaleString()}
          unit="tCO2eq"
          subtitle="Full supply chain accounting"
          icon={Cloud}
          color="emerald"
        />
        <MetricCard
          title="Cargo Demand Fulfilled"
          value={`${result.cargo_fulfillment_rate_pct}%`}
          subtitle={`${result.total_cargo_fulfilled_tonnes.toLocaleString()} / ${result.total_cargo_demanded_tonnes.toLocaleString()} MT`}
          icon={Ship}
          color="cyan"
          trend={`${result.fleet_capacity_utilization_pct}% Utilization`}
          trendType="positive"
        />
      </div>

      {/* Convergence Curve & Trade-offs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-maritime p-5">
          <h2 className="text-sm font-bold text-white flex items-center justify-between mb-4">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-brand" />
              <span>Algorithm Objective Convergence History</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-brand">
              Best Fitness: {result.convergence_history[result.convergence_history.length - 1]?.best_objective.toFixed(4)}
            </span>
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.convergence_history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" opacity={0.5} />
                <XAxis dataKey="generation" stroke="#94A3B8" fontSize={11} label={{ value: 'Generation', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#94A3B8" fontSize={11} label={{ value: 'Objective J', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B192C', borderColor: '#00B4D8', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="best_objective" stroke="#00B4D8" strokeWidth={2.5} dot={false} name="Best Objective" />
                <Line type="monotone" dataKey="avg_objective" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Population Mean" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainability & Constraints Check */}
        <div className="lg:col-span-4 card-maritime p-5 flex flex-col justify-between text-xs">
          <div>
            <h2 className="text-sm font-bold text-white mb-2">Solution Explainability</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Configured weights prioritized <strong className="text-cyan-brand">Cost ({result.weights_used.cost})</strong>,{' '}
              <strong className="text-ocean-400">Fuel ({result.weights_used.fuel})</strong>, and{' '}
              <strong className="text-emerald-glow">Emissions ({result.weights_used.emissions})</strong>.
            </p>

            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2">
              Feasibility & Constraints Audit
            </h3>
            {result.constraint_violations.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-leaf/10 border border-emerald-leaf/30 text-emerald-glow flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>All vessel capacities, delivery schedules, and speed envelopes were strictly satisfied.</span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Constraint Violations Detected:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {result.constraint_violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-navy-750 text-slate-400 text-[11px]">
            Quantum lookup rotation gates achieved local minimum breakout within {result.generations_run} iterations.
          </div>
        </div>
      </div>

      {/* Recommended Fleet Deployment Assignment Table */}
      <div className="card-maritime p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Ship className="w-4 h-4 text-cyan-brand" />
          <span>Optimal Vessel Voyage Deployment Matrix</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-2.5 px-3">Vessel</th>
                <th className="py-2.5 px-3">Route Corridor</th>
                <th className="py-2.5 px-3">Allocated Cargo</th>
                <th className="py-2.5 px-3">Cruising Speed</th>
                <th className="py-2.5 px-3">Chosen Fuel</th>
                <th className="py-2.5 px-3">Voyage Time</th>
                <th className="py-2.5 px-3">Margin</th>
                <th className="py-2.5 px-3">Fuel Consumed</th>
                <th className="py-2.5 px-3">Total Cost</th>
                <th className="py-2.5 px-3">WTW GHG</th>
                <th className="py-2.5 px-3">Shore Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {result.vessel_assignments.map((a, idx) => (
                <tr key={idx} className="hover:bg-navy-800/40 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{a.vessel_name}</div>
                    <div className="text-[10px] text-cyan-brand font-mono">{a.vessel_id}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{a.origin_port} → {a.destination_port}</div>
                    <div className="text-[10px] text-slate-400">{a.distance_nm.toLocaleString()} nm</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {a.allocated_cargo_tonnes.toLocaleString()} MT ({a.capacity_utilization_pct}%)
                  </td>
                  <td className="py-2.5 px-3 font-mono text-cyan-brand font-bold">
                    {a.chosen_speed_knots} kts
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="cyan">{a.chosen_fuel}</Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {a.voyage_duration_hours} h
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-glow">
                    +{a.arrival_margin_hours} h
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {a.fuel_consumption_tonnes} MT
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-white">
                    ${a.total_cost_usd.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-glow font-bold">
                    {a.lifecycle_emissions_tco2eq} tCO2
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={a.shore_power_applied ? 'emerald' : 'navy'}>
                      {a.shore_power_applied ? 'Active' : 'Off'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

