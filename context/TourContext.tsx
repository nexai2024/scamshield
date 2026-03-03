'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const TOUR_DONE_KEY = 'scamshield_tour_done';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  body: string;
}

interface TourContextValue {
  isActive: boolean;
  stepIndex: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  endTour: () => void;
  hasCompletedTour: boolean;
  resetTour: () => void;
}

const defaultSteps: TourStep[] = [
  { id: 'paste', target: 'tour-paste', title: 'Paste text here', body: 'Paste any suspicious message, email, or DM to analyze it for scam signals.' },
  { id: 'analyze', target: 'tour-analyze', title: 'Analyze', body: 'Click Analyze to run our AI. You will get a risk score and clear next steps.' },
  { id: 'history', target: 'tour-history', title: 'History', body: 'Pro users can review past scans and export reports from the History page.' },
];

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const hasCompletedTour = typeof window !== 'undefined' && localStorage.getItem(TOUR_DONE_KEY) === 'true';

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((i) => {
      if (i >= defaultSteps.length - 1) {
        if (typeof window !== 'undefined') localStorage.setItem(TOUR_DONE_KEY, 'true');
        setIsActive(false);
        return 0;
      }
      return i + 1;
    });
  }, []);

  const endTour = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(TOUR_DONE_KEY, 'true');
    setIsActive(false);
    setStepIndex(0);
  }, []);

  const resetTour = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(TOUR_DONE_KEY);
    setStepIndex(0);
    setIsActive(false);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        stepIndex,
        steps: defaultSteps,
        startTour,
        nextStep,
        endTour,
        hasCompletedTour,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
