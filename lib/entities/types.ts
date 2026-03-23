export type EntityKind = 'email' | 'phone' | 'place' | 'properName' | 'url';

export interface ExtractedEntities {
  emails: string[];
  phones: string[];
  places: string[];
  properNames: string[];
  urls: string[];
}

export interface EntityValidationResult {
  valid: boolean;
  kind: EntityKind;
  value: string;
  /** Human-readable detail (e.g. geocoded label, E.164, or error reason) */
  detail?: string;
  reason?: string;
}
