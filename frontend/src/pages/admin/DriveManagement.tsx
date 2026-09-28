import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Eye, Trash2, Building2, Calendar, Users } from 'lucide-react';
import api from '../../services/api';
import { PlacementDrive, Company, Department } from '../../types';
import { Badge } from '../../components/Badge';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STAGE_OPTIONS = [
  'Resume Shortlist',
  'Aptitude Test',
  'Group Discussion',
  'Technical Interview',
  'HR Interview',
  'Offer',
];

const emptyForm = {
  title: '',
  company_id: '',
  description: '',
  job_role: '',
  job_location: '',
  ctc_lpa: '',
  application_deadline: '',
  drive_date: '',
  selection_stages: ['Resume Shortlist', 'HR Interview', 'Offer'] as string[],
  status: 'UPCOMING',
  // eligibility
  min_cgpa: '',
  max_active_backlogs: '',
  min_attendance: '',
  min_tenth_percentage: '',
  min_twelfth_percentage: '',
  allowed_departments: [] as string[],
  allowed_graduation_years: [] as number[],
  required_skills: '',
};

export const DriveManagement: React.FC = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editDrive, setEditDrive] = useState<PlacementDrive | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, cRes, deptRes] = await Promise.all([
        api.get('/drives'),
        api.get('/companies'),
        api.get('/students/departments'),
      ]);
      setDrives(dRes.data.items ?? dRes.data);
      setCompanies(cRes.data.items ?? cRes.data);
      setDepartments(deptRes.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditDrive(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (d: PlacementDrive) => {
    setEditDrive(d);
    const ec = d.eligibility_criteria;
    setForm({
      title: d.title,
      company_id: String(d.company_id),
      description: d.description ?? '',
      job_role: d.job_location ?? '',    // map from available fields
      job_location: d.job_location ?? '',
      ctc_lpa: d.ctc_lpa ? String(d.ctc_lpa) : '',
      application_deadline: d.application_deadline ? d.application_deadline.slice(0, 16) : '',
      drive_date: d.drive_date ? d.drive_date.slice(0, 10) : '',
      selection_stages: d.selection_stages ?? ['Offer'],
      status: d.status,
      min_cgpa: ec?.min_cgpa != null ? String(ec.min_cgpa) : '',
      max_active_backlogs: ec?.max_active_backlogs != null ? String(ec.max_active_backlogs) : '',
      min_attendance: ec?.min_attendance != null ? String(ec.min_attendance) : '',
      min_tenth_percentage: ec?.min_tenth_percentage != null ? String(ec.min_tenth_percentage) : '',
      min_twelfth_percentage: ec?.min_twelfth_percentage != null ? String(ec.min_twelfth_percentage) : '',
      allowed_departments: ec?.allowed_departments ?? [],
      allowed_graduation_years: ec?.allowed_graduation_years ?? [],
      required_skills: ec?.required_skills ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleStageToggle = (stage: string) =>
    setForm(f => ({
      ...f,
      selection_stages: f.selection_stages.includes(stage)
        ? f.selection_stages.filter(s => s !== stage)
        : [...f.selection_stages, stage],
    }));

  const handleDeptToggle = (dept: string) =>
    setForm(f => ({
      ...f,
      allowed_departments: f.allowed_departments.includes(dept)
        ? f.allowed_departments.filter(d => d !== dept)
        : [...f.allowed_departments, dept],
    }));

  const handleYearToggle = (year: number) =>
    setForm(f => ({
      ...f,
      allowed_graduation_years: f.allowed_graduation_years.includes(year)
        ? f.allowed_graduation_years.filter(y => y !== year)
        : [...f.allowed_graduation_years, year],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const skillsStr = form.required_skills.trim();
      const payload = {
        title: form.title,
        company_id: Number(form.company_id),
        description: form.description || null,
        job_location: form.job_location || null,
        ctc_lpa: form.ctc_lpa ? Number(form.ctc_lpa) : 0,
        application_deadline: form.application_deadline
          ? new Date(form.application_deadline).toISOString()
          : null,
        drive_date: form.drive_date || null,
        selection_stages: form.selection_stages,
        status: form.status,
        employment_type: 'FULL_TIME',
        work_mode: 'ON_SITE',
        vacancies: 0,
        eligibility_criteria: {
          min_cgpa: form.min_cgpa ? Number(form.min_cgpa) : 0,
          max_active_backlogs: form.max_active_backlogs !== '' ? Number(form.max_active_backlogs) : 0,
          max_history_backlogs: 0,
          min_attendance: form.min_attendance ? Number(form.min_attendance) : 0,
          min_tenth_percentage: form.min_tenth_percentage ? Number(form.min_tenth_percentage) : 0,
          min_twelfth_percentage: form.min_twelfth_percentage ? Number(form.min_twelfth_percentage) : 0,
          allowed_departments: form.allowed_departments,
          allowed_graduation_years: form.allowed_graduation_years,
          required_skills: skillsStr || undefined,
        },
      };
      if (editDrive) {
        await api.put(`/drives/${editDrive.id}`, payload);
      } else {
        await api.post('/drives', payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Failed to save drive.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this drive?')) return;
    try {
      await api.delete(`/drives/${id}`);
      setDrives(d => d.filter(x => x.id !== id));
    } catch { alert('Could not delete drive.'); }
  };

  const filtered = drives.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const gradYears = [2024, 2025, 2026, 2027];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Drives</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage recruitment drives</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" /> New Drive
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search drives..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading drives…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No drives found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{d.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" /> {d.company_name ?? `Company #${d.company_id}`}
                  </p>
                </div>
                <Badge variant={
                  d.status === 'ACTIVE' ? 'green' :
                  d.status === 'UPCOMING' ? 'blue' :
                  d.status === 'COMPLETED' ? 'slate' : 'red'
                }>{d.status}</Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                {d.job_location && <p><span className="font-medium">Location:</span> {d.job_location}</p>}
                {d.ctc_lpa > 0 && <p><span className="font-medium">CTC:</span> ₹{d.ctc_lpa} LPA</p>}
                {d.application_deadline && (
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Deadline: {format(parseISO(d.application_deadline), 'dd MMM yyyy')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  {d.total_applications ?? 0} applicants
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/drives/${d.id}`)}
                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    title="View Details"
                  ><Eye className="w-4 h-4" /></button>
                  <button
                    onClick={() => openEdit(d)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="Edit"
                  ><Edit className="w-4 h-4" /></button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  ><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">{editDrive ? 'Edit Drive' : 'Create New Drive'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Drive Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drive Title *</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      required placeholder="e.g. Google SWE Campus Drive 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} required
                    >
                      <option value="">Select company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      {['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Location</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.job_location} onChange={e => setForm(f => ({ ...f, job_location: e.target.value }))}
                      placeholder="e.g. Bangalore, India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTC (LPA)</label>
                    <input
                      type="number" step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.ctc_lpa} onChange={e => setForm(f => ({ ...f, ctc_lpa: e.target.value }))}
                      placeholder="e.g. 18.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.application_deadline} onChange={e => setForm(f => ({ ...f, application_deadline: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drive Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.drive_date} onChange={e => setForm(f => ({ ...f, drive_date: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Drive description, job description, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Selection Stages */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Selection Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {STAGE_OPTIONS.map(s => (
                    <button type="button" key={s} onClick={() => handleStageToggle(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        form.selection_stages.includes(s)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                      }`}
                    >{s}</button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Selected: {form.selection_stages.join(' → ')}</p>
              </div>

              {/* Eligibility Criteria */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Eligibility Criteria</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min CGPA</label>
                    <input type="number" step="0.01" min="0" max="10"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.min_cgpa} onChange={e => setForm(f => ({ ...f, min_cgpa: e.target.value }))}
                      placeholder="e.g. 7.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Backlogs</label>
                    <input type="number" min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.max_active_backlogs} onChange={e => setForm(f => ({ ...f, max_active_backlogs: e.target.value }))}
                      placeholder="e.g. 0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Attendance (%)</label>
                    <input type="number" step="0.1" min="0" max="100"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.min_attendance} onChange={e => setForm(f => ({ ...f, min_attendance: e.target.value }))}
                      placeholder="e.g. 75" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min 10th (%)</label>
                    <input type="number" step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.min_tenth_percentage} onChange={e => setForm(f => ({ ...f, min_tenth_percentage: e.target.value }))}
                      placeholder="e.g. 60" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min 12th (%)</label>
                    <input type="number" step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.min_twelfth_percentage} onChange={e => setForm(f => ({ ...f, min_twelfth_percentage: e.target.value }))}
                      placeholder="e.g. 60" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.required_skills} onChange={e => setForm(f => ({ ...f, required_skills: e.target.value }))}
                      placeholder="Python, SQL, React (comma-separated)" />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Departments <span className="text-gray-400 font-normal">(empty = all)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {departments.map(dept => (
                      <button type="button" key={dept.id} onClick={() => handleDeptToggle(dept.name)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          form.allowed_departments.includes(dept.name)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                        }`}
                      >{dept.name}</button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Graduation Years <span className="text-gray-400 font-normal">(empty = all)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {gradYears.map(y => (
                      <button type="button" key={y} onClick={() => handleYearToggle(y)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          form.allowed_graduation_years.includes(y)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                        }`}
                      >{y}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition"
                >Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-60"
                >{saving ? 'Saving…' : editDrive ? 'Update Drive' : 'Create Drive'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
