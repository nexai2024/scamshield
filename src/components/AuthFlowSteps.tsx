import React from 'react';
import { LogIn, CreditCard, LayoutDashboard, Check } from 'lucide-react';

type Step = 'auth' | 'plan' | 'dashboard';

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'auth', label: 'Sign in', icon: LogIn },
  { id: 'plan', label: 'Choose plan', icon: CreditCard },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

interface AuthFlowStepsProps {
  currentStep: Step;
  isDark?: boolean;
}

export function AuthFlowSteps({ currentStep, isDark = true }: AuthFlowStepsProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const lineInactive = isDark ? 'bg-slate-700' : 'bg-slate-200';
  const lineActive = 'bg-emerald-500';

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            {i > 0 && (
              <div
                className={`w-12 h-0.5 sm:w-16 ${i <= currentIndex ? lineActive : lineInactive}`}
                aria-hidden
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                      ? 'border-emerald-500 text-emerald-500'
                      : isDark
                        ? 'border-slate-600 text-slate-500'
                        : 'border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isCurrent ? (isDark ? 'text-white' : 'text-slate-900') : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
