/**
 * OCR Utilities - v1.1.0
 *
 * Simple OCR for extracting prices from tickets and labels
 * Uses Tesseract.js for local processing
 *
 * @module ocrUtils
 */

import type { OCRExtractionResult } from '../types/product';

/**
 * Extract price information from image using OCR
 * Simplified version for tickets and price labels
 */
export async function extractPriceFromImage(imageFile: File): Promise<OCRExtractionResult> {
  try {
    // Note: In production, this would use Tesseract.js
    // For now, returning a mock result structure

    const rawText = await simulateOCR(imageFile);

    // Extract price (looking for patterns like "1.99€" or "1,99 €")
    const priceMatch = rawText.match(/(\d+[.,]\d{2})\s*€?/);
    const prix = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : undefined;

    // Extract date (looking for DD/MM/YYYY)
    const dateMatch = rawText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : undefined;

    // Basic confidence calculation
    const confidence = (prix ? 0.5 : 0) + (date ? 0.3 : 0);

    return {
      prix,
      date,
      confidence,
      needsConfirmation: confidence < 0.8,
      rawText,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('OCR extraction failed:', error);
    }

    return {
      confidence: 0,
      needsConfirmation: true,
      rawText: '',
    };
  }
}

/**
 * Simulate OCR processing
 * In production, replace with actual Tesseract.js implementation
 */
async function simulateOCR(imageFile: File): Promise<string> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock OCR text
  return `
    CARREFOUR MARKET
    123 RUE EXEMPLE
    97100 GUADELOUPE

    LAIT DEMI-ECREME 1L
    1.85 €

    PAIN DE MIE 500G
    2.45 €

    Date: 01/01/2026
    Total: 4.30 €
  `;
}

/**
 * Parse product name from OCR text
 * Basic implementation - can be improved with ML
 */
export function extractProductName(rawText: string): string | undefined {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Look for lines that might be product names
  // Typically between store header and price
  for (const line of lines) {
    // Skip if it's a price line
    if (line.match(/\d+[.,]\d{2}\s*€/)) continue;

    // Skip if it's a date
    if (line.match(/\d{2}\/\d{2}\/\d{4}/)) continue;

    // Skip if it's too short or looks like address
    if (line.length < 5 || line.match(/^\d+\s+RUE|AVENUE|BOULEVARD/i)) continue;

    // Skip common store names
    if (line.match(/CARREFOUR|LECLERC|AUCHAN|CASINO/i)) continue;

    // If it has numbers followed by letters, might be a product
    if (line.match(/[A-Z]{3,}/)) {
      return line;
    }
  }

  return undefined;
}

/**
 * Extract store name from OCR text
 */
export function extractStoreName(rawText: string): string | undefined {
  const storePatterns = [
    /CARREFOUR/i,
    /LECLERC/i,
    /AUCHAN/i,
    /CASINO/i,
    /INTERMARCHE/i,
    /SUPER\s*U/i,
    /HYPER\s*U/i,
  ];

  for (const pattern of storePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * Validate OCR extraction result
 */
export function validateOCRResult(result: OCRExtractionResult): boolean {
  // At minimum, need a price
  if (!result.prix || result.prix <= 0 || result.prix > 10000) {
    return false;
  }

  // High confidence results are automatically valid
  if (result.confidence >= 0.8) {
    return true;
  }

  // Low confidence needs manual confirmation
  return false;
}
