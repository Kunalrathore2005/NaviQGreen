import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Ship,
  ArrowLeft,
  Fuel,
  Compass,
  Gauge,
  Calendar,
  DollarSign,
  ShieldAlert,
  Play,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { Vessel } from '../types';

export const VesselDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      api.getVesselById(id)
        .then(setVessel)
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-brand">
        Loading Vessel Profile...
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="card-maritime p-12 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Vessel Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">No vessel matching ID &apos;{id}&apos; was located in the registry.</p>
        <button onClick={() => navigate('/fleet')} className="btn-cyan text-xs">
          Return to Fleet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/fleet')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-brand transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Fleet Register</span>
      </button>

      {/* Header Profile */}
      <div className="card-maritime p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-brand/20 to-emerald-leaf/20 border border-cyan-brand/30 flex items-center justify-center text-cyan-brand shadow-glow-cyan">
            <Ship className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">{vessel.vessel_name}</h1>
              <Badge variant="cyan">{vessel.vessel_id}</Badge>
              <Badge variant={vessel.availability_status === 'AVAILABLE' ? 'emerald' : 'amber'}>
                {vessel.availability_status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {vessel.vessel_type} Class Vessel — Spec Provenance: {vessel.data_source}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/prediction', { state: { vessel } })}
          className="btn-cyan text-xs flex items-center gap-2 py-2.5 px-4"
        >
          <Gauge className="w-4 h-4" />
          <span>Simulate Fuel Prediction</span>
        </button>
      </div>

      {/* Technical Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Hydrodynamic Dimensions */}
        <div className="card-maritime p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-brand flex items-center gap-2 border-b border-navy-750 pb-2">
            <Compass className="w-4 h-4" />
            <span>Hydrodynamics & Dimensions</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Deadweight Tonnage (DWT)</span>
              <span className="font-mono font-semibold text-white">{vessel.deadweight_tonnage.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Payload Capacity</span>
              <span className="font-mono font-semibold text-white">{vessel.cargo_capacity_tonnes.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Length Overall (LOA)</span>
              <span className="font-mono text-slate-200">{vessel.length_m ? `${vessel.length_m} m` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Beam (Width)</span>
              <span className="font-mono text-slate-200">{vessel.beam_m ? `${vessel.beam_m} m` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Design Draft</span>
              <span className="font-mono text-slate-200">{vessel.draft_m ? `${vessel.draft_m} m` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Propulsion & Speeds */}
        <div className="card-maritime p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-glow flex items-center gap-2 border-b border-navy-750 pb-2">
            <Activity className="w-4 h-4" />
            <span>Propulsion & Speed Envelope</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Main Engine Power (MCR)</span>
              <span className="font-mono font-semibold text-white">{vessel.engine_power_kw.toLocaleString()} kW</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Design Cruising Speed</span>
              <span className="font-mono font-semibold text-emerald-glow">{vessel.design_speed_knots} knots</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Allowable Speed Window</span>
              <span className="font-mono text-slate-200">{vessel.minimum_speed_knots} – {vessel.maximum_speed_knots} knots</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Maintenance Status</span>
              <span className="text-slate-200 font-medium">{vessel.maintenance_status}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Engine Type</span>
              <span className="text-slate-200">2-Stroke Slow Speed Diesel</span>
            </div>
          </div>
        </div>

        {/* Commercial & Decarbonization */}
        <div className="card-maritime p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-navy-750 pb-2">
            <DollarSign className="w-4 h-4" />
            <span>Commercial & Fuel Compatibility</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Daily Charter Rate</span>
              <span className="font-mono font-semibold text-white">${vessel.daily_charter_cost_usd.toLocaleString()}/day</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-800">
              <span className="text-slate-400">Daily Crew Cost</span>
              <span className="font-mono font-semibold text-white">${vessel.crew_cost_per_day_usd.toLocaleString()}/day</span>
            </div>
            <div className="py-1">
              <span className="block text-slate-400 mb-1.5">Dual-Fuel / Alternative Compatibility:</span>
              <div className="flex flex-wrap gap-1.5">
                {vessel.compatible_fuels.map((f) => (
                  <Badge key={f} variant={f === 'VLSFO' ? 'navy' : 'cyan'}>
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Limitations */}
      <div className="card-maritime p-5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Operational Notes & Provenance</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {vessel.notes || 'Standard commercial vessel record imported from naval engineering register. Certified for international deep-sea cargo transport.'}
        </p>
      </div>
    </div>
  );
};

