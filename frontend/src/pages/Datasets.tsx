import React, { useEffect, useState } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Table,
  Info,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { DatasetMetadata } from '../types';

export const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] = useState<any>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Preview modal
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Ingestion form
  const [category, setCategory] = useState<string>('USER_UPLOADED');
  const [dataSource, setDataSource] = useState<string>('Port Logistics Operational Logs');
  const [version, setVersion] = useState<string>('v1.0');

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setValidating(true);
    setValidationReport(null);
    try {
      const report = await api.validateDatasetFile(file);
      setValidationReport(report);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'File validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      await api.uploadDataset(selectedFile, category, dataSource, version);
      setSelectedFile(null);
      setValidationReport(null);
      loadDatasets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (id: number) => {
    setPreviewLoading(true);
    try {
      const data = await api.getDatasetPreview(id);
      setPreviewData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Dataset Management & Provenance</h1>
          <Badge variant="cyan">ISO 14044 Data Integrity</Badge>
        </div>
        <p className="text-sm text-slate-400">
          Upload, validate, and audit maritime operational telemetry, hydrodynamic logs, and environmental emission factors.
        </p>
      </div>

      {/* Upload & Ingestion Workspace */}
      <div className="card-maritime p-6 border-cyan-brand/20">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-cyan-brand" />
          <span>Ingest New Maritime Dataset</span>
        </h2>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dataset Classification *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-maritime w-full text-xs"
              >
                <option value="USER_UPLOADED">User Uploaded Telemetry</option>
                <option value="OBSERVED">Public / Observed (NOAA / Copernicus)</option>
                <option value="ENGINEERING_REFERENCE">Engineering Reference (IMO 4th GHG)</option>
                <option value="SYNTHETIC_DEMO">Physics-Informed Simulated Dataset</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data Provenance & Source *
              </label>
              <input
                type="text"
                required
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className="input-maritime w-full text-xs"
                placeholder="e.g. DNV Ship Energy Efficiency Management Plan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Version Tag
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="input-maritime w-full text-xs"
                placeholder="v1.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select CSV File *
            </label>
            <input
              type="file"
              accept=".csv"
              required
              onChange={handleFileChange}
              className="input-maritime w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-navy-800 file:text-cyan-brand file:font-semibold hover:file:bg-navy-700"
            />
          </div>

          {validating && (
            <p className="text-xs text-cyan-brand font-medium animate-pulse">
              Running automated type checking, outlier screening, and missing value checks...
            </p>
          )}

          {/* Real-time Validation Report */}
          {validationReport && (
            <div className={`p-4 rounded-lg border text-xs ${
              validationReport.validation_status === 'PASSED'
                ? 'bg-emerald-leaf/10 border-emerald-leaf/30 text-emerald-glow'
                : validationReport.validation_status === 'WARNING'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  {validationReport.validation_status === 'PASSED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-glow" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Automated Ingestion Pre-flight: {validationReport.validation_status}</span>
                </span>
                <span className="font-mono">
                  {validationReport.valid_rows} / {validationReport.total_rows} Valid Rows
                </span>
              </div>

              {validationReport.issues.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-slate-300 mb-3">
                  {validationReport.issues.map((iss: string, idx: number) => (
                    <li key={idx}>{iss}</li>
                  ))}
                </ul>
              )}

              {/* Data Preview Snapshot */}
              {validationReport.preview_rows.length > 0 && (
                <div className="mt-3 overflow-x-auto max-h-40 border border-navy-700 rounded bg-navy-950/80 p-2">
                  <p className="font-semibold text-slate-400 mb-1">Record Header Preview (Top 3 Rows):</p>
                  <table className="w-full text-[11px] text-left">
                    <thead className="text-slate-400">
                      <tr>
                        {Object.keys(validationReport.preview_rows[0]).slice(0, 7).map((k) => (
                          <th key={k} className="p-1">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800 text-slate-200">
                      {validationReport.preview_rows.slice(0, 3).map((r: any, i: number) => (
                        <tr key={i}>
                          {Object.values(r).slice(0, 7).map((val: any, j: number) => (
                            <td key={j} className="p-1 font-mono">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || uploading || validationReport?.validation_status === 'FAILED'}
              className="btn-cyan text-xs py-2 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? 'Ingesting Dataset...' : 'Commit Dataset to Registry'}
            </button>
          </div>
        </form>
      </div>

      {/* Available Datasets Registry */}
      <div className="card-maritime p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-cyan-brand" />
          <span>Active Ingestion Catalog</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850/80 text-slate-400 uppercase font-semibold tracking-wider border-b border-navy-750">
              <tr>
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Columns</th>
                <th className="py-3 px-4">Provenance</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {datasets.map((d) => (
                <tr key={d.id} className="hover:bg-navy-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-brand">{d.dataset_name}</td>
                  <td className="py-3 px-4">
                    <Badge variant={d.category === 'OBSERVED' ? 'emerald' : d.category === 'ENGINEERING_REFERENCE' ? 'cyan' : 'navy'}>
                      {d.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono">{d.row_count.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono">{d.column_count}</td>
                  <td className="py-3 px-4 text-slate-300">{d.data_source}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{d.version}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openPreview(d.id)}
                      className="text-xs text-cyan-brand hover:underline font-semibold"
                    >
                      Inspect Rows
                    </button>
                  </td>
                </tr>
              ))}
              {datasets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No custom datasets ingested yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-maritime max-w-4xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750 mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-cyan-brand" />
                  <span>{previewData.dataset_name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provenance: {previewData.data_source} ({previewData.total_rows} total rows)
                </p>
              </div>
              <button onClick={() => setPreviewData(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-navy-750 rounded-lg">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-navy-850 sticky top-0 text-slate-400 uppercase border-b border-navy-750">
                  <tr>
                    {previewData.columns.map((col: string) => (
                      <th key={col} className="py-2 px-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {previewData.rows.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-navy-800/50">
                      {previewData.columns.map((col: string) => (
                        <td key={col} className="py-1.5 px-3 font-mono">{String(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 flex justify-end">
              <button onClick={() => setPreviewData(null)} className="btn-ghost-marine py-1.5 px-4 text-xs">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

