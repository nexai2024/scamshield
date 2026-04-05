export interface EntityRecognitionResult {
  names: string[];
  emails: string[];
  phones: string[];
  addresses: string[];
  businesses: string[];
  nonprofits: string[];
  validation_hints: string[];
  /** URLs detected in the message (and/or from screenshot OCR); used for link inspection. */
  urls?: string[];
}

export interface LinkInspection {
  /** Original URL as seen in the message (may be shortened). */
  original_url: string;
  /** Final URL after following HTTP redirects (best effort). */
  expanded_url?: string;
  /** Hostname of final URL when available. */
  final_hostname?: string;
  lookalike_warning?: string;
  /** ISO date when domain was registered (from RDAP when available). */
  domain_registration_date?: string;
  registrar?: string;
  expand_error?: string;
  rdap_error?: string;
}

export type PiiPaymentKind =
  | 'otp_verification_code'
  | 'ssn'
  | 'bank_account'
  | 'payment_card'
  | 'gift_card'
  | 'crypto_wallet'
  | 'wire_transfer_pressure'
  | 'other_sensitive';

export interface PiiPaymentFinding {
  kind: PiiPaymentKind;
  /** Short description of what matched. */
  summary: string;
  /** Snippet or redacted cue (avoid echoing full secrets). */
  excerpt?: string;
  /** User-facing warning — never share. */
  never_share: string;
}

export interface ScamPatternInfo {
  label: string;
  /** 0–100 */
  confidence: number;
  /** What this pattern usually does next (social engineering). */
  typical_next_steps: string;
}

export interface RiskBreakdown {
  /** 0–100 — sender identity / spoofing indicators */
  sender_authenticity: number;
  /** 0–100 — links, redirects, lookalikes */
  link_safety: number;
  /** 0–100 — payment rails, gift cards, crypto, wires */
  payment_risk: number;
  /** 0–100 — requests for credentials, IDs, OTPs */
  identity_theft_risk: number;
}

export interface OfficialContactEntry {
  id: string;
  displayName: string;
  /** Customer-facing or widely published contact paths — user must still verify. */
  primaryUrl?: string;
  supportPhone?: string;
  notes?: string;
}

/** Links an exact phrase from the message to red flag list indices from the same analysis. */
export interface PhraseAttribution {
  phrase: string;
  linked_red_flag_indexes: number[];
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
  /** When present, maps phrases to `red_flags` by index for inline explainability. */
  phrase_attributions?: PhraseAttribution[];
  entities?: EntityRecognitionResult;
  /** Text extracted from an uploaded screenshot (OCR). */
  ocr_text?: string;
  scam_pattern?: ScamPatternInfo;
  risk_breakdown?: RiskBreakdown;
  safe_reply_suggestions?: string[];
  link_inspections?: LinkInspection[];
  pii_payment_findings?: PiiPaymentFinding[];
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
