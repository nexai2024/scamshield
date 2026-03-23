export interface EntityRecognitionResult {
  names: string[];
  emails: string[];
  phones: string[];
  addresses: string[];
  businesses: string[];
  nonprofits: string[];
  validation_hints: string[];
}

export interface AnalysisResult {
  risk_score: number;
  risk_level: 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical';
  scam_type: string;
  red_flags: string[];
  verdict_summary: string;
  advice: string;
  why_risky?: string;
  triggered_phrases?: string[];
  entities?: EntityRecognitionResult;
}

export interface ScanHistoryEntry {
  id: string;
  date: string;
  snippet: string;
  risk_score: number;
  risk_level: AnalysisResult['risk_level'];
  scam_type: string;
  fullResult: AnalysisResult;
}

export interface CommunityPost {
  id: string;
  date: string;
  text: string;
  risk_score?: number;
  risk_level?: AnalysisResult['risk_level'];
  scam_type?: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';
