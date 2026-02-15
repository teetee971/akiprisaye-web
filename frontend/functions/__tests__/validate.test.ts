import { describe, expect, it } from 'vitest';
import { isBarcode, isEnumValue, isLatitude, isLongitude } from '../_lib/validate';

describe('validate helpers', () => {
  it('validates EAN-8 / EAN-13 / EAN-14 barcodes', () => {
    expect(isBarcode('55123457')).toBe(true);
    expect(isBarcode('3274080005003')).toBe(true);
    expect(isBarcode('00012345600012')).toBe(true);
    expect(isBarcode('3274080005004')).toBe(false);
  });

  it('validates latitude/longitude ranges', () => {
    expect(isLatitude('16.265')).toBe(true);
    expect(isLatitude(100)).toBe(false);
    expect(isLongitude('-61.551')).toBe(true);
    expect(isLongitude(-200)).toBe(false);
  });

  it('validates enum values', () => {
    expect(isEnumValue('gp', ['gp', 'mq', 'fr'] as const)).toBe(true);
    expect(isEnumValue('de', ['gp', 'mq', 'fr'] as const)).toBe(false);
  });
});
