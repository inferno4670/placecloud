import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Application } from '../../types';
import { Badge } from '../../components/Badge';
import { StatusStepper } from '../../components/StatusStepper';
import {
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  History,
  AlertTriangle
} from 'lucide-react';

export const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data);
      if (res.data.length > 0 && !selectedApp) {
        setSelectedApp(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (appId: number) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    try {
      await api.post(`/applications/${appId}/withdraw`);
      await fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Withdrawal failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          My Applications & Selection Tracking
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your application lifecycle, scheduled interview stages, and placement offer outcomes.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-2 text-sm font-bold text-slate-800">No applications submitted yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Apply to eligible company placement drives to start tracking your recruitment status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Master List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Applications ({applications.length})
            </h3>
            <div className="space-y-2.5">
              {applications.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white font-bold text-slate-800 border border-slate-200 shadow-sm">
                          {app.company_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {app.company_name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{app.drive_title}</p>
                        </div>
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

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      <span>Current Stage:</span>
                      <strong className="text-slate-800 font-semibold">{app.current_stage}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Application View */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-800 border border-slate-200">
                      {selectedApp.company_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedApp.drive_title}</h2>
                      <p className="text-xs font-medium text-slate-500">
                        {selectedApp.company_name} • ₹{selectedApp.ctc_lpa} LPA • {selectedApp.job_location || 'Campus'}
                      </p>
                    </div>
                  </div>

                  {selectedApp.status !== 'WITHDRAWN' && selectedApp.status !== 'SELECTED' && (
                    <button
                      onClick={() => handleWithdraw(selectedApp.id)}
                      className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>

                {/* Stepper Pipeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Recruitment Stage Pipeline
                  </h3>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <StatusStepper
                      stages={selectedApp.selection_stages || []}
                      currentStage={selectedApp.current_stage}
                      status={selectedApp.status}
                    />
                  </div>
                </div>

                {/* Timeline / History */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
                    <History className="h-4 w-4 text-blue-600" />
                    <span>Stage Status Log</span>
                  </div>

                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {selectedApp.history && selectedApp.history.length > 0 ? (
                      selectedApp.history.map((hist) => (
                        <div key={hist.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{hist.stage}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(hist.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {hist.notes && (
                            <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {hist.notes}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">
                            Updated by: <span className="font-semibold text-slate-600">{hist.updated_by_name}</span>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-xs text-slate-400">No stage history recorded</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
