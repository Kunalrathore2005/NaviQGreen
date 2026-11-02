import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileCode,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [algoFilter, setAlgoFilter] = useState<string>('');

  useEffect(() => {
    api.getOptimizationJobs()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter((j) => {
    const matchSearch =
      !search ||
      j.job_name.toLowerCase().includes(search.toLowerCase()) ||
      String(j.id).includes(search);
    const matchAlgo = !algoFilter || j.algorithm === algoFilter;
    return matchSearch && matchAlgo;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Experiment & Optimization History</h1>
          <Badge variant="cyan">{jobs.length} Stored Executions</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Persistent audit trail of all fleet optimization runs, algorithm configurations, runtime benchmarks, and generated deployment plans.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card-maritime p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search experiments by job title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-maritime pl-9 pr-4 py-2 w-full text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={algoFilter}
            onChange={(e) => setAlgoFilter(e.target.value)}
            className="input-maritime text-xs py-2"
          >
            <option value="">All Solvers</option>
            <option value="QEA">QEA (Quantum-Inspired)</option>
            <option value="GA">GA (Genetic Algorithm)</option>
            <option value="SA">SA (Simulated Annealing)</option>
            <option value="EXACT_GREEDY">Exact Greedy</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card-maritime overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Solver</th>
                <th className="py-3 px-4">Status & Feasibility</th>
                <th className="py-3 px-4">Objective Score</th>
                <th className="py-3 px-4">Runtime</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {filteredJobs.map((j) => (
                <tr key={j.id} className="hover:bg-navy-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-brand">
                    #{j.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {j.job_name}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={j.algorithm === 'QEA' ? 'cyan' : j.algorithm === 'GA' ? 'emerald' : 'navy'}>
                      {j.algorithm}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={j.is_feasible ? 'emerald' : 'rose'}>
                      {j.is_feasible ? 'FEASIBLE' : 'INFEASIBLE'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {j.best_objective_value ? j.best_objective_value.toFixed(4) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {j.runtime_ms.toFixed(1)} ms
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {j.created_at ? new Date(j.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/results/${j.id}`)}
                        className="btn-ghost-marine py-1 px-2.5 text-[11px] flex items-center gap-1 font-semibold"
                      >
                        <span>View Plan</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <a
                        href={api.getOptimizationCsvUrl(j.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded hover:bg-navy-800 text-slate-400 hover:text-emerald-glow"
                        title="Download CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching optimization runs found.
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

