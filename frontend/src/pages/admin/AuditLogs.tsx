import React, { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import api from '../../services/api';
import { AuditLogItem } from '../../types';
import { format, parseISO } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN: 'text-brand-600 bg-brand-50',
  LOGOUT: 'text-gray-600 bg-gray-100',
  IMPORT: 'text-purple-600 bg-purple-50',
  EXPORT: 'text-yellow-600 bg-yellow-50',
};

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => { fetchLogs(); }, [page, actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (resourceFilter !== 'ALL') params.resource = resourceFilter;
      const res = await api.get('/audit-logs', { params });
      const data = res.data;
      if (data.items !== undefined) { setLogs(data.items); setTotal(data.total ?? data.items.length); }
      else { setLogs(data); setTotal(data.length); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (
      (l.user_email ?? '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q)
    );
  });

  const actions = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT'];
  const resources = ['ALL', 'student', 'drive', 'company', 'application', 'placement_record', 'user'];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-xl"><Shield className="w-5 h-5 text-gray-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500">Track all system activity and changes</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search by user, action, resource..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 self-center">Action:</span>
          {actions.map(a => (
            <button key={a} onClick={() => { setActionFilter(a); setPage(1); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                actionFilter === a ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >{a}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 self-center">Resource:</span>
          {resources.map(r => (
            <button key={r} onClick={() => { setResourceFilter(r); setPage(1); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition capitalize ${
                resourceFilter === r ? 'bg-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >{r}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600 w-44">Timestamp</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Resource</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Details</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No audit logs found.</td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-2.5 px-4 text-xs text-gray-500 whitespace-nowrap font-mono">
                  {log.timestamp ? format(parseISO(log.timestamp), 'dd MMM yy HH:mm:ss') : '—'}
                </td>
                <td className="py-2.5 px-4">
                  <p className="text-gray-800 text-xs">{log.user_email ?? `User #${log.user_id}`}</p>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] ?? 'text-gray-600 bg-gray-100'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-xs text-gray-700 capitalize">{log.resource}</span>
                  {log.resource_id && <span className="text-xs text-gray-400 ml-1">#{log.resource_id}</span>}
                </td>
                <td className="py-2.5 px-4 max-w-xs">
                  {log.details ? (
                    <p className="text-xs text-gray-500 truncate" title={log.details}>
                      {log.details.slice(0, 80)}{log.details.length > 80 && '…'}
                    </p>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-400 font-mono">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} entries</p>
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
