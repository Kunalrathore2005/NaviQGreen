import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MaritimeMap } from '../components/MaritimeMap';
import { ShippingCorridor, LiveVessel, GlobalPort, ECAZone } from '../types';
import {
  Globe,
  Ship,
  Zap,
  Gauge,
  Radio,
  Sliders,
  TrendingDown,
  Clock,
  ShieldCheck,
  Fuel,
  Compass,
} from 'lucide-react';

export const GeospatialMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [corridors, setCorridors] = useState<ShippingCorridor[]>([]);
  const [vessels, setVessels] = useState<LiveVessel[]>([]);
  const [ports, setPorts] = useState<GlobalPort[]>([]);
  const [ecas, setEcas] = useState<ECAZone[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedVessel, setSelectedVessel] = useState<LiveVessel | null>(null);

  // Slow-steaming simulation interactive slider
  const [simSpeed, setSimSpeed] = useState<number>(14.0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, corrRes, vesRes, portRes, ecaRes] = await Promise.all([
          api.getGeospatialSummary(),
          api.getShippingCorridors(),
          api.getLiveVessels(),
          api.getWorldPorts(),
          api.getECAZones(),
        ]);
        setSummary(sumRes);
        setCorridors(corrRes);
        setVessels(vesRes);
        setPorts(portRes);
        setEcas(ecaRes);
        if (vesRes.length > 0) {
          setSelectedVessel(vesRes[0]);
        }
      } catch (err) {
        console.error('Failed to load geospatial data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate live hydrodynamic slow steaming savings based on simSpeed
  // Base reference speed: 18 kts. Cubic law: P ∝ (v / v_ref)^3.15
  const baseSpeed = 18.0;
  const speedRatio = simSpeed / baseSpeed;
  const powerRatio = Math.pow(speedRatio, 3.15);
  const fuelBurnReductionPct = Math.max(0, Math.round((1 - powerRatio) * 100));
  const estimatedCo2SavedPerVoyage = Math.round((1 - powerRatio) * 2400); // Metric tonnes CO2
  const extraTransitDays = ((10500 / simSpeed - 10500 / baseSpeed) / 24).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-brand/10 border border-cyan-brand/30 text-cyan-brand">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Maritime GIS Digital Twin & Fleet Telemetry
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-brand/20 text-cyan-brand border border-cyan-brand/40">
              Live AIS Geofencing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global maritime shipping corridors, IMO Emission Control Areas (ECAs), shore-power electrification, and live vessel hydrodynamics.
          </p>
        </div>
      </div>

      {/* Top Telemetry KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="card-maritime p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Monitored Fleet</span>
            <Ship className="w-4 h-4 text-cyan-brand" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {summary?.total_monitored_vessels || vessels.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {((summary?.total_tracked_tonnage || 640000) / 1000).toFixed(0)}k DWT active capacity
          </div>
        </div>

        <div className="card-maritime p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Alternative Fuels</span>
            <Fuel className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">
            {summary?.clean_fuel_adoption_pct || 66.7}%
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">
            LNG, Bio-Methanol & Ammonia
          </div>
        </div>

        <div className="card-maritime p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">IMO ECA Geofences</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 mt-1">
            {ecas.length} Active
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            0.10% S & Tier III NOx regulated
          </div>
        </div>

        <div className="card-maritime p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Shore Power Active</span>
            <Zap className="w-4 h-4 text-emerald-glow" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {summary?.shore_power_cold_ironing_active || 1} Berth
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            0 kg/h auxiliary diesel burn
          </div>
        </div>

        <div className="card-maritime p-3.5 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Global Corridors</span>
            <Compass className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {corridors.length} Trunk
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Suez, Cape & Transatlantic
          </div>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live Global Marine Traffic & Digital Twin Canvas
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Projection: Web Mercator • Datum: WGS 84 • Tile Source: Esri Dark Canvas & Ocean Bathymetry (No Key Required)
          </span>
        </div>

        {loading ? (
          <div className="h-[620px] rounded-xl bg-navy-950 border border-navy-750 flex items-center justify-center text-slate-400 text-xs">
            Initializing Leaflet Geospatial View & Loading Corridors...
          </div>
        ) : (
          <MaritimeMap
            corridors={corridors}
            vessels={vessels}
            ports={ports}
            ecas={ecas}
            height="640px"
            selectedVesselId={selectedVessel?.id}
            onSelectVessel={(v) => setSelectedVessel(v)}
          />
        )}
      </div>

      {/* Interactive Slow-Steaming Hydrodynamics Simulator Banner */}
      <div className="card-maritime p-5 border-cyan-brand/30 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-brand" />
              <h3 className="text-sm font-bold text-white">
                Hydrodynamic Fleet Slow-Steaming Optimizer
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-brand/10 text-cyan-brand font-mono">
                Cubic Law: P ∝ v³.¹⁵
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Drag the cruise speed slider to simulate fleet-wide fuel reduction, schedule delay, and avoided Well-to-Wake CO₂e emissions on trunk corridors.
            </p>
          </div>

          {/* Speed Slider Control */}
          <div className="flex-1 max-w-sm">
            <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
              <span className="text-slate-400">Cruise Speed:</span>
              <span className="text-base font-bold text-cyan-brand">{simSpeed} knots</span>
            </div>
            <input
              type="range"
              min={10.0}
              max={22.0}
              step={0.5}
              value={simSpeed}
              onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-brand bg-navy-950 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10 kts (Ultra-Slow)</span>
              <span>16 kts (Eco)</span>
              <span>22 kts (Express)</span>
            </div>
          </div>

          {/* Live Calculated Trade-off Metrics */}
          <div className="grid grid-cols-3 gap-3 border-l border-navy-750 pl-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-400" /> Fuel Burn
              </span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {fuelBurnReductionPct > 0 ? `-${fuelBurnReductionPct}%` : `+${Math.abs(fuelBurnReductionPct)}%`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Schedule Delay
              </span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {parseFloat(extraTransitDays) > 0 ? `+${extraTransitDays} d` : `${extraTransitDays} d`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-brand" /> Avoided CO₂
              </span>
              <span className="text-base font-bold text-white font-mono">
                {estimatedCo2SavedPerVoyage > 0 ? `~${estimatedCo2SavedPerVoyage.toLocaleString()} MT` : '0 MT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Telemetry Quick-Focus Table */}
      <div className="card-maritime p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Ship className="w-4 h-4 text-cyan-brand" />
          <span>Active Vessel Digital Twin Registry</span>
          <span className="text-xs text-slate-500 font-normal">({vessels.length} vessels in transit)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-navy-750 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Vessel</th>
                <th className="py-2.5 px-3">Type & Capacity</th>
                <th className="py-2.5 px-3">Fuel Strategy</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Route Corridor</th>
                <th className="py-2.5 px-3">CII Grade</th>
                <th className="py-2.5 px-3">Shore Power</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60">
              {vessels.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVessel(v)}
                  className={`cursor-pointer transition hover:bg-navy-800/50 ${
                    selectedVessel?.id === v.id ? 'bg-navy-800/80 text-white' : 'text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        v.fuel_type === 'Green Ammonia'
                          ? 'bg-emerald-400 shadow-glow-emerald'
                          : v.fuel_type.includes('Methanol')
                          ? 'bg-emerald-400'
                          : v.fuel_type === 'LNG'
                          ? 'bg-cyan-brand shadow-glow-cyan'
                          : 'bg-amber-400'
                      }`}
                    />
                    {v.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {v.type} ({v.dwt.toLocaleString()} DWT)
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-emerald-400">{v.fuel_type}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="text-white font-bold">{v.speed_knots} kts</span>
                    <span className="text-slate-500 text-[10px] ml-1">/ {v.design_speed}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {v.origin} → {v.destination}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        v.cii_rating === 'A'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      Grade {v.cii_rating}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {v.shore_power_equipped ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                        <Zap className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVessel(v);
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-brand/10 hover:bg-cyan-brand/20 text-cyan-brand text-[11px] font-medium border border-cyan-brand/30"
                    >
                      Focus Map
                    </button>
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

