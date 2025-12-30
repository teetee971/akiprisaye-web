/**
 * Text normalization utility for search queries
 * Removes diacritics, converts to lowercase, and trims whitespace
 */

/**
 * Normalize text by removing diacritics, converting to lowercase, and trimming
 * @param {string} input - The text to normalize
 * @returns {string} - Normalized text
 */
export function normalizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Normalize to NFD (decomposed form) and remove diacritics
  // \p{Diacritic} matches all Unicode diacritic marks
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
