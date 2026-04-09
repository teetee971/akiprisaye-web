/**
 * Normalises a raw receipt label for use as a product image search query.
 *
 * Steps applied (in order):
 * 1. Trim and lower-case.
 * 2. Strip diacritics (NFD decomposition + combining-mark removal).
 * 3. Remove punctuation except alphanumerics, spaces, and dots/commas inside
 *    quantity expressions (e.g. "1.5l", "500g").
 * 4. Remove common store-name tokens that appear in Antillean receipts.
 * 5. Collapse runs of whitespace to a single space.
 */

/** Store-name tokens to strip (word-boundary matched, case-insensitive). */
export const STORE_SUFFIXES: readonly string[] = [
  'carrefour',
  'crf',
  'super u',
  'hyper u',
  'marche u',
  'leader price',
  'leaderprice',
  'intermarche',
  'leclerc',
  'aldi',
  'lidl',
  'casino',
  'franprix',
  'monoprix',
  'simply',
  'netto',
  'bi1',
  'match',
  'cora',
  'spar',
  'ecomarche',
  'g20',
  'vival',
  'maxi',
];

/**
 * Removes common store-name tokens from a lower-cased, accent-stripped string.
 * Only strips whole words so that "carrefour" in "carrefour city" is removed but
 * a store name embedded inside another word is left intact.
 */
function removeStoreSuffixes(q: string): string {
  // Sort descending by length so multi-word tokens are tried first.
  const sorted = [...STORE_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sorted) {
    // Escape regex special chars in suffix (e.g. the space in "super u").
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'gi');
    q = q.replace(pattern, ' ');
  }
  return q;
}

/**
 * Normalises a raw receipt label into a clean search query.
 *
 * @param raw  - The raw product label from the receipt (e.g. "SUCRE BLANC 1KG CRF").
 * @returns The normalised query string (e.g. "sucre blanc 1kg").
 */
export function normalizeQuery(raw: string): string {
  if (!raw || !raw.trim()) return '';

  // 1. Lower-case + trim.
  let q = raw.trim().toLowerCase();

  // 2. Strip diacritics.
  q = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Remove store suffixes before punctuation stripping so multi-word tokens
  //    still have surrounding spaces.
  q = removeStoreSuffixes(q);

  // 4. Remove all punctuation except alphanumerics and spaces.
  //    Preserve dots/commas ONLY when surrounded by digits (quantity separator).
  //    Use a lowercase placeholder to survive the [^a-z0-9\s] strip step.
  q = q.replace(/([0-9])[.,]([0-9])/g, '$1xdotx$2'); // protect "1.5" → "1xdotx5"
  q = q.replace(/[^a-z0-9\s]/g, ' ');                // strip remaining punctuation
  q = q.replace(/([0-9])xdotx([0-9])/g, '$1.$2');    // restore "1.5"

  // 5. Collapse whitespace.
  q = q.replace(/\s+/g, ' ').trim();

  return q;
}
