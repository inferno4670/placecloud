import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import api from '../../services/api';
import { OverviewStats, DepartmentPlacementStat, CompanyRecruitmentStat, AcademicCorrelationStat } from '../../types';
import { TrendingUp, Users, Award, Building2 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [deptStats, setDeptStats] = useState<DepartmentPlacementStat[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyRecruitmentStat[]>([]);
  const [academicStats, setAcademicStats] = useState<AcademicCorrelationStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [ovRes, deptRes, compRes, acadRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/departments'),
          api.get('/analytics/companies'),
          api.get('/analytics/academic-correlation'),
        ]);
        setOverview(ovRes.data);
        setDeptStats(deptRes.data);
        setCompanyStats(compRes.data);
        setAcademicStats(acadRes.data);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics…</div>;

  const placementRateData = deptStats.map(d => ({
    dept: d.department_code,
    'Placement Rate': Math.round(d.placement_rate ?? 0),
    'Avg CTC': d.average_ctc ?? 0,
    Placed: d.placed_students,
    Total: d.total_students,
  }));

  const companyData = companyStats.slice(0, 8).map(c => ({
    company: c.company_name.length > 10 ? c.company_name.slice(0, 10) + '…' : c.company_name,
    Applications: c.total_applications,
    Selected: c.selected_count,
  }));

  const pieData = deptStats.map((d, i) => ({
    name: d.department_code,
    value: d.placed_students,
    fill: COLORS[i % COLORS.length],
  }));

  const cgpaData = academicStats.map(a => ({
    range: a.category,
    'Placement Rate': Math.round(a.placement_rate ?? 0),
    Placed: a.placed_students,
    Total: a.total_students,
  }));

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Placement Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Comprehensive placement performance insights</p>
      </div>

      {/* KPI Overview */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: String(overview.total_students), Icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Placed Students', value: String(overview.placed_students), Icon: Award, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Placement Rate', value: `${overview.placement_rate?.toFixed(1)}%`, Icon: TrendingUp, bg: 'bg-brand-50', color: 'text-brand-600' },
            { label: 'Avg CTC', value: `₹${overview.average_ctc?.toFixed(2)} LPA`, Icon: Building2, bg: 'bg-purple-50', color: 'text-purple-600' },
          ].map(({ label, value, Icon, bg, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Dept Placement Rate + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Placement Rate by Department (%)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={placementRateData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Bar dataKey="Placement Rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Placed Students by Department</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`} labelLine
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Company Funnel + Avg CTC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Company Recruitment Funnel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={companyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="company" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Selected" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Average CTC by Department (LPA)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={placementRateData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `₹${v} LPA`} />
              <Bar dataKey="Avg CTC" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CGPA vs Placement Rate */}
      {cgpaData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">CGPA Range vs Placement Rate</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cgpaData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Line type="monotone" dataKey="Placement Rate" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Department Summary Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Department-wise Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-4 font-medium text-gray-600">Department</th>
              <th className="text-right py-2 px-4 font-medium text-gray-600">Total</th>
              <th className="text-right py-2 px-4 font-medium text-gray-600">Placed</th>
              <th className="text-right py-2 px-4 font-medium text-gray-600">Rate</th>
              <th className="text-right py-2 px-4 font-medium text-gray-600">Avg CTC</th>
              <th className="text-right py-2 px-4 font-medium text-gray-600">Highest CTC</th>
            </tr>
          </thead>
          <tbody>
            {deptStats.map(d => (
              <tr key={d.department_code} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-4 font-medium text-gray-800">{d.department_name} <span className="text-gray-400 text-xs">({d.department_code})</span></td>
                <td className="py-2 px-4 text-right text-gray-600">{d.total_students}</td>
                <td className="py-2 px-4 text-right text-gray-600">{d.placed_students}</td>
                <td className="py-2 px-4 text-right">
                  <span className={`font-semibold ${d.placement_rate >= 70 ? 'text-green-600' : d.placement_rate >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {d.placement_rate?.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2 px-4 text-right text-gray-700 font-medium">{d.average_ctc ? `₹${d.average_ctc.toFixed(2)}` : '—'}</td>
                <td className="py-2 px-4 text-right text-gray-700">{d.highest_ctc ? `₹${d.highest_ctc.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
