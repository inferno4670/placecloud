import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Building2,
  Briefcase,
  FileText,
  Award,
  BarChart3,
  ShieldCheck,
  UserCircle,
  GraduationCap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isStudent, isStaff, isAdmin } = useAuth();

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/drives', label: 'Placement Drives', icon: Briefcase },
    { to: '/student/applications', label: 'My Applications', icon: FileText },
    { to: '/student/profile', label: 'Profile & Resume', icon: UserCircle },
  ];

  const staffLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Student Directory', icon: Users },
    { to: '/admin/import', label: 'Excel/CSV Import', icon: FileSpreadsheet },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/drives', label: 'Placement Drives', icon: Briefcase },
    { to: '/admin/applications', label: 'Applications', icon: FileText },
    { to: '/admin/placements', label: 'Placement Offers', icon: Award },
    { to: '/admin/analytics', label: 'Placement Analytics', icon: BarChart3 },
    ...(isAdmin ? [{ to: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldCheck }] : []),
  ];

  const links = isStudent ? studentLinks : staffLinks;

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200/80 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isStudent ? 'Student Portal' : 'Placement Cell'}
          </p>
          <nav className="mt-2 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Cloud Status Footer Widget */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>System Online</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Automated eligibility evaluator active.
        </p>
      </div>
    </aside>
  );
};
