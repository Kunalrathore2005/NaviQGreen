import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Zap,
  Cloud,
  DollarSign,
  Fuel,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';

export const CostEmissions: React.FC = () => {
  const [fuelType, setFuelType] = useState<string>('VLSFO');
  const [fuelTonnes, setFuelTonnes] = useState<number>(100.0);
  const [berthHours, setBerthHours] = useState<number>(24.0);
  const [useShorePower, setUseShorePower] = useState<boolean>(true);
  const [portCode, setPortCode] = useState<string>('SGSIN');

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fuels, setFuels] = useState<any[]>([]);

  useEffect(() => {
    api.getFuelsCatalogue().then(setFuels).catch(console.error);
    calculate();
  }, []);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.calculateEmissions({
        fuel_type: fuelType,
        fuel_consumption_tonnes: fuelTonnes,
        berth_hours: berthHours,
        shore_power_used: useShorePower,
        port_code: portCode,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Fuel Cost & Lifecycle Emissions Calculator</h1>
          <Badge variant="emerald">IMO MEPC.308(73) & ISO 14040/44</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Unit-consistent accounting engine for marine bunker expenditure, direct Tank-to-Wake (TTW) combustion, Well-to-Wake (WTW) lifecycle emissions, and port shore power.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-5 card-maritime p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-brand" />
            <span>Calculation Parameters</span>
          </h2>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Marine Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="input-maritime w-full"
            >
              <option value="VLSFO">VLSFO (Very Low Sulphur Fuel Oil)</option>
              <option value="MGO">MGO (Marine Gas Oil)</option>
              <option value="LNG">LNG (Liquefied Natural Gas)</option>
              <option value="Methanol">Renewable e-Methanol</option>
              <option value="Ammonia">Green Ammonia</option>
              <option value="Hydrogen">Liquid Green Hydrogen</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Base Fuel Consumption (Metric Tonnes)</label>
            <input
              type="number"
              step="0.1"
              value={fuelTonnes}
              onChange={(e) => setFuelTonnes(parseFloat(e.target.value) || 0)}
              className="input-maritime w-full"
            />
          </div>

          <div className="pt-2 border-t border-navy-750">
            <span className="block text-[11px] font-semibold text-emerald-glow uppercase tracking-wider mb-2">
              Berth Cold Ironing / Shore Power
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Port Destination</label>
                <select
                  value={portCode}
                  onChange={(e) => setPortCode(e.target.value)}
                  className="input-maritime w-full"
                >
                  <option value="SGSIN">Singapore (SGSIN)</option>
                  <option value="NLRTM">Rotterdam (NLRTM)</option>
                  <option value="CNSHA">Shanghai (CNSHA)</option>
                  <option value="USLAX">Los Angeles (USLAX)</option>
                  <option value="INNSA">Nhava Sheva (INNSA)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Berth Dwell Hours</label>
                <input
                  type="number"
                  value={berthHours}
                  onChange={(e) => setBerthHours(parseFloat(e.target.value) || 0)}
                  className="input-maritime w-full"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-3 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={useShorePower}
                onChange={(e) => setUseShorePower(e.target.checked)}
                className="rounded border-navy-700 text-cyan-brand focus:ring-0"
              />
              <span className="font-semibold">Connect Shore Power at Berth (Cold Ironing)</span>
            </label>
          </div>

          <button
            onClick={calculate}
            disabled={loading}
            className="btn-cyan w-full py-2.5 text-xs font-bold mt-2"
          >
            {loading ? 'Evaluating Formulae...' : 'Calculate Costs & Emissions'}
          </button>
        </div>

        {/* Results Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard
                  title="Fuel Consumption"
                  value={result.fuel_consumption_tonnes.toLocaleString()}
                  unit="MT"
                  subtitle={`Bunker price: $${result.fuel_price_per_tonne_usd}/MT`}
                  icon={Fuel}
                  color="ocean"
                />
                <MetricCard
                  title="Total Voyage & Port Cost"
                  value={`$${result.total_voyage_and_port_cost_usd.toLocaleString()}`}
                  subtitle={`Fuel: $${result.fuel_cost_usd.toLocaleString()}`}
                  icon={DollarSign}
                  color="amber"
                />
                <MetricCard
                  title="Lifecycle GHG (WTW)"
                  value={result.total_lifecycle_emissions_tco2eq.toLocaleString()}
                  unit="tCO2eq"
                  subtitle={`Direct: ${result.total_direct_ghg_co2eq_tonnes} tCO2`}
                  icon={Cloud}
                  color="emerald"
                />
              </div>

              {/* Detailed Breakdown Card */}
              <div className="card-maritime p-5 space-y-3 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-navy-750 pb-2">
                  Emissions Factor & Component Decomposition
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400">Direct Tank-to-Wake (TTW) CO₂ Combustion</span>
                    <span className="font-mono text-white font-bold">{result.tank_to_wake_co2_tonnes} MT</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400">Methane Slip (CH₄) GWP100</span>
                    <span className="font-mono text-slate-300">{result.tank_to_wake_ch4_tonnes} MT (x28 GWP)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400">Nitrous Oxide (N₂O) GWP100</span>
                    <span className="font-mono text-slate-300">{result.tank_to_wake_n2o_tonnes} MT (x265 GWP)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400 font-semibold">Total Direct GHG (CO₂eq)</span>
                    <span className="font-mono text-cyan-brand font-bold">{result.total_direct_ghg_co2eq_tonnes} tCO2eq</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400">Well-to-Tank (Upstream Extraction/Production)</span>
                    <span className="font-mono text-slate-300">
                      {(result.well_to_wake_lifecycle_co2eq_tonnes - result.total_direct_ghg_co2eq_tonnes).toFixed(2)} tCO2eq
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400 font-semibold">Total Well-to-Wake Lifecycle GHG</span>
                    <span className="font-mono text-emerald-glow font-bold">{result.well_to_wake_lifecycle_co2eq_tonnes} tCO2eq</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Shore Power Electricity At Berth</span>
                    <span className="font-mono text-slate-300">
                      {result.shore_power_electricity_kwh.toLocaleString()} kWh (${result.shore_power_cost_usd})
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-navy-950/70 border border-navy-750 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Accounting Protocol: </span>
                  {result.accounting_standard}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

