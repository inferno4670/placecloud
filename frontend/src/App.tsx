import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth
import { Login } from './pages/auth/Login';

// Layout wrapper
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { DrivesList } from './pages/student/DrivesList';
import { MyApplications } from './pages/student/MyApplications';
import { StudentProfilePage } from './pages/student/StudentProfile';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentsManagement } from './pages/admin/StudentsManagement';
import { StudentImport } from './pages/admin/StudentImport';
import { CompaniesManagement } from './pages/admin/CompaniesManagement';
import { DriveManagement } from './pages/admin/DriveManagement';
import { DriveDetails } from './pages/admin/DriveDetails';
import { ApplicationsAdmin } from './pages/admin/ApplicationsAdmin';
import { PlacementResults } from './pages/admin/PlacementResults';
import { Analytics } from './pages/admin/Analytics';
import { AuditLogs } from './pages/admin/AuditLogs';

/** Shared sidebar+navbar shell rendered by nested routes via <Outlet /> */
function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading PlaceCloud…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={user.role === 'STUDENT' ? '/student/dashboard' : '/admin/dashboard'} replace />
            : <Login />
        }
      />

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<AppLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/drives" element={<DrivesList />} />
          <Route path="/student/applications" element={<MyApplications />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>
      </Route>

      {/* Admin / Staff routes */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO_ADMIN', 'PLACEMENT_COORDINATOR']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentsManagement />} />
          <Route path="/admin/students/import" element={<StudentImport />} />
          <Route path="/admin/companies" element={<CompaniesManagement />} />
          <Route path="/admin/drives" element={<DriveManagement />} />
          <Route path="/admin/drives/:driveId" element={<DriveDetails />} />
          <Route path="/admin/applications" element={<ApplicationsAdmin />} />
          <Route path="/admin/placements" element={<PlacementResults />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to={user.role === 'STUDENT' ? '/student/dashboard' : '/admin/dashboard'} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
