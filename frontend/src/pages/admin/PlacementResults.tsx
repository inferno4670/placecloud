import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp, DollarSign, Award } from 'lucide-react';
import api from '../../services/api';
import { PlacementRecord } from '../../types';
import { Badge } from '../../components/Badge';
import { format, parseISO } from 'date-fns';

interface DriveOption { id: number; title: string; company_id: number; }
interface StudentOption { id: number; enrollment_no: string; full_name?: string; }

const emptyForm = {
  student_id: '', drive_id: '', company_id: '', ctc_lpa: '',
  offer_date: '', joining_date: '', offer_type: 'FULL_TIME',
};

export const PlacementResults: React.FC = () => {
  const [records, setRecords] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [drives, setDrives] = useState<DriveOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { fetchRecords(); fetchDrivesStudents(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/placements', { params: { limit: 200 } });
      setRecords(res.data.items ?? res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const fetchDrivesStudents = async () => {
    try {
      const [dRes, sRes] = await Promise.all([
        api.get('/drives', { params: { limit: 200 } }),
        api.get('/students', { params: { limit: 200 } }),
      ]);
      const drivesData = dRes.data.items ?? dRes.data;
      const studentsData = sRes.data.items ?? sRes.data;
      setDrives(drivesData.map((d: any) => ({ id: d.id, title: d.title, company_id: d.company_id })));
      setStudents(studentsData.map((s: any) => ({ id: s.id, enrollment_no: s.enrollment_no, full_name: s.full_name })));
    } catch { /* ignore */ }
  };

  const handleDriveChange = (driveId: string) => {
    const drive = drives.find(d => String(d.id) === driveId);
    setForm(f => ({ ...f, drive_id: driveId, company_id: drive ? String(drive.company_id) : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/placements', {
        student_id: Number(form.student_id),
        drive_id: Number(form.drive_id),
        company_id: Number(form.company_id),
        ctc_lpa: Number(form.ctc_lpa),
        job_title: 'Software Engineer',
        offer_date: form.offer_date || null,
        joining_date: form.joining_date || null,
        status: 'CONFIRMED',
      });
      setShowModal(false);
      setForm({ ...emptyForm });
      fetchRecords();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Failed to create placement record.');
    } finally { setSaving(false); }
  };

  const placed = records.length;
  const avgCtc = placed > 0 ? (records.reduce((s, r) => s + (r.ctc_lpa ?? 0), 0) / placed).toFixed(2) : '0';
  const maxCtc = placed > 0 ? Math.max(...records.map(r => r.ctc_lpa ?? 0)).toFixed(2) : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Results</h1>
          <p className="text-sm text-gray-500 mt-1">Record and track offer letters and joining details</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setForm({ ...emptyForm }); }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition text-sm"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Placed', value: String(placed), Icon: Award, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Average CTC', value: `₹${avgCtc} LPA`, Icon: DollarSign, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Highest CTC', value: `₹${maxCtc} LPA`, Icon: TrendingUp, bg: 'bg-brand-50', color: 'text-brand-600' },
        ].map(({ label, value, Icon, bg, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className={`p-3 ${bg} rounded-xl`}><Icon className={`w-6 h-6 ${color}`} /></div>
            <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Company</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">CTC (LPA)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Offer Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Joining</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No placement records yet.</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{r.student_name ?? `Student #${r.student_id}`}</p>
                  <p className="text-xs text-gray-500">{r.enrollment_no}</p>
                </td>
                <td className="py-3 px-4"><p className="text-gray-800">{r.company_name ?? `Company #${r.company_id}`}</p></td>
                <td className="py-3 px-4 font-semibold text-green-700">₹{r.ctc_lpa}</td>
                <td className="py-3 px-4"><Badge variant="green">{r.status}</Badge></td>
                <td className="py-3 px-4 text-gray-500">{r.offer_date ? format(parseISO(r.offer_date), 'dd MMM yyyy') : '—'}</td>
                <td className="py-3 px-4 text-gray-500">{r.joining_date ? format(parseISO(r.joining_date), 'dd MMM yyyy') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add Placement Record</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} required
                >
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name ?? s.enrollment_no} ({s.enrollment_no})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drive *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.drive_id} onChange={e => handleDriveChange(e.target.value)} required
                >
                  <option value="">Select drive</option>
                  {drives.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTC (LPA) *</label>
                  <input type="number" step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.ctc_lpa} onChange={e => setForm(f => ({ ...f, ctc_lpa: e.target.value }))}
                    required placeholder="e.g. 18.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.offer_type} onChange={e => setForm(f => ({ ...f, offer_type: e.target.value }))}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PPO">PPO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.offer_date} onChange={e => setForm(f => ({ ...f, offer_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
