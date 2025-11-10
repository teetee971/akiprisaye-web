/**
 * Normalize text by:
 * - Converting to lowercase
 * - Removing diacritics/accents using Unicode NFD normalization
 * - Trimming whitespace
 *
 * @param {string} input - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}
