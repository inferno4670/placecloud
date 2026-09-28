import React from 'react';
import { Check, Clock, XCircle, Award } from 'lucide-react';

interface StatusStepperProps {
  stages: string[];
  currentStage: string;
  status: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  stages,
  currentStage,
  status,
}) => {
  const isRejected = status === 'REJECTED';
  const isSelected = status === 'SELECTED';
  const isWithdrawn = status === 'WITHDRAWN';

  // Normalize stages list (fallback to standard flow if empty)
  const defaultStages = ['Applied', 'Assessment', 'Interview', 'Selected'];
  const pipeline = stages && stages.length > 0 ? stages : defaultStages;

  // Find index of current stage
  let currentIndex = pipeline.findIndex(
    (s) => s.toLowerCase() === currentStage.toLowerCase()
  );
  if (currentIndex === -1) {
    currentIndex = isSelected ? pipeline.length - 1 : 0;
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {pipeline.map((stage, idx) => {
          const isPassed = isSelected || idx < currentIndex;
          const isCurrent = idx === currentIndex && !isSelected && !isRejected;
          const isFailed = idx === currentIndex && isRejected;

          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isPassed
                      ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-50 animate-pulse'
                      : isFailed
                      ? 'bg-rose-500 text-white shadow-sm ring-4 ring-rose-50'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isPassed ? (
                    <Check className="h-4 w-4" />
                  ) : isFailed ? (
                    <XCircle className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4" />
                  ) : idx === pipeline.length - 1 ? (
                    <Award className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-center text-[11px] font-medium max-w-[80px] truncate ${
                    isCurrent
                      ? 'text-blue-600 font-bold'
                      : isPassed
                      ? 'text-emerald-700'
                      : isFailed
                      ? 'text-rose-600 font-semibold'
                      : 'text-slate-400'
                  }`}
                  title={stage}
                >
                  {stage}
                </span>
              </div>

              {idx < pipeline.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    idx < currentIndex || isSelected
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {isWithdrawn && (
        <p className="mt-3 text-center text-xs font-semibold text-slate-500 bg-slate-100 py-1 rounded-lg">
          Application was withdrawn by the student
        </p>
      )}
    </div>
  );
};
