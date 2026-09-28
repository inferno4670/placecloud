import React, { useState } from 'react';
import api from '../../services/api';
import { ImportPreviewReport, ImportResultSummary } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const StudentImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportPreviewReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSummary, setCommitSummary] = useState<ImportResultSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    window.open('/api/v1/students-import/template', '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setReport(null);
      setCommitSummary(null);
      setErrorMsg(null);
    }
  };

  const handleUploadPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setCommitSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/students-import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse and validate file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!report || !report.preview_records) return;

    setIsCommitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/students-import/commit', {
        records: report.preview_records,
        update_existing: true,
      });
      setCommitSummary(res.data);
      setReport(null);
      setFile(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to commit records to database');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Batch Student Onboarding & Excel Import
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload institutional Excel (.xlsx) or CSV files with automated schema validation and duplicate detection.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <Download className="h-4 w-4 text-blue-600" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Commit Result Success Banner */}
      {commitSummary && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-900 space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-emerald-800">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span>Batch Import Committed Successfully!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-white/70 p-3 border border-emerald-200/60">
              <span className="text-emerald-700">Total Processed</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{commitSummary.total_records}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 border border-emerald-200/60">
              <span className="text-emerald-700">New Accounts Created</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{commitSummary.successfully_imported}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 border border-emerald-200/60">
              <span className="text-emerald-700">Profiles Updated</span>
              <p className="text-lg font-bold text-blue-700 mt-0.5">{commitSummary.successfully_updated}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 border border-emerald-200/60">
              <span className="text-emerald-700">Failed Records</span>
              <p className="text-lg font-bold text-slate-500 mt-0.5">{commitSummary.failed_records}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Box */}
      {!report && !commitSummary && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <form onSubmit={handleUploadPreview} className="max-w-xl mx-auto space-y-4 text-center">
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-10 hover:border-blue-500 cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {file ? file.name : 'Select or Drag & Drop Excel / CSV'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports .xlsx, .xls, and .csv formats
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {isUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Upload & Validate Records</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Validation Report & Preview */}
      {report && (
        <div className="space-y-6">
          {/* Report KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Rows</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{report.total_records}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <span className="text-xs font-bold text-emerald-700 uppercase">Valid Records</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{report.valid_records_count}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <span className="text-xs font-bold text-amber-700 uppercase">Duplicates</span>
              <p className="text-2xl font-bold text-amber-800 mt-1">{report.duplicate_records_count}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <span className="text-xs font-bold text-rose-700 uppercase">Errors Detected</span>
              <p className="text-2xl font-bold text-rose-800 mt-1">{report.invalid_records_count}</p>
            </div>
          </div>

          {/* Error Details Accordion */}
          {report.errors.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Validation Failure Log ({report.errors.length} issue(s))</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-rose-100 text-xs text-rose-700">
                {report.errors.map((err, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <span>
                      Row {err.row}: <strong className="text-rose-900">{err.message}</strong>
                    </span>
                    {err.value && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-mono">
                        {String(err.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Parsed Data Preview (First 50 Rows)
              </h3>
              <span className="text-xs text-slate-500">
                Only valid rows will be committed to the database
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Row</th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Dept</th>
                    <th className="p-3">CGPA</th>
                    <th className="p-3">10th / 12th %</th>
                    <th className="p-3">Backlogs</th>
                    <th className="p-3">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {report.preview_records.map((r, i) => (
                    <tr key={i} className={r.is_valid ? 'hover:bg-slate-50' : 'bg-rose-50/30'}>
                      <td className="p-3 text-slate-400 font-mono text-[10px]">{r.row_number}</td>
                      <td className="p-3 font-bold text-slate-900">{r.enrollment_no}</td>
                      <td className="p-3 font-semibold text-slate-900">{r.full_name}</td>
                      <td className="p-3 text-slate-500">{r.email}</td>
                      <td className="p-3">{r.department}</td>
                      <td className="p-3 font-bold text-blue-700">{r.cgpa?.toFixed(2)}</td>
                      <td className="p-3">{r.tenth_percentage}% / {r.twelfth_percentage}%</td>
                      <td className="p-3">{r.active_backlogs}</td>
                      <td className="p-3">
                        {r.is_valid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3" /> Errors
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <button
              onClick={() => {
                setReport(null);
                setFile(null);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel & Upload Different File
            </button>

            <button
              onClick={handleCommit}
              disabled={isCommitting || report.valid_records_count === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Committing {report.valid_records_count} Records...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  <span>Commit {report.valid_records_count} Valid Records to Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
