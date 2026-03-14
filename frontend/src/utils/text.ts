/**
 * Text normalization utility for search queries.
 * Removes diacritics, converts to lowercase, and trims whitespace.
 */

/**
 * Normalize text by removing diacritics, converting to lowercase, and trimming.
 * Returns an empty string for non-string inputs.
 */
export function normalizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
