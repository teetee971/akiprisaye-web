import { describe, expect, it } from 'vitest';
import { isAcceptedEanCode, normalizeDetectedCode } from '../../utils/eanScan';

describe('BarcodeScanner EAN helpers', () => {
  it('normalizes spaces in scanned EAN', () => {
    expect(normalizeDetectedCode(' 3292 0900 0001 6 ')).toBe('3292090000016');
  });

  it('accepts EAN-13 and EAN-8 formats only', () => {
    expect(isAcceptedEanCode('3292090000016')).toBe(true);
    expect(isAcceptedEanCode('12345670')).toBe(true);
  });

  it('rejects non EAN formats', () => {
    expect(isAcceptedEanCode('ABC3292090000016')).toBe(false);
    expect(isAcceptedEanCode('329209000001')).toBe(false);
    expect(isAcceptedEanCode('32920900000166')).toBe(false);
  });
});
