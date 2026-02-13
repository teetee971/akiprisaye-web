import { describe, expect, it } from 'vitest';
import { isAcceptedBarcodeFormat, normalizeDetectedCode } from '../BarcodeScannerModal';

describe('BarcodeScannerModal barcode validation helpers', () => {
  it('normalizes whitespace around detected values', () => {
    expect(normalizeDetectedCode(' 3292 0900 0001 6 ')).toBe('3292090000016');
  });

  it('accepts valid EAN-13', () => {
    expect(isAcceptedBarcodeFormat('3292090000016')).toBe(true);
  });

  it('accepts valid EAN-8', () => {
    expect(isAcceptedBarcodeFormat('12345670')).toBe(true);
  });

  it('rejects non EAN values', () => {
    expect(isAcceptedBarcodeFormat('ABC3292090000016')).toBe(false);
    expect(isAcceptedBarcodeFormat('329209000001')).toBe(false);
    expect(isAcceptedBarcodeFormat('32920900000166')).toBe(false);
  });
});
