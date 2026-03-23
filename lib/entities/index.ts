export { extractEntities } from './extract';
export { mergeExtractedEntities } from './merge';
export type { EntityKind, EntityValidationResult, ExtractedEntities } from './types';
export {
  validateEmailAddress,
  validateEntity,
  validatePhoneNumber,
  validatePlaceExists,
  validateProperName,
  validateUrl,
} from './validate';
