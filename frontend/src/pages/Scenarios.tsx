import React, { useEffect, useState } from 'react';
import {
  Leaf,
  Sliders,
  Play,
  TrendingDown,
  DollarSign,
  Fuel,
  Cloud,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Badge } from '../components/Badge';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { ScenarioResponse } from '../types';

export const Scenarios: React.FC = () => {
  const [data, setData] = useState<ScenarioResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Custom Simulator state
  const [speedReduction, setSpeedReduction] = useState<number>(15);
  const [customFuel, setCustomFuel] = useState<string>('Methanol');
  const [shorePower, setShorePower] = useState<boolean>(true);
  const [priceMultiplier, setPriceMultiplier] = useState<number>(1.0);
  const [simulating, setSimulating] = useState<boolean>(false);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await api.getScenarios();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleSimulateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await api.simulateScenario({
        speed_reduction_pct: speedReduction,
        selected_fuel: customFuel,
        enable_shore_power: shorePower,
        custom_fuel_price_multiplier: priceMultiplier,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const chartData = data
    ? [
        {
          name: 'Baseline',
          cost: data.baseline.total_cost_usd,
          emissions: data.baseline.lifecycle_emissions_tco2eq,
          fuel: data.baseline.fuel_tonnes,
        },
        ...data.scenarios.map((s) => ({
          name: s.scenario_name.split(' ')[0],
          cost: s.total_cost_usd,
          emissions: s.lifecycle_emissions_tco2eq,
          fuel: s.fuel_tonnes,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Alternative Fuel Decarbonization Lab</h1>
          <Badge variant="emerald">Net Zero Maritime Modeling</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Compare lifecycle emission reductions, operational costs, and energy density requirements across conventional, transition, and zero-carbon fuel pathways.
        </p>
      </div>

      {/* Custom Scenario Interactive Simulator */}
      <div className="card-maritime p-5 border-cyan-brand/20">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-cyan-brand" />
          <span>Interactive Scenario Simulator Controls</span>
        </h2>

        <form onSubmit={handleSimulateCustom} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Speed Reduction (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={speedReduction}
                onChange={(e) => setSpeedReduction(parseInt(e.target.value))}
                className="w-full accent-cyan-brand"
              />
              <span className="font-mono text-cyan-brand font-bold w-10 text-right">{speedReduction}%</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Adoption Fuel Type</label>
            <select
              value={customFuel}
              onChange={(e) => setCustomFuel(e.target.value)}
              className="input-maritime w-full text-xs"
            >
              <option value="VLSFO">VLSFO</option>
              <option value="MGO">MGO</option>
              <option value="LNG">LNG Dual-Fuel</option>
              <option value="Methanol">Renewable e-Methanol</option>
              <option value="Ammonia">Green Ammonia</option>
              <option value="Hydrogen">Liquid Green Hydrogen</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Bunker Price Multiplier</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="font-mono text-amber-400 font-bold w-10 text-right">{priceMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 md:pt-0">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={shorePower}
                onChange={(e) => setShorePower(e.target.checked)}
                className="rounded border-navy-700 text-cyan-brand focus:ring-0"
              />
              <span>Shore Power</span>
            </label>
            <button
              type="submit"
              disabled={simulating}
              className="btn-cyan text-xs py-2 px-4 shadow-glow-cyan font-bold"
            >
              {simulating ? 'Simulating...' : 'Simulate'}
            </button>
          </div>
        </form>
      </div>

      {/* Decarbonization vs Cost Comparison Chart */}
      <div className="card-maritime p-5">
        <h2 className="text-sm font-bold text-white flex items-center justify-between mb-4">
          <span className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-glow" />
            <span>Well-to-Wake Emissions vs Total Voyage Cost by Scenario</span>
          </span>
          <span className="text-xs text-slate-400">Values in USD & tCO2eq</span>
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis yAxisId="left" stroke="#10B981" fontSize={11} tickFormatter={(v) => `${v} t`} />
              <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B192C', borderColor: '#00B4D8', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="emissions" fill="#10B981" name="Lifecycle Emissions (tCO2eq)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="cost" fill="#F59E0B" name="Total Operating Cost (USD)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparative Scenarios Table */}
      <div className="card-maritime p-5">
        <h2 className="text-sm font-bold text-white mb-3">Decarbonization Pathways Comparison Matrix</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Fuel Consumed</th>
                <th className="py-2.5 px-3">Lifecycle GHG</th>
                <th className="py-2.5 px-3">GHG vs Baseline</th>
                <th className="py-2.5 px-3">Total Cost</th>
                <th className="py-2.5 px-3">Cost vs Baseline</th>
                <th className="py-2.5 px-3">Avg Speed</th>
                <th className="py-2.5 px-3">Key Strategic Trade-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {data && [data.baseline, ...data.scenarios].map((s, idx) => (
                <tr key={idx} className="hover:bg-navy-800/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{s.scenario_name}</span>
                      {s.scenario_type === 'BASELINE' && <Badge variant="navy">Baseline</Badge>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{s.fuel_tonnes.toLocaleString()} MT</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-glow font-bold">
                    {s.lifecycle_emissions_tco2eq.toLocaleString()} tCO2
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={s.emissions_diff_pct_vs_baseline < 0 ? 'text-emerald-glow font-bold' : 'text-slate-400'}>
                      {s.emissions_diff_pct_vs_baseline > 0 ? `+${s.emissions_diff_pct_vs_baseline}%` : `${s.emissions_diff_pct_vs_baseline}%`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-white font-bold">
                    ${s.total_cost_usd.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={s.cost_diff_pct_vs_baseline > 0 ? 'text-amber-400' : 'text-emerald-glow'}>
                      {s.cost_diff_pct_vs_baseline > 0 ? `+${s.cost_diff_pct_vs_baseline}%` : `${s.cost_diff_pct_vs_baseline}%`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-cyan-brand">{s.avg_speed_knots} kts</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs">{s.key_tradeoff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Insights */}
      {data?.insights && (
        <div className="card-maritime p-5 space-y-2">
          <h3 className="text-xs font-bold text-cyan-brand uppercase tracking-wider">
            Operational Decarbonization Insights
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 leading-relaxed">
            {data.insights.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

