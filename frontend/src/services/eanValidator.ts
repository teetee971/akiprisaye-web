/**
 * EAN Validator Service
 * Strict validation for EAN-8 and EAN-13 barcodes with checksum verification
 *
 * References:
 * - EAN-13: https://en.wikipedia.org/wiki/International_Article_Number
 * - EAN-8: https://en.wikipedia.org/wiki/EAN-8
 */

import type { EanValidationResult } from '../types/ean';

/**
 * Validate EAN-8 or EAN-13 barcode format and checksum
 *
 * @param code - Barcode string to validate
 * @returns Validation result with format and checksum status
 */
export function validateEan(code: string): EanValidationResult {
  // Remove whitespace and convert to string
  const cleanCode = String(code).replace(/\s/g, '');

  // Check if code contains only digits
  if (!/^\d+$/.test(cleanCode)) {
    return {
      valid: false,
      ean: cleanCode,
      format: null,
      checksum: false,
      error: 'Le code doit contenir uniquement des chiffres',
    };
  }

  // Determine format based on length
  const length = cleanCode.length;
  let format: 'EAN-8' | 'EAN-13' | 'UPC-A' | 'UPC-E' | null = null;

  if (length === 8) {
    format = 'EAN-8';
  } else if (length === 12) {
    format = 'UPC-A';
  } else if (length === 13) {
    format = 'EAN-13';
  } else if (length === 6 || length === 7) {
    // UPC-E can be 6 or 7 digits (with or without check digit)
    format = 'UPC-E';
  } else {
    return {
      valid: false,
      ean: cleanCode,
      format: null,
      checksum: false,
      error: `Longueur invalide: ${length} chiffres (attendu: 8 ou 13 chiffres)`,
    };
  }

  // Verify checksum
  const checksumValid = verifyChecksum(cleanCode);

  return {
    valid: checksumValid,
    ean: cleanCode,
    format,
    checksum: checksumValid,
    error: checksumValid ? undefined : 'Somme de contrôle invalide',
  };
}

/**
 * Verify EAN/UPC checksum using modulo 10 algorithm
 *
 * Algorithm:
 * 1. Starting from the right (excluding check digit), alternate multiplying by 3 and 1
 * 2. Sum all products
 * 3. Subtract from next highest multiple of 10
 * 4. Result should equal the check digit
 *
 * @param code - Complete EAN code including check digit
 * @returns True if checksum is valid
 */
export function verifyChecksum(code: string): boolean {
  const digits = code.split('').map(Number);
  const length = digits.length;

  if (length < 6) {
    return false;
  }

  // Extract check digit (last digit)
  const checkDigit = digits[length - 1];

  // Calculate checksum for digits before check digit
  let sum = 0;

  // For EAN-13 and EAN-8, alternate weights are 1 and 3 (from right to left, excluding check digit)
  for (let i = length - 2; i >= 0; i--) {
    // Position from right (0 = first digit before check, 1 = second digit before check, etc.)
    const positionFromRight = length - 2 - i;
    // Alternate: multiply by 3 for even positions, by 1 for odd positions
    const weight = positionFromRight % 2 === 0 ? 3 : 1;
    sum += digits[i] * weight;
  }

  // Calculate what the check digit should be
  const calculatedCheck = (10 - (sum % 10)) % 10;

  return checkDigit === calculatedCheck;
}

/**
 * Calculate checksum digit for an EAN code without check digit
 * Useful for generating valid EAN codes or fixing incomplete codes
 *
 * @param codeWithoutCheck - EAN code without the final check digit (7 or 12 digits)
 * @returns The calculated check digit (0-9)
 */
export function calculateCheckDigit(codeWithoutCheck: string): number {
  const digits = codeWithoutCheck.split('').map(Number);
  let sum = 0;

  // Calculate sum with alternating weights
  for (let i = digits.length - 1; i >= 0; i--) {
    const positionFromRight = digits.length - 1 - i;
    const weight = positionFromRight % 2 === 0 ? 3 : 1;
    sum += digits[i] * weight;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Check if code is a valid EAN-8
 * @param code - Code to check
 */
export function isEan8(code: string): boolean {
  const result = validateEan(code);
  return result.valid && result.format === 'EAN-8';
}

/**
 * Check if code is a valid EAN-13
 * @param code - Code to check
 */
export function isEan13(code: string): boolean {
  const result = validateEan(code);
  return result.valid && result.format === 'EAN-13';
}

/**
 * Check if code is any valid EAN format (EAN-8 or EAN-13)
 * @param code - Code to check
 */
export function isValidEan(code: string): boolean {
  const result = validateEan(code);
  return result.valid && (result.format === 'EAN-8' || result.format === 'EAN-13');
}

/**
 * Normalize EAN code - remove spaces, validate, return clean code
 * @param code - Code to normalize
 * @returns Normalized code or null if invalid
 */
export function normalizeEan(code: string): string | null {
  const result = validateEan(code);
  return result.valid ? result.ean : null;
}
