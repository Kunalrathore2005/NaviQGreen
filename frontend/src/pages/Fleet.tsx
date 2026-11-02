import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { Vessel } from '../types';

export const Fleet: React.FC = () => {
  const navigate = useNavigate();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Vessel>>({
    vessel_id: '',
    vessel_name: '',
    vessel_type: 'Container',
    deadweight_tonnage: 50000,
    cargo_capacity_tonnes: 45000,
    engine_power_kw: 25000,
    design_speed_knots: 19.0,
    minimum_speed_knots: 10.0,
    maximum_speed_knots: 23.0,
    compatible_fuels: ['VLSFO', 'MGO'],
    availability_status: 'AVAILABLE',
    daily_charter_cost_usd: 18000,
    crew_cost_per_day_usd: 4500,
    data_source: 'User Entry',
  });

  const loadVessels = async () => {
    setLoading(true);
    try {
      const data = await api.getVessels({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setVessels(data);
    } catch (e) {
      console.error('Failed to load fleet:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVessels();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVessels();
  };

  const handleDelete = async (vesselId: string) => {
    if (!window.confirm(`Are you sure you want to decommission and remove vessel ${vesselId}?`)) {
      return;
    }
    try {
      await api.deleteVessel(vesselId);
      loadVessels();
    } catch (e) {
      alert(`Error deleting vessel: ${e}`);
    }
  };

  const handleCreateVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVessel(formData);
      setShowAddModal(false);
      loadVessels();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating vessel');
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      const res = await api.importVesselsCsv(importFile);
      setImportResult(res);
      loadVessels();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'CSV Import failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-white">Fleet & Vessel Management</h1>
            <Badge variant="cyan">{vessels.length} Registered Vessels</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Configure vessel hydrodynamic specifications, speed envelopes, dual-fuel retrofits, and operational availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={api.getVesselsExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost-marine text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); }}
            className="btn-ghost-marine text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-cyan text-xs flex items-center gap-1.5 py-2 px-3.5 shadow-glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vessel</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card-maritime p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vessels by name or ID (e.g., Pacific Pioneer, VES-CNT-01)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-maritime pl-9 pr-4 py-2 text-xs w-full"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-maritime text-xs py-2"
          >
            <option value="">All Vessel Types</option>
            <option value="Container">Container</option>
            <option value="Bulk Carrier">Bulk Carrier</option>
            <option value="Oil Tanker">Oil Tanker</option>
            <option value="LNG Carrier">LNG Carrier</option>
            <option value="General Cargo">General Cargo</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-maritime text-xs py-2"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Vessels Table */}
      <div className="card-maritime overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-3 px-4">Vessel ID</th>
                <th className="py-3 px-4">Vessel Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Capacity (DWT)</th>
                <th className="py-3 px-4">Engine Power</th>
                <th className="py-3 px-4">Speed Envelope</th>
                <th className="py-3 px-4">Compatible Fuels</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {vessels.map((v) => (
                <tr key={v.vessel_id} className="hover:bg-navy-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-brand">
                    {v.vessel_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    <button
                      onClick={() => navigate(`/fleet/${v.vessel_id}`)}
                      className="hover:text-cyan-brand hover:underline flex items-center gap-1.5"
                    >
                      <span>{v.vessel_name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>
                  </td>
                  <td className="py-3 px-4">{v.vessel_type}</td>
                  <td className="py-3 px-4 font-mono">
                    {v.deadweight_tonnage.toLocaleString()} MT
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {v.engine_power_kw.toLocaleString()} kW
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {v.minimum_speed_knots} - {v.maximum_speed_knots} kts
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {v.compatible_fuels.map((fuel) => (
                        <span
                          key={fuel}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-navy-800 text-slate-300 border border-navy-700"
                        >
                          {fuel}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={v.availability_status === 'AVAILABLE' ? 'emerald' : 'amber'}>
                      {v.availability_status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/fleet/${v.vessel_id}`)}
                        className="p-1.5 rounded hover:bg-navy-800 text-slate-400 hover:text-cyan-brand"
                        title="View Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.vessel_id)}
                        className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                        title="Delete Vessel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vessels.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No vessels found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vessel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-maritime max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-brand" />
                <span>Register New Fleet Vessel</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVessel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vessel ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VES-NEW-01"
                    value={formData.vessel_id}
                    onChange={(e) => setFormData({ ...formData, vessel_id: e.target.value })}
                    className="input-maritime w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vessel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titan Navigator"
                    value={formData.vessel_name}
                    onChange={(e) => setFormData({ ...formData, vessel_name: e.target.value })}
                    className="input-maritime w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vessel Type *</label>
                  <select
                    value={formData.vessel_type}
                    onChange={(e) => setFormData({ ...formData, vessel_type: e.target.value })}
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
                  <label className="block text-slate-400 font-medium mb-1">Deadweight (DWT MT) *</label>
                  <input
                    type="number"
                    required
                    value={formData.deadweight_tonnage}
                    onChange={(e) => setFormData({ ...formData, deadweight_tonnage: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Engine Power (kW) *</label>
                  <input
                    type="number"
                    required
                    value={formData.engine_power_kw}
                    onChange={(e) => setFormData({ ...formData, engine_power_kw: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Min Speed (kts)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.minimum_speed_knots}
                    onChange={(e) => setFormData({ ...formData, minimum_speed_knots: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Design Speed (kts) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.design_speed_knots}
                    onChange={(e) => setFormData({ ...formData, design_speed_knots: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Max Speed (kts)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.maximum_speed_knots}
                    onChange={(e) => setFormData({ ...formData, maximum_speed_knots: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Daily Charter Cost ($)</label>
                  <input
                    type="number"
                    value={formData.daily_charter_cost_usd}
                    onChange={(e) => setFormData({ ...formData, daily_charter_cost_usd: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Daily Crew Cost ($)</label>
                  <input
                    type="number"
                    value={formData.crew_cost_per_day_usd}
                    onChange={(e) => setFormData({ ...formData, crew_cost_per_day_usd: parseFloat(e.target.value) })}
                    className="input-maritime w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Compatible Fuels</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['VLSFO', 'MGO', 'LNG', 'Methanol', 'Ammonia', 'Hydrogen'].map((fuel) => {
                    const checked = formData.compatible_fuels?.includes(fuel);
                    return (
                      <label key={fuel} className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const cur = formData.compatible_fuels || [];
                            const updated = e.target.checked ? [...cur, fuel] : cur.filter((x) => x !== fuel);
                            setFormData({ ...formData, compatible_fuels: updated });
                          }}
                          className="rounded border-navy-700 text-cyan-brand focus:ring-0"
                        />
                        <span>{fuel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost-marine py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan py-2 px-5">
                  Save Vessel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-maritime max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-brand" />
                <span>Bulk Import Fleet CSV</span>
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="input-maritime w-full file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-navy-800 file:text-cyan-brand file:font-semibold hover:file:bg-navy-700"
                />
              </div>

              {importResult && (
                <div className={`p-3 rounded-lg border ${importResult.success ? 'bg-emerald-leaf/10 border-emerald-leaf/30 text-emerald-glow' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {importResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>Import Summary: {importResult.created_count} vessels created</span>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-300 mt-2">
                      {importResult.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn-ghost-marine py-2 px-4"
                >
                  Close
                </button>
                <button type="submit" className="btn-cyan py-2 px-5">
                  Execute Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

