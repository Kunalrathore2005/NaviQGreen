import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  TrendingDown,
  DollarSign,
  Cloud,
  Fuel,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Globe,
  Atom,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { DashboardKPISummary } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardKPISummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardSummary();
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const PIE_COLORS = ['#00B4D8', '#0284C7', '#10B981', '#F59E0B', '#8B5CF6'];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-cyan-brand">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold text-slate-300">Synchronizing Fleet Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-white">Executive Fleet Intelligence</h1>
            <Badge variant="cyan">Real Backend Telemetry</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Real-time multi-objective fleet optimization, predictive fuel consumption, and lifecycle decarbonization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="btn-ghost-marine text-xs flex items-center gap-1.5 py-2 px-3"
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/optimization')}
            className="btn-cyan text-xs flex items-center gap-2 py-2 px-4 shadow-glow-cyan"
          >
            <Cpu className="w-4 h-4" />
            <span>New QEA Optimization</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Fleet Vessels"
          value={data?.total_vessels || 0}
          subtitle={`${data?.available_vessels || 0} Available for Deployment`}
          icon={Ship}
          color="cyan"
          trend="100% Operational"
          trendType="positive"
        />
        <MetricCard
          title="Monthly Fuel Demand"
          value={(data?.predicted_monthly_fuel_tonnes || 0).toLocaleString()}
          unit="MT"
          subtitle="Physics-informed predictive baseline"
          icon={Fuel}
          color="ocean"
          trend="-22% Slow Steaming"
          trendType="positive"
        />
        <MetricCard
          title="Estimated Monthly Cost"
          value={`$${((data?.estimated_monthly_cost_usd || 0) / 1000).toFixed(1)}k`}
          subtitle="Bunker + Daily Charter + Crew"
          icon={DollarSign}
          color="amber"
          trend={`Potential Save $${((data?.potential_savings_usd || 0) / 1000).toFixed(1)}k`}
          trendType="positive"
        />
        <MetricCard
          title="Lifecycle GHG Emissions"
          value={(data?.estimated_monthly_emissions_tco2 || 0).toLocaleString()}
          unit="tCO2eq"
          subtitle="Well-to-Wake (IMO 4th Study Standard)"
          icon={Cloud}
          color="emerald"
          trend={`-${data?.potential_emissions_reduction_pct || 0}% QEA Optimal`}
          trendType="positive"
        />
      </div>

      {/* Standout Resume Features Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feature 1: Global Maritime GIS Digital Twin */}
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 p-5 shadow-xl transition-all hover:border-cyan-400/50">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-brand shadow-glow-cyan">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Interactive Maritime GIS Twin</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                    LIVE AIS
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Global shipping corridors, IMO Tier III ECAs, cold-ironing shore power, & slow steaming simulator.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 border-y border-navy-750/70 text-xs">
            <div className="bg-navy-950/60 p-2 rounded border border-navy-750/50 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Corridors</span>
              <span className="font-bold text-cyan-brand font-mono text-sm">5 Global</span>
            </div>
            <div className="bg-navy-950/60 p-2 rounded border border-navy-750/50 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Live Vessels</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">8 Monitored</span>
            </div>
            <div className="bg-navy-950/60 p-2 rounded border border-navy-750/50 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ECA Zones</span>
              <span className="font-bold text-amber-300 font-mono text-sm">4 Geofenced</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Leaflet • CartoDB Dark Matter • Hydrodynamics
            </span>
            <button
              onClick={() => navigate('/geospatial')}
              className="text-xs font-semibold text-cyan-brand hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-sm"
            >
              <span>Launch GIS Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature 2: Quantum State & Q-Bit Rotation Visualizer */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 p-5 shadow-xl transition-all hover:border-emerald-400/50">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-glow shadow-glow-emerald">
                <Atom className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Quantum State & Q-Bit Lab</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    BLOCH SPHERE
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Interactive 2D Hilbert unit circle, Han & Kim rotation gates, collapse measurement, & entropy resets.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 border-y border-navy-750/70 text-xs">
            <div className="bg-navy-950/60 p-2 rounded border border-navy-750/50 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">State Vector</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">|ψ⟩ = α|0⟩+β|1⟩</span>
            </div>
            <div className="bg-navy-950/60 p-2 rounded border border-navy-750/50 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Unitary Gate</span>
              <span className="font-bold text-cyan-300 font-mono text-sm">U(Δθ) Matrix</span>
            </div>
            <div className="bg-navy-950/60 p-2 rounded border border-navy-750/50 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Catastrophe</span>
              <span className="font-bold text-violet-300 font-mono text-sm">H &lt; 0.15 Reset</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Han & Kim (2002) • Shannon Entropy • Monte Carlo
            </span>
            <button
              onClick={() => navigate('/quantum-lab')}
              className="text-xs font-semibold text-emerald-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm"
            >
              <span>Launch Quantum Lab</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speed vs Fuel Consumption Cubic Scaling Curve */}
        <div className="lg:col-span-2 card-maritime p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Hydrodynamic Fuel Consumption vs Speed Curve</span>
                <span className="text-[10px] text-cyan-brand bg-cyan-brand/10 px-2 py-0.5 rounded">Cubic Law: P ∝ v³·¹⁵</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated on 100k DWT vessel across a 3,000 nm maritime corridor.
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.speed_vs_consumption_curve || []}>
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00B4D8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" opacity={0.5} />
                <XAxis dataKey="speed_knots" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v} kts`} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v} MT`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#071220', borderColor: '#00B4D8', borderRadius: '8px', fontSize: '12px', color: '#F8FAFC', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
                  itemStyle={{ color: '#F8FAFC' }}
                  labelStyle={{ color: '#00B4D8', fontWeight: 600 }}
                  formatter={(val: any, name: any) => [
                    `${val} ${name === 'consumption_tonnes' ? 'Metric Tonnes' : 'Hours'}`,
                    name === 'consumption_tonnes' ? 'Fuel Consumed' : 'Voyage Duration'
                  ]}
                />
                <Area type="monotone" dataKey="consumption_tonnes" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#cyanGradient)" name="consumption_tonnes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bunker & Alternative Fuel Portfolio */}
        <div className="card-maritime p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Fuel Mix & Pricing Portfolio</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current bunker pricing & lifecycle emission ratings.
            </p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.fuel_distribution || []}
                  dataKey="share_pct"
                  nameKey="fuel"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(data?.fuel_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const color = payload[0].color || '#00B4D8';
                      return (
                        <div className="bg-[#071220] border border-cyan-brand/60 rounded-lg p-2.5 shadow-2xl text-xs z-50">
                          <div className="font-bold text-white flex items-center gap-1.5 mb-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                            <span className="text-cyan-brand">{item.fuel}</span>
                            <span className="text-white font-mono ml-auto font-bold">{item.share_pct}%</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-300">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-400">Bunker Price:</span>
                              <span className="font-semibold text-emerald-400 font-mono">${item.cost_per_tonne}/MT</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-400">WTW Rating:</span>
                              <span className="font-semibold text-amber-300 font-mono">{item.lifecycle_factor} tCO₂/t</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-navy-750 text-[11px]">
            {(data?.fuel_distribution || []).slice(0, 4).map((f, i) => (
              <div key={f.fuel} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-300 font-medium truncate">{f.fuel}</span>
                <span className="text-slate-400 ml-auto font-mono">${f.cost_per_tonne}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Optimization Experiments Table */}
      <div className="card-maritime p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Recent Fleet Optimization Jobs</span>
              <span className="text-xs text-slate-400 font-normal">({data?.recent_jobs.length || 0} executed)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated with Quantum-Inspired Evolutionary Algorithm (QEA) and baselines.
            </p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-cyan-brand hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {data?.recent_jobs && data.recent_jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
                <tr>
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Job Name</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Feasibility</th>
                  <th className="py-2.5 px-3">Objective Score</th>
                  <th className="py-2.5 px-3">Runtime</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {data.recent_jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-navy-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-cyan-brand font-semibold">#{job.id}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{job.job_name}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={job.algorithm === 'QEA' ? 'cyan' : 'navy'}>
                        {job.algorithm}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={job.is_feasible ? 'emerald' : 'rose'}>
                        {job.is_feasible ? 'FEASIBLE' : 'INFEASIBLE'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{job.objective_value ? job.objective_value.toFixed(4) : '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{job.runtime_ms.toFixed(1)} ms</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => navigate(`/results/${job.id}`)}
                        className="text-xs text-cyan-brand hover:text-cyan-200 font-semibold underline"
                      >
                        Inspect Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No optimization jobs executed yet. Click &quot;Launch Optimization&quot; above to run your first fleet plan.
          </div>
        )}
      </div>
    </div>
  );
};

