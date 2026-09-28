import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PlacementDrive, Application } from '../../types';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { EligibilityModal } from '../../components/EligibilityModal';
import {
  Briefcase,
  FileText,
  Award,
  Calendar,
  ArrowRight,
  Building2,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const profile = user?.student_profile;

  const fetchData = async () => {
    try {
      const [drivesRes, appsRes] = await Promise.all([
        api.get('/drives'),
        api.get('/applications'),
      ]);
      setDrives(drivesRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const eligibleDrives = drives.filter((d) => d.student_eligible);
  const appliedDriveIds = new Set(applications.map((a) => a.drive_id));
  const activeInterviews = applications.filter((a) =>
    ['TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'IN_PROCESS', 'ASSESSMENT'].includes(a.status)
  ).length;

  const handleOpenEligibility = (drive: PlacementDrive) => {
    setSelectedDrive(drive);
    setIsModalOpen(true);
  };

  const handleApply = async (driveId: number) => {
    try {
      await api.post('/applications', { drive_id: driveId });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Application submission failed');
    }
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!profile) return 50;
    let score = 40; // baseline for user account
    if (profile.cgpa > 0) score += 15;
    if (profile.skills) score += 15;
    if (profile.resume_url) score += 20;
    if (profile.phone) score += 10;
    return Math.min(100, score);
  };

  const completionPct = calculateCompletion();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Profile Completion Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Campus Placement Session 2025–2026</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              Roll No: <span className="font-semibold text-white">{profile?.enrollment_no}</span> • Dept: <span className="font-semibold text-white">{profile?.department_code}</span> • CGPA: <span className="font-semibold text-white">{profile?.cgpa?.toFixed(2)}</span>
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md min-w-[200px] border border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span>Profile Completion</span>
              <span>{completionPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {completionPct < 100 && (
              <Link
                to="/student/profile"
                className="mt-2 block text-right text-[11px] font-semibold text-blue-200 hover:text-white"
              >
                Complete profile & resume →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Eligible Drives"
          value={eligibleDrives.length}
          subtitle={`Out of ${drives.length} active opportunities`}
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Applications Sent"
          value={applications.length}
          subtitle="Submitted to company portals"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="In Process / Interviews"
          value={activeInterviews}
          subtitle="Active assessment stages"
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Placement Status"
          value={profile?.placement_status || 'UNPLACED'}
          subtitle={profile?.selected_company ? `@ ${profile.selected_company} (₹${profile.package_ctc} LPA)` : 'Ready for drives'}
          icon={Award}
          color={profile?.placement_status === 'PLACED' ? 'emerald' : 'amber'}
        />
      </div>

      {/* Recommended Eligible Placement Drives */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Placement Drives</h3>
            <p className="text-xs text-slate-500">Drives where you fulfill all eligibility criteria</p>
          </div>
          <Link
            to="/student/drives"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all drives ({drives.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.slice(0, 3).map((drive) => {
            const isEligible = drive.student_eligible;
            const hasApplied = appliedDriveIds.has(drive.id);

            return (
              <div
                key={drive.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100">
                      {drive.company_name?.charAt(0) || 'C'}
                    </div>
                    {isEligible ? (
                      <Badge variant="green" size="sm">
                        <CheckCircle2 className="h-3 w-3" /> Eligible
                      </Badge>
                    ) : (
                      <Badge variant="red" size="sm">
                        Not Eligible
                      </Badge>
                    )}
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-slate-900 line-clamp-1">
                    {drive.title}
                  </h4>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{drive.company_name}</p>

                  <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                    <span className="text-slate-500">Package</span>
                    <span className="font-bold text-slate-900">₹{drive.ctc_lpa} LPA</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500">Deadline</span>
                    <span className="font-medium text-slate-700">
                      {new Date(drive.application_deadline).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEligibility(drive)}
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Check Criteria
                  </button>
                  {hasApplied ? (
                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200/50">
                      Applied
                    </span>
                  ) : isEligible ? (
                    <button
                      onClick={() => handleOpenEligibility(drive)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Applications Feed */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Recent Applications</h3>
            <p className="text-xs text-slate-500">Track stage progress for your submitted applications</p>
          </div>
          <Link
            to="/student/applications"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage applications <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-slate-300" />
            <h4 className="mt-2 text-xs font-semibold text-slate-700">No applications submitted yet</h4>
            <p className="mt-1 text-xs text-slate-400">Browse available placement drives to start applying.</p>
            <Link
              to="/student/drives"
              className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Explore Placement Drives
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {applications.slice(0, 4).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                    {app.company_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{app.drive_title}</h4>
                    <p className="text-[11px] text-slate-500">{app.company_name} • ₹{app.ctc_lpa} LPA</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">{app.current_stage}</span>
                    <p className="text-[10px] text-slate-400">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      app.status === 'SELECTED'
                        ? 'green'
                        : app.status === 'REJECTED'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {app.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <EligibilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        drive={selectedDrive}
        onApply={handleApply}
      />
    </div>
  );
};
