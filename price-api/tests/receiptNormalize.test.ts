import { describe, expect, it } from 'vitest';
import { stableCashierHash } from '../src/pii/hash';
import { extractCashierLabel } from '../src/receipt/normalize';

describe('extractCashierLabel', () => {
  it('extracts explicit cashier label and operator id', () => {
    const text = 'MAGASIN XYZ\nCAISSIERE: DUPONT (12)\nTOTAL';
    expect(extractCashierLabel(text)).toEqual({
      label: 'DUPONT (12)',
      operatorId: '12',
    });
  });

  it('extracts isolated name around ticket anchor', () => {
    const text = 'Ticket n° 991\n\nMARTIN (7)\nArticle A';
    expect(extractCashierLabel(text)).toEqual({
      label: 'MARTIN (7)',
      operatorId: '7',
    });
  });

  it('returns null when no cashier-like info is found', () => {
    expect(extractCashierLabel('Aucun caissier ici')).toEqual({
      label: null,
      operatorId: null,
    });
  });
});

describe('stableCashierHash', () => {
  it('returns stable hash for same label and salt', async () => {
    const a = await stableCashierHash('DUPONT (12)', 'salt');
    const b = await stableCashierHash('DUPONT (12)', 'salt');
    const c = await stableCashierHash('DURAND (12)', 'salt');

    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });
});
