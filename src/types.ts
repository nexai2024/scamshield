// Extended analysis result with explanations (Enhancement 1)
export interface AnalysisResult {
  risk_score: number;
  risk_level: "Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Critical";
  scam_type: string;
  red_flags: string[];
  verdict_summary: string;
  advice: string;
  /** Plain-language explanation of why this was flagged (Enhancement 1) */
  why_risky?: string;
  /** Phrases from the message that triggered the score (Enhancement 1) */
  triggered_phrases?: string[];
}

export type PlanType = 'basic' | 'pro' | 'lifetime' | 'family';

export interface UserState {
  email: string;
  isSubscribed: boolean;
  plan?: PlanType;
}

// Scan history entry (Enhancement 2)
export interface ScanHistoryEntry {
  id: string;
  date: string; // ISO
  snippet: string;
  risk_score: number;
  risk_level: AnalysisResult['risk_level'];
  scam_type: string;
  fullResult: AnalysisResult;
}

export type ViewState = 'landing' | 'auth' | 'pricing' | 'dashboard' | 'history' | 'settings';

export type ThemeMode = 'dark' | 'light' | 'system';
