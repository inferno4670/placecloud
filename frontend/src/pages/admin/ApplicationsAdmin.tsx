import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { Application } from '../../types';
import { Badge } from '../../components/Badge';
import { format, parseISO } from 'date-fns';

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted',
  IN_PROCESS: 'In Process', SELECTED: 'Selected', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
};

const TERMINAL_STATUSES = ['SELECTED', 'REJECTED', 'WITHDRAWN'];

export const ApplicationsAdmin: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => { fetchApplications(); }, [page, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/applications', { params });
      const data = res.data;
      if (data.items !== undefined) { setApplications(data.items); setTotal(data.total ?? data.items.length); }
      else { setApplications(data); setTotal(data.length); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const updateStage = async (appId: number, newStatus: string) => {
    setUpdatingId(appId);
    try {
      const res = await api.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: res.data.status } : a));
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to update status.');
    } finally { setUpdatingId(null); }
  };

  const filtered = applications.filter(a => {
    const q = search.toLowerCase();
    return (a.student_name ?? '').toLowerCase().includes(q) || (a.drive_title ?? '').toLowerCase().includes(q);
  });

  const statusBadgeVariant = (s: string) => {
    if (s === 'SELECTED') return 'green' as const;
    if (s === 'REJECTED' || s === 'WITHDRAWN') return 'red' as const;
    if (s === 'APPLIED') return 'slate' as const;
    return 'blue' as const;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Manage student applications across all drives</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search by student or drive..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['ALL', ...Object.keys(STATUS_LABELS)].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >{s === 'ALL' ? 'All' : STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      {/* Status summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {Object.entries(STATUS_LABELS).map(([s, label]) => {
          const count = applications.filter(a => a.status === s).length;
          return (
            <div key={s} className="bg-white border border-gray-200 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Drive</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Applied</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Update Stage</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">No applications found.</td></tr>
            ) : filtered.map(app => (
              <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{app.student_name ?? `Student #${app.student_id}`}</p>
                  <p className="text-xs text-gray-500">{app.enrollment_no} • {app.department_code}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-800">{app.drive_title ?? `Drive #${app.drive_id}`}</p>
                  <p className="text-xs text-gray-500">{app.company_name}</p>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {app.applied_at ? format(parseISO(app.applied_at), 'dd MMM yyyy') : '—'}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadgeVariant(app.status)}>{STATUS_LABELS[app.status] ?? app.status}</Badge>
                </td>
                <td className="py-3 px-4">
                  {!TERMINAL_STATUSES.includes(app.status) && (
                    <select
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value="" disabled={updatingId === app.id}
                      onChange={e => { if (e.target.value) updateStage(app.id, e.target.value); }}
                    >
                      <option value="">Move to…</option>
                      {Object.entries(STATUS_LABELS).filter(([s]) => s !== app.status).map(([s, label]) => (
                        <option key={s} value={s}>{label}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
