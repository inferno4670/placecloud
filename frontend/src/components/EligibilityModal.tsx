import React from 'react';
import { X, CheckCircle2, AlertCircle, Building2, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { PlacementDrive } from '../types';

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  drive: PlacementDrive | null;
  onApply?: (driveId: number) => void;
  isApplying?: boolean;
}

export const EligibilityModal: React.FC<EligibilityModalProps> = ({
  isOpen,
  onClose,
  drive,
  onApply,
  isApplying = false,
}) => {
  if (!isOpen || !drive) return null;

  const crit = drive.eligibility_criteria;
  const isEligible = drive.student_eligible;
  const reasons = drive.student_ineligibility_reasons || [];
  const hasApplied = drive.student_applied;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
              {drive.company_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{drive.title}</h3>
              <p className="text-xs text-slate-500">{drive.company_name} • ₹{drive.ctc_lpa} LPA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
          {/* Eligibility Banner */}
          {isEligible === true && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold">You are Eligible for this Placement Drive</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your academic record and department fulfill all recruitment criteria specified by {drive.company_name}.
                </p>
              </div>
            </div>
          )}

          {isEligible === false && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold">You do not meet the Eligibility Criteria</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Automated evaluation detected the following mismatch(es):
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 pl-9 text-xs list-disc font-medium text-rose-700">
                {reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Drive Snapshot */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500">Package (CTC):</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">₹{drive.ctc_lpa} LPA</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500">Work Mode:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{drive.work_mode} ({drive.job_location || 'Campus'})</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500">Application Deadline:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {new Date(drive.application_deadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-500">Vacancies:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{drive.vacancies} Position(s)</p>
            </div>
          </div>

          {/* Detailed Criteria Checklist */}
          {crit && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Drive Criteria Rules
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-600">Minimum CGPA Required</span>
                  <span className="font-semibold text-slate-900">{crit.min_cgpa.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-600">10th & 12th Minimum %</span>
                  <span className="font-semibold text-slate-900">{crit.min_tenth_percentage}% / {crit.min_twelfth_percentage}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-600">Max Active Backlogs Allowed</span>
                  <span className="font-semibold text-slate-900">{crit.max_active_backlogs}</span>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-600">Eligible Departments</span>
                  <span className="font-semibold text-blue-600">
                    {crit.allowed_departments && crit.allowed_departments.length > 0
                      ? crit.allowed_departments.join(', ')
                      : 'All Departments'}
                  </span>
                </div>
                {crit.required_skills && (
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600">Required Skills</span>
                    <span className="font-semibold text-slate-900">{crit.required_skills}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {drive.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Job Overview
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {drive.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>

          {onApply && (
            <div>
              {hasApplied ? (
                <span className="rounded-xl bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-800">
                  Already Applied ({drive.student_application_status || 'Submitted'})
                </span>
              ) : isEligible ? (
                <button
                  onClick={() => onApply(drive.id)}
                  disabled={isApplying}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {isApplying ? 'Submitting Application...' : 'Apply for this Drive'}
                </button>
              ) : (
                <button
                  disabled
                  className="rounded-xl bg-slate-200 px-5 py-2 text-xs font-medium text-slate-400 cursor-not-allowed"
                >
                  Ineligible to Apply
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
