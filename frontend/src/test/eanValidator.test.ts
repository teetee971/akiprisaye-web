/**
 * Tests for eanValidator — GS1 checksum & country label utilities
 */
import { describe, it, expect } from 'vitest';
import {
  validateEAN13,
  validateEAN8,
  validateUPCA,
  validateGTIN,
  normalizeToEAN13,
  getGS1CountryLabel,
  computeCheckDigit,
} from '../lib/eanValidator';

// ---------------------------------------------------------------------------
// validateEAN13
// ---------------------------------------------------------------------------
describe('validateEAN13', () => {
  it('accepts valid EAN-13 codes', () => {
    // Coca-Cola 330 mL reference EAN
    expect(validateEAN13('5449000000439')).toBe(true);
    // Nutella 400 g reference EAN
    expect(validateEAN13('3017620422003')).toBe(true);
    // Danone prefix (303 → France range 300-379), check digit = 1
    expect(validateEAN13('3033710088041')).toBe(true);
  });

  it('rejects codes with wrong check digit', () => {
    expect(validateEAN13('5449000000430')).toBe(false); // last digit changed
    expect(validateEAN13('3017620422009')).toBe(false);
  });

  it('rejects codes of wrong length', () => {
    expect(validateEAN13('54490000004')).toBe(false);   // 11 digits
    expect(validateEAN13('54490000004391')).toBe(false); // 14 digits
  });

  it('rejects non-numeric strings', () => {
    expect(validateEAN13('300ABC0000439')).toBe(false);
    expect(validateEAN13('')).toBe(false);
  });

  it('handles leading/trailing whitespace', () => {
    expect(validateEAN13(' 5449000000439 ')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateEAN8
// ---------------------------------------------------------------------------
describe('validateEAN8', () => {
  it('accepts valid EAN-8 codes', () => {
    expect(validateEAN8('73513537')).toBe(true);
    expect(validateEAN8('40170725')).toBe(true);
  });

  it('rejects codes with wrong check digit', () => {
    expect(validateEAN8('73513530')).toBe(false);
  });

  it('rejects codes of wrong length', () => {
    expect(validateEAN8('7351353')).toBe(false);
    expect(validateEAN8('735135370')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateUPCA
// ---------------------------------------------------------------------------
describe('validateUPCA', () => {
  it('accepts valid UPC-A codes', () => {
    expect(validateUPCA('012345678905')).toBe(true);
    expect(validateUPCA('614141000036')).toBe(true);
  });

  it('rejects codes with wrong check digit', () => {
    expect(validateUPCA('012345678900')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGTIN
// ---------------------------------------------------------------------------
describe('validateGTIN', () => {
  it('validates EAN-8, EAN-13, UPC-A and GTIN-14', () => {
    expect(validateGTIN('73513537')).toBe(true);     // EAN-8
    expect(validateGTIN('3017620422003')).toBe(true); // EAN-13
    expect(validateGTIN('614141000036')).toBe(true);  // UPC-A (12 digits)
  });

  it('rejects invalid or unsupported lengths', () => {
    expect(validateGTIN('1234')).toBe(false);  // too short
    expect(validateGTIN('12345678901')).toBe(false); // 11 digits
  });
});

// ---------------------------------------------------------------------------
// normalizeToEAN13
// ---------------------------------------------------------------------------
describe('normalizeToEAN13', () => {
  it('returns EAN-13 unchanged when valid', () => {
    expect(normalizeToEAN13('3017620422003')).toBe('3017620422003');
  });

  it('pads valid UPC-A to EAN-13 with leading zero', () => {
    const result = normalizeToEAN13('614141000036');
    expect(result).toBe('0614141000036');
    // The padded version must also pass EAN-13 validation
    expect(validateEAN13(result!)).toBe(true);
  });

  it('returns null for invalid codes', () => {
    expect(normalizeToEAN13('3017620422009')).toBeNull(); // bad check digit
    expect(normalizeToEAN13('abc')).toBeNull();
    expect(normalizeToEAN13('')).toBeNull();
  });

  it('returns valid EAN-8 unchanged', () => {
    expect(normalizeToEAN13('73513537')).toBe('73513537');
  });
});

// ---------------------------------------------------------------------------
// getGS1CountryLabel
// ---------------------------------------------------------------------------
describe('getGS1CountryLabel', () => {
  it('returns France for codes starting 30-37 (prefix 300-379)', () => {
    expect(getGS1CountryLabel('3017620422003')).toContain('France'); // prefix 301
    expect(getGS1CountryLabel('3033710088041')).toContain('France'); // prefix 303
  });

  it('returns UPC label for codes starting 00-09', () => {
    const label = getGS1CountryLabel('0614141000036');
    expect(label).toContain('UPC');
  });

  it('returns Germany for codes starting 400-440', () => {
    expect(getGS1CountryLabel('4006381333931')).toContain('Allemagne');
  });

  it('returns null for codes shorter than 3 digits', () => {
    expect(getGS1CountryLabel('30')).toBeNull();
  });

  it('returns null for unknown prefix', () => {
    // 960 is not assigned in our map
    expect(getGS1CountryLabel('9600000000001')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeCheckDigit
// ---------------------------------------------------------------------------
describe('computeCheckDigit', () => {
  it('computes correct check digit for 12-digit body', () => {
    // EAN-13 "3017620422003" → body "301762042200" → check = 3
    expect(computeCheckDigit('301762042200')).toBe(3);
  });

  it('computes correct check digit for 7-digit EAN-8 body', () => {
    // EAN-8 "73513537" → body "7351353" → check = 7
    expect(computeCheckDigit('7351353')).toBe(7);
  });

  it('returns null for non-numeric input', () => {
    expect(computeCheckDigit('ABC123456789')).toBeNull();
  });

  it('returns null for unsupported body length', () => {
    expect(computeCheckDigit('123456')).toBeNull(); // 6 digits — not supported
  });
});
