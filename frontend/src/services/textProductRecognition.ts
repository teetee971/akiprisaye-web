/**
 * Text Product Recognition Service
 * Part of PR D - Text-based Product Recognition
 *
 * Uses OCR text extraction + fuzzy search for product identification
 * when EAN is not available.
 *
 * ⚠️ CRITICAL UX PRINCIPLES ⚠️
 * - NO automatic product selection
 * - NO machine decisions
 * - User validation REQUIRED before any action
 * - Suggestions are NOT confirmations
 *
 * Security:
 * - 100% browser-side (offline)
 * - No external API calls
 * - No automatic execution
 */

import Fuse from 'fuse.js';
import { normalizeText } from '../utils/textNormalizer';

/**
 * Text-based product candidate with confidence score
 */
export interface TextProductCandidate {
  label: string;
  score: number;
}

/**
 * Extracted product hints from OCR text
 */
export interface ProductHints {
  raw: string;
  keywords: string[];
  volume?: string;
  price?: string;
}

/**
 * Extract product hints from raw OCR text
 * Uses heuristics to find:
 * - Volume (L, CL, ML, G, KG)
 * - Price (€)
 * - Keywords (words > 3 chars)
 *
 * @param text - Raw OCR text
 * @returns Extracted hints
 */
export function extractProductHints(text: string): ProductHints {
  // First, extract price and volume BEFORE normalization (to preserve € symbol)
  const priceMatch = text.match(/(\d+(?:[.,]\d+)?)\s?€/);
  const price = priceMatch ? priceMatch[0] : undefined;

  // Improved volume regex: handles lowercase, spaces between number and unit
  const volumeMatch = text.match(/(\d+(?:[.,]\d+)?)\s?(L|CL|ML|G|KG|l|cl|ml|g|kg)\b/);
  const volume = volumeMatch ? volumeMatch[0].toUpperCase() : undefined;

  // Now normalize the text
  const normalized = normalizeText(text);

  // Extract keywords (words > 3 chars, limit to 10)
  const words = normalized.split(' ').filter((w) => w.length > 3);

  return {
    raw: normalized,
    keywords: words.slice(0, 10),
    volume,
    price,
  };
}

/**
 * Fuzzy search products in catalog using keywords
 * Returns candidates sorted by relevance score
 *
 * IMPORTANT: This is a SUGGESTION, not a confirmation
 * User must validate before proceeding
 *
 * @param keywords - Extracted keywords from OCR
 * @param catalog - Product catalog with labels
 * @returns Sorted candidates with scores
 */
export function fuzzySearchProducts(
  keywords: string[],
  catalog: { label: string }[]
): TextProductCandidate[] {
  const fuse = new Fuse(catalog, {
    keys: ['label'],
    threshold: 0.4,
    includeScore: true,
  });

  const query = keywords.join(' ');
  return fuse.search(query).map((r) => ({
    label: r.item.label,
    score: r.score !== undefined ? 1 - r.score : 0,
  }));
}
