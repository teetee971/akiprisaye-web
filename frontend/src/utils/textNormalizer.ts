/**
 * Text Normalizer Utility
 * Part of PR D - Text-based Product Recognition
 *
 * Normalizes raw OCR text for product matching
 * - Removes special characters
 * - Standardizes spacing
 * - Converts to uppercase
 *
 * Security: Input sanitization, no code execution
 */

/**
 * Normalize raw OCR text for product matching
 *
 * @param raw - Raw text from OCR
 * @returns Normalized text
 */
export function normalizeText(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9€.,\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
