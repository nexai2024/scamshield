'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { TrainingScenario } from '@/lib/data/trainingScenarios';
import { trainingScenarios } from '@/lib/data/trainingScenarios';

type UserVerdict = 'scam' | 'safe' | 'unsure';

const PASSING_SCORE = 80;

function shuffleScenarios(items: TrainingScenario[]): TrainingScenario[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ScamTrainingMode({ isDark }: { isDark: boolean }) {
  const [sessionScenarios, setSessionScenarios] = useState<TrainingScenario[]>(() => shuffleScenarios(trainingScenarios));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVerdict, setSelectedVerdict] = useState<UserVerdict | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentScenario = sessionScenarios[currentIndex];
  const isComplete = currentIndex >= sessionScenarios.length;
  const score = useMemo(
    () => Math.round((correctCount / Math.max(sessionScenarios.length, 1)) * 100),
    [correctCount, sessionScenarios.length]
  );

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const buttonBase = isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300';

  const submitAnswer = () => {
    if (!currentScenario || !selectedVerdict || showFeedback) return;
    const isCorrect = (selectedVerdict === 'scam' && currentScenario.isScam) || (selectedVerdict === 'safe' && !currentScenario.isScam);
    if (isCorrect) setCorrectCount((prev) => prev + 1);
    setShowFeedback(true);
  };

  const nextScenario = () => {
    setSelectedVerdict(null);
    setShowFeedback(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const restartTraining = () => {
    setSessionScenarios(shuffleScenarios(trainingScenarios));
    setCurrentIndex(0);
    setSelectedVerdict(null);
    setShowFeedback(false);
    setCorrectCount(0);
  };

  if (isComplete) {
    return (
      <div className={`${cardBg} border rounded-2xl p-8 space-y-6`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-6 h-6 ${score >= PASSING_SCORE ? 'text-emerald-500' : 'text-amber-500'}`} />
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Training Session Complete</h2>
        </div>
        <p className={textMuted}>
          You scored <span className={`font-semibold ${textPrimary}`}>{score}%</span> ({correctCount}/{sessionScenarios.length} correct).
          {score >= PASSING_SCORE
            ? ' Strong work spotting threat patterns.'
            : ' Good start. Another round will sharpen your instincts.'}
        </p>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`font-semibold mb-1 ${textPrimary}`}>How to improve</p>
          <p className={`text-sm ${textMuted}`}>
            Focus on urgency language, requests for secrecy, unusual payment methods, and domains that do not match the real organization.
          </p>
        </div>
        <button
          type="button"
          onClick={restartTraining}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Start New Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Scam Simulation & Training</h2>
          <p className={textMuted}>Practice with realistic messages. Decide quickly, then review the coaching breakdown.</p>
        </div>
        <div className={`text-sm rounded-lg border px-3 py-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <span className={textMuted}>Progress: </span>
          <span className={`font-semibold ${textPrimary}`}>{Math.min(currentIndex + 1, sessionScenarios.length)}/{sessionScenarios.length}</span>
        </div>
      </div>

      <div className={`${cardBg} border rounded-2xl p-6 space-y-5`}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <span className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{currentScenario.channel}</span>
          <span className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>Difficulty: {currentScenario.difficulty}</span>
          <span className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>{currentScenario.title}</span>
        </div>

        <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${textPrimary}`}>{currentScenario.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSelectedVerdict('scam')}
            className={`rounded-xl border p-3 text-left transition-colors ${buttonBase} ${selectedVerdict === 'scam' ? 'border-red-500 bg-red-500/10' : ''}`}
          >
            <div className={`font-semibold flex items-center gap-2 ${textPrimary}`}><ShieldAlert className="w-4 h-4 text-red-500" /> Scam</div>
            <p className={`text-xs mt-1 ${textMuted}`}>Malicious or deceptive</p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedVerdict('safe')}
            className={`rounded-xl border p-3 text-left transition-colors ${buttonBase} ${selectedVerdict === 'safe' ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
          >
            <div className={`font-semibold flex items-center gap-2 ${textPrimary}`}><ShieldCheck className="w-4 h-4 text-emerald-500" /> Probably Safe</div>
            <p className={`text-xs mt-1 ${textMuted}`}>Looks legitimate</p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedVerdict('unsure')}
            className={`rounded-xl border p-3 text-left transition-colors ${buttonBase} ${selectedVerdict === 'unsure' ? 'border-amber-500 bg-amber-500/10' : ''}`}
          >
            <div className={`font-semibold flex items-center gap-2 ${textPrimary}`}><ShieldQuestion className="w-4 h-4 text-amber-500" /> Unsure</div>
            <p className={`text-xs mt-1 ${textMuted}`}>Need more verification</p>
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submitAnswer}
            disabled={!selectedVerdict || showFeedback}
            className={`rounded-xl px-4 py-2.5 font-semibold transition-colors ${!selectedVerdict || showFeedback ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
          >
            Check Answer
          </button>
          <button
            type="button"
            onClick={restartTraining}
            className={`rounded-xl border px-4 py-2.5 font-semibold ${buttonBase}`}
          >
            Restart Session
          </button>
        </div>

        {showFeedback && (
          <div className={`rounded-xl border p-4 space-y-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`font-semibold ${
              (selectedVerdict === 'scam' && currentScenario.isScam) || (selectedVerdict === 'safe' && !currentScenario.isScam)
                ? 'text-emerald-500'
                : selectedVerdict === 'unsure'
                  ? 'text-amber-500'
                  : 'text-red-500'
            }`}>
              {(selectedVerdict === 'scam' && currentScenario.isScam) || (selectedVerdict === 'safe' && !currentScenario.isScam)
                ? 'Correct'
                : selectedVerdict === 'unsure'
                  ? 'Reasonable caution'
                  : 'Needs review'}
            </p>
            <p className={`text-sm ${textMuted}`}>
              Ground truth: <span className={`font-semibold ${textPrimary}`}>{currentScenario.isScam ? 'Scam' : 'Likely Legitimate'}</span> ({currentScenario.threatType})
            </p>
            <p className={`text-sm ${textPrimary}`}>{currentScenario.explanation}</p>
            <p className={`text-sm ${textMuted}`}><span className={`font-semibold ${textPrimary}`}>Coaching tip:</span> {currentScenario.coachingTip}</p>
            <button type="button" onClick={nextScenario} className="mt-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
              Next Scenario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
