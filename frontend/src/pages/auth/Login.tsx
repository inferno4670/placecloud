import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cloud, Lock, Mail, ArrowRight, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      if (!err.response) {
        setError(
          `Unable to connect to the backend server (${err.message || 'Network Error'}). Make sure your backend service is running and VITE_API_URL is configured.`
        );
      } else {
        setError(
          err.response?.data?.detail || 'Authentication failed. Please verify your credentials.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Form Section */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Place<span className="text-blue-600">Cloud</span>
              </span>
              <p className="text-[11px] font-medium text-slate-500">Placement Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your institutional email address and password to continue.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@placecloud.edu"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>One-Click Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('tpo@placecloud.edu', 'Tpo@123')}
                className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 text-left hover:bg-blue-100 transition-all"
              >
                <p className="font-bold text-blue-900">TPO Admin</p>
                <p className="text-[10px] text-blue-600">tpo@placecloud.edu</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('coordinator@placecloud.edu', 'Coord@123')}
                className="rounded-xl border border-purple-200 bg-purple-50/60 p-2.5 text-left hover:bg-purple-100 transition-all"
              >
                <p className="font-bold text-purple-900">Coordinator</p>
                <p className="text-[10px] text-purple-600">coordinator@placecloud.edu</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('student@placecloud.edu', 'Student@123')}
                className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-left hover:bg-emerald-100 transition-all"
              >
                <p className="font-bold text-emerald-900">Student (Placed)</p>
                <p className="text-[10px] text-emerald-600">student@placecloud.edu</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('priya.verma@placecloud.edu', 'Student@123')}
                className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-left hover:bg-amber-100 transition-all"
              >
                <p className="font-bold text-amber-900">Student (Applying)</p>
                <p className="text-[10px] text-amber-600">priya.verma@placecloud.edu</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Hero Section */}
      <div className="relative hidden w-0 flex-1 lg:block bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-12 text-white overflow-hidden flex flex-col justify-between">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <Shield className="h-3.5 w-3.5" />
            Institutional Cloud Placement Hub
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white leading-tight">
            Centralized Automation for Campus Recruitment & Placement Drives
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-lg">
            Say goodbye to fragmented spreadsheets, manual CGPA filtering, and disconnected emails. PlaceCloud automatically computes drive-wise student eligibility and streams real-time analytics.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Automated Eligibility Engine</h4>
            <p className="mt-1 text-[11px] text-slate-300">
              Evaluates CGPA, 10th/12th cutoffs, backlogs, and department criteria instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 text-blue-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Real-Time Analytics & Funnel</h4>
            <p className="mt-1 text-[11px] text-slate-300">
              Live department stats, company selection ratios, and salary distribution insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
