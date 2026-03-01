import { useEffect } from 'react';
import { useTour } from '../context/TourContext';

export function TourOverlay() {
  const { isActive, stepIndex, steps, nextStep, endTour } = useTour();

  useEffect(() => {
    if (!isActive || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    const el = document.querySelector(`[data-tour-id="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, stepIndex, steps]);

  if (!isActive || stepIndex >= steps.length) return null;

  const step = steps[stepIndex];

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center p-4">
      <div
        className="pointer-events-auto max-w-sm w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-5 text-white"
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
      >
        <h3 id="tour-title" className="font-bold text-lg mb-1">{step.title}</h3>
        <p id="tour-body" className="text-slate-400 text-sm mb-4">{step.body}</p>
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={endTour}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            Skip tour
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium"
          >
            {stepIndex < steps.length - 1 ? 'Next' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
