import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlacementDrive } from '../../types';
import { Badge } from '../../components/Badge';
import { EligibilityModal } from '../../components/EligibilityModal';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

export const DrivesList: React.FC = () => {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [workModeFilter, setWorkModeFilter] = useState('ALL');
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const fetchDrives = async () => {
    try {
      const res = await api.get('/drives');
      setDrives(res.data);
    } catch (err) {
      console.error('Error fetching drives:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleApply = async (driveId: number) => {
    setIsApplying(true);
    try {
      await api.post('/applications', { drive_id: driveId });
      await fetchDrives();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Application failed');
    } finally {
      setIsApplying(false);
    }
  };

  const filteredDrives = drives.filter((drive) => {
    const matchesSearch =
      drive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drive.company_name && drive.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (drive.description && drive.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEligibility = eligibleOnly ? drive.student_eligible === true : true;
    const matchesWorkMode =
      workModeFilter === 'ALL' ? true : drive.work_mode.toUpperCase() === workModeFilter;

    return matchesSearch && matchesEligibility && matchesWorkMode;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Placement Opportunities & Company Drives
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover campus recruitment drives with real-time automatic eligibility evaluation.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company, role, skills..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="ALL">All Work Modes</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={eligibleOnly}
              onChange={(e) => setEligibleOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Eligible Only</span>
          </label>
        </div>
      </div>

      {/* Drives Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-2 text-sm font-bold text-slate-800">No placement drives found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query or unchecking the "Eligible Only" filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrives.map((drive) => {
            const isEligible = drive.student_eligible;
            const hasApplied = drive.student_applied;

            return (
              <div
                key={drive.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700 border border-slate-200">
                      {drive.company_name?.charAt(0) || 'C'}
                    </div>
                    {isEligible ? (
                      <Badge variant="green">
                        <CheckCircle2 className="h-3 w-3" /> Eligible
                      </Badge>
                    ) : (
                      <Badge variant="red">
                        <XCircle className="h-3 w-3" /> Not Eligible
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 line-clamp-1">
                    {drive.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{drive.company_name}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">CTC Package</span>
                      <p className="font-bold text-slate-900 mt-0.5">₹{drive.ctc_lpa} LPA</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Work Mode</span>
                      <p className="font-bold text-slate-900 mt-0.5">{drive.work_mode}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{drive.job_location || 'Campus / Multiple Locations'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Deadline:{' '}
                        <strong className="text-slate-800">
                          {new Date(drive.application_deadline).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDrive(drive);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View Details
                  </button>

                  {hasApplied ? (
                    <span className="rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 border border-blue-200">
                      Applied ({drive.student_application_status || 'In Review'})
                    </span>
                  ) : isEligible ? (
                    <button
                      onClick={() => {
                        setSelectedDrive(drive);
                        setIsModalOpen(true);
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedDrive(drive);
                        setIsModalOpen(true);
                      }}
                      className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100"
                    >
                      Why Ineligible?
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Eligibility Modal */}
      <EligibilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        drive={selectedDrive}
        onApply={handleApply}
        isApplying={isApplying}
      />
    </div>
  );
};
