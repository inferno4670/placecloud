import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { OverviewStats, DepartmentPlacementStat, CompanyRecruitmentStat } from '../../types';
import { StatCard } from '../../components/StatCard';
import {
  Users,
  Building2,
  Briefcase,
  Award,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [deptStats, setDeptStats] = useState<DepartmentPlacementStat[]>([]);
  const [compStats, setCompStats] = useState<CompanyRecruitmentStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, deptRes, compRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/departments'),
        api.get('/analytics/companies'),
      ]);
      setStats(overviewRes.data);
      setDeptStats(deptRes.data);
      setCompStats(compRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Format data for Recharts
  const deptChartData = deptStats.map((d) => ({
    name: d.department_code,
    Total: d.total_students,
    Placed: d.placed_students,
    Rate: d.placement_rate,
    AvgCTC: d.average_ctc,
  }));

  const compChartData = compStats.map((c) => ({
    name: c.company_name,
    Applicants: c.total_applications,
    Selected: c.selected_count,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>TPO Central Control & Recruitment Intelligence</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Institutional Placement Command Center
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time tracking of candidate eligibility, company drives, applications, and verified offers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/import"
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur border border-white/15 transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
            <span>Import Students</span>
          </Link>

          <Link
            to="/admin/drives"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Drive</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Placement Rate"
          value={`${stats.placement_rate}%`}
          subtitle={`${stats.placed_students} of ${stats.total_students} students placed`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Average CTC Package"
          value={`₹${stats.average_ctc} LPA`}
          subtitle={`Highest Offer: ₹${stats.highest_ctc} LPA`}
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Active Placement Drives"
          value={stats.active_drives}
          subtitle={`${stats.total_companies} partner companies onboarded`}
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          title="Total Applications"
          value={stats.total_applications}
          subtitle={`${stats.total_offers} total offer letters issued`}
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Placement Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department-wise Placement Performance
              </h3>
              <p className="text-xs text-slate-500">Total vs Placed students by academic department</p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Placed" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Hiring Funnel */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Company Applicants & Selections</h3>
              <p className="text-xs text-slate-500">Applicant volumes vs final candidate selections</p>
            </div>
            <Link
              to="/admin/companies"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage Companies <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Applicants" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Selected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table of Department Rates */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Department Placement Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Department</th>
                <th className="p-3">Total Students</th>
                <th className="p-3">Placed Students</th>
                <th className="p-3">Placement %</th>
                <th className="p-3">Average CTC</th>
                <th className="p-3">Highest CTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {deptStats.map((d) => (
                <tr key={d.department_code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    {d.department_name} ({d.department_code})
                  </td>
                  <td className="p-3">{d.total_students}</td>
                  <td className="p-3 text-emerald-700 font-bold">{d.placed_students}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      {d.placement_rate}%
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">₹{d.average_ctc} LPA</td>
                  <td className="p-3 font-semibold text-blue-700">₹{d.highest_ctc} LPA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
