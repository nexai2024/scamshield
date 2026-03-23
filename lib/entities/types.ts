export type EntityKind = 'email' | 'phone' | 'place' | 'properName';

export interface ExtractedEntities {
  emails: string[];
  phones: string[];
  places: string[];
  properNames: string[];
}

export interface EntityValidationResult {
  valid: boolean;
  kind: EntityKind;
  value: string;
  /** Human-readable detail (e.g. geocoded label, E.164, or error reason) */
  detail?: string;
  reason?: string;
}
