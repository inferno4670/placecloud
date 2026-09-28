import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { PlacementDrive, Application, StudentEligibilityDetail } from '../../types';
import { Badge } from '../../components/Badge';
import { format, parseISO } from 'date-fns';

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied', SHORTLISTED: 'Shortlisted', APTITUDE_TEST: 'Aptitude Test',
  GROUP_DISCUSSION: 'GD', TECHNICAL_INTERVIEW: 'Tech Interview',
  HR_INTERVIEW: 'HR Interview', SELECTED: 'Selected', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
  UNDER_REVIEW: 'Under Review', IN_PROCESS: 'In Process',
};

export const DriveDetails: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [tab, setTab] = useState<'applicants' | 'eligible'>('applicants');
  const [applications, setApplications] = useState<Application[]>([]);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => { if (driveId) fetchDriveData(); }, [driveId]);

  const fetchDriveData = async () => {
    setLoading(true);
    try {
      const [driveRes, appsRes] = await Promise.all([
        api.get(`/drives/${driveId}`),
        api.get(`/applications`, { params: { drive_id: driveId, limit: 200 } }),
      ]);
      setDrive(driveRes.data);
      setApplications(appsRes.data.items ?? appsRes.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const loadEligible = async () => {
    try {
      const res = await api.get(`/eligibility/drive/${driveId}`);
      setEligibilityResult(res.data);
    } catch { alert('Could not load eligibility data.'); }
  };

  useEffect(() => {
    if (tab === 'eligible' && !eligibilityResult) loadEligible();
  }, [tab]);

  const updateStage = async (appId: number, newStatus: string) => {
    setUpdatingId(appId);
    try {
      const res = await api.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: res.data.status } : a));
      if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, status: res.data.status } : prev);
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to update status.');
    } finally { setUpdatingId(null); }
  };

  const statusBadgeVariant = (s: string) => {
    if (s === 'SELECTED') return 'green' as const;
    if (s === 'REJECTED' || s === 'WITHDRAWN') return 'red' as const;
    if (s === 'APPLIED') return 'slate' as const;
    return 'blue' as const;
  };

  const allStatuses = ['APPLIED', 'SHORTLISTED', 'APTITUDE_TEST', 'GROUP_DISCUSSION', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'SELECTED', 'REJECTED'];
  const terminalStatuses = ['SELECTED', 'REJECTED', 'WITHDRAWN'];

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!drive) return <div className="p-8 text-center text-red-400">Drive not found.</div>;

  const eligible: StudentEligibilityDetail[] = eligibilityResult?.results?.filter((e: StudentEligibilityDetail) => e.is_eligible) ?? [];
  const ineligible: StudentEligibilityDetail[] = eligibilityResult?.results?.filter((e: StudentEligibilityDetail) => !e.is_eligible) ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/admin/drives')} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{drive.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-gray-500">{drive.company_name}</span>
            {drive.job_location && <span className="text-sm text-gray-500">• {drive.job_location}</span>}
            {drive.ctc_lpa > 0 && <span className="text-sm text-green-600 font-medium">₹{drive.ctc_lpa} LPA</span>}
            <Badge variant={drive.status === 'ACTIVE' ? 'green' : drive.status === 'UPCOMING' ? 'blue' : drive.status === 'COMPLETED' ? 'slate' : 'red'}>
              {drive.status}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-brand-600">{applications.length}</p>
          <p className="text-xs text-gray-500">Applications</p>
        </div>
      </div>

      {/* Eligibility summary */}
      {drive.eligibility_criteria && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">Eligibility Criteria</h3>
          <div className="flex flex-wrap gap-3 text-xs text-blue-700">
            {drive.eligibility_criteria.min_cgpa > 0 && (
              <span className="bg-blue-100 rounded-full px-2 py-1">CGPA ≥ {drive.eligibility_criteria.min_cgpa}</span>
            )}
            {drive.eligibility_criteria.max_active_backlogs != null && (
              <span className="bg-blue-100 rounded-full px-2 py-1">Active Backlogs ≤ {drive.eligibility_criteria.max_active_backlogs}</span>
            )}
            {drive.eligibility_criteria.min_attendance > 0 && (
              <span className="bg-blue-100 rounded-full px-2 py-1">Attendance ≥ {drive.eligibility_criteria.min_attendance}%</span>
            )}
            {drive.eligibility_criteria.allowed_departments?.length > 0 && (
              <span className="bg-blue-100 rounded-full px-2 py-1">
                Depts: {drive.eligibility_criteria.allowed_departments.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['applicants', 'eligible'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition capitalize ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'applicants' ? `Applicants (${applications.length})` : 'Eligibility Evaluation'}
          </button>
        ))}
      </div>

      {/* Applicants Tab */}
      {tab === 'applicants' && (
        <div className="flex gap-4">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Student</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Roll No</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Applied</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Move To</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No applications yet.</td></tr>
                )}
                {applications.map(app => (
                  <tr key={app.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedApp?.id === app.id ? 'bg-brand-50' : ''}`}
                    onClick={() => setSelectedApp(app)}
                  >
                    <td className="py-2 px-3 font-medium text-gray-900">{app.student_name ?? `Student #${app.student_id}`}</td>
                    <td className="py-2 px-3 text-gray-600">{app.enrollment_no ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-500">
                      {app.applied_at ? format(parseISO(app.applied_at), 'dd MMM') : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={statusBadgeVariant(app.status)}>{STATUS_LABELS[app.status] ?? app.status}</Badge>
                    </td>
                    <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                      {!terminalStatuses.includes(app.status) && (
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
                          value="" disabled={updatingId === app.id}
                          onChange={e => { if (e.target.value) updateStage(app.id, e.target.value); }}
                        >
                          <option value="">Move to…</option>
                          {allStatuses.filter(s => s !== app.status).map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedApp && (
            <div className="w-72 bg-white border border-gray-200 rounded-xl p-4 h-fit sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedApp.student_name ?? 'Student'}</h3>
              <p className="text-xs text-gray-500 mb-3">{selectedApp.enrollment_no}</p>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">CGPA</span>
                  <span className="font-medium">{selectedApp.cgpa ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dept</span>
                  <span className="font-medium">{selectedApp.department_code ?? '—'}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <Badge variant={statusBadgeVariant(selectedApp.status)} size="md">
                  {STATUS_LABELS[selectedApp.status]}
                </Badge>
                {!terminalStatuses.includes(selectedApp.status) && (
                  <div className="space-y-1 mt-3">
                    <button onClick={() => updateStage(selectedApp.id, 'SELECTED')} disabled={updatingId === selectedApp.id}
                      className="w-full py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60"
                    >✓ Mark Selected</button>
                    <button onClick={() => updateStage(selectedApp.id, 'REJECTED')} disabled={updatingId === selectedApp.id}
                      className="w-full py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-60"
                    >✗ Mark Rejected</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Eligibility Tab */}
      {tab === 'eligible' && (
        <div className="space-y-4">
          {eligibilityResult && (
            <div className="flex gap-3">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{eligible.length}</p>
                <p className="text-sm text-green-700">Eligible Students</p>
              </div>
              <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{ineligible.length}</p>
                <p className="text-sm text-red-600">Not Eligible</p>
              </div>
            </div>
          )}
          <table className="w-full text-sm bg-white rounded-xl border border-gray-200 overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Student</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Roll No</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Dept</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">CGPA</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {!eligibilityResult && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading eligibility data…</td></tr>
              )}
              {(eligibilityResult?.results ?? []).map((s: StudentEligibilityDetail) => (
                <tr key={s.student_id} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-medium text-gray-900">{s.student_name}</td>
                  <td className="py-2 px-3 text-gray-600">{s.enrollment_no}</td>
                  <td className="py-2 px-3 text-gray-600">{s.department_code}</td>
                  <td className="py-2 px-3">{s.cgpa}</td>
                  <td className="py-2 px-3">
                    {s.is_eligible
                      ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="w-4 h-4" /> Eligible</span>
                      : <span className="flex items-center gap-1 text-red-500 font-medium"><XCircle className="w-4 h-4" /> Not Eligible</span>
                    }
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500">{s.reasons.length ? s.reasons.join('; ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
