import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileCode,
  FileText,
  Ship,
  Cpu,
  Leaf,
  FlaskConical,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    api.getOptimizationJobs().then(setJobs).catch(console.error);
  }, []);

  const downloadDatasetCsv = (type: string) => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/vessels/export-csv/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Reports, Analytics & Data Exports</h1>
          <Badge variant="cyan">Standardized Maritime Deliverables</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Generate, audit, and export reproducible fleet plans, emissions accounting ledgers, and benchmark metrics in CSV and JSON formats.
        </p>
      </div>

      {/* Export Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Fleet Specification Export */}
        <div className="card-maritime p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-cyan-brand">
              <Ship className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Fleet Register Master Ledger</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete specifications of all registered vessels, engine ratings (kW), deadweight tonnage, design speeds, and dual-fuel compatibilities.
            </p>
          </div>
          <div className="pt-3 border-t border-navy-750">
            <a
              href={api.getVesselsExportUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn-cyan w-full text-xs py-2 text-center flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Fleet CSV</span>
            </a>
          </div>
        </div>

        {/* Alternative Fuel Decarbonization Ledger */}
        <div className="card-maritime p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-glow">
              <Leaf className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Decarbonization Pathways Audit</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Well-to-Wake vs Tank-to-Wake emission comparisons across slow steaming, LNG, e-Methanol, Ammonia, and Hydrogen scenarios.
            </p>
          </div>
          <div className="pt-3 border-t border-navy-750">
            <button
              onClick={async () => {
                const scenarios = await api.getScenarios();
                const blob = new Blob([JSON.stringify(scenarios, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'naviqgreen_decarbonization_scenarios.json';
                a.click();
              }}
              className="btn-emerald w-full text-xs py-2 text-center flex items-center justify-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export Scenarios JSON</span>
            </button>
          </div>
        </div>

        {/* Benchmark Results */}
        <div className="card-maritime p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <FlaskConical className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Quantum Benchmark Ledger</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empirical algorithmic comparison across QEA, GA, SA, and exact greedy baselines with Pareto frontiers and convergence curves.
            </p>
          </div>
          <div className="pt-3 border-t border-navy-750">
            <button
              onClick={async () => {
                const bm = await api.getDefaultBenchmark();
                const blob = new Blob([JSON.stringify(bm, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'naviqgreen_algorithm_benchmarks.json';
                a.click();
              }}
              className="btn-ghost-marine w-full text-xs py-2 text-center flex items-center justify-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export Benchmark JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Run Export Table */}
      <div className="card-maritime p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-4 h-4 text-cyan-brand" />
          <span>Export Stored Optimization Deployment Plans</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Feasibility</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Download Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-navy-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-brand">#{j.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{j.job_name}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="cyan">{j.algorithm}</Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={j.is_feasible ? 'emerald' : 'rose'}>
                      {j.is_feasible ? 'FEASIBLE' : 'INFEASIBLE'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {j.created_at ? new Date(j.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={api.getOptimizationCsvUrl(j.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost-marine py-1 px-2.5 text-[11px] flex items-center gap-1 font-semibold"
                      >
                        <Download className="w-3 h-3 text-emerald-glow" />
                        <span>CSV Plan</span>
                      </a>
                      <button
                        onClick={async () => {
                          const data = await api.getOptimizationJson(j.id);
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `naviqgreen_job_${j.id}.json`;
                          a.click();
                        }}
                        className="btn-ghost-marine py-1 px-2.5 text-[11px] flex items-center gap-1 font-semibold"
                      >
                        <FileCode className="w-3 h-3 text-cyan-brand" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No optimization records available for export.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

