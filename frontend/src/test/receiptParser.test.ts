/**
 * Tests for receiptParser — structured French receipt extraction
 */
import { describe, it, expect } from 'vitest';
import { parseReceipt, looksLikeReceipt } from '../services/receiptParser';

// ---------------------------------------------------------------------------
// Sample receipt texts (realistic OCR output format)
// ---------------------------------------------------------------------------

const SAMPLE_TICKET_FULL = `
CARREFOUR MARKET
23 RUE DE LA PAIX  75008 PARIS
Date: 15/03/2025  Heure: 14:32
Ticket N°: 00042587

LAIT DEMI ECREME 1L          1,29 €
PAIN DE MIE COMPLET          2,15 €
JAMBON BLANC X6              3,49 €
YAOURT NATURE X4             1,89 €
JAVEL CONCENTRE 500ML        1,05 €

TOTAL TTC                    9,87 €
TVA 5,5%                     0,54 €

CB                           9,87 €
`.trim();

const SAMPLE_TICKET_MINIMAL = `
LIDL
12/01/2025
PAIN                         0,89
LAIT                         0,99
TOTAL                        1,88
`.trim();

const SAMPLE_NOT_RECEIPT = `
Valeurs nutritionnelles pour 100g
Energie : 1500 kJ / 360 kcal
Matières grasses : 12g
Glucides : 50g
Protéines : 8g
Sel : 0,5g
`.trim();

const SAMPLE_QTY_TICKET = `
MONOPRIX
20/06/2025  09h15
Ticket n°987654

Beurre 250g               1,95 €
Œufs calibre M 6          2,89 €
2 x Yaourt nature          2,58 €

SOUS-TOTAL HT              7,42 €
TOTAL TTC                  7,42 €
TVA 5.5% :                 0,39 €
CARTE BANCAIRE             7,42 €
`.trim();

// ---------------------------------------------------------------------------
// looksLikeReceipt
// ---------------------------------------------------------------------------
describe('looksLikeReceipt', () => {
  it('returns true for typical receipt text', () => {
    expect(looksLikeReceipt(SAMPLE_TICKET_FULL)).toBe(true);
    expect(looksLikeReceipt(SAMPLE_TICKET_MINIMAL)).toBe(true);
  });

  it('returns false for nutritional information', () => {
    expect(looksLikeReceipt(SAMPLE_NOT_RECEIPT)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(looksLikeReceipt('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseReceipt — full ticket
// ---------------------------------------------------------------------------
describe('parseReceipt — full ticket', () => {
  const result = parseReceipt(SAMPLE_TICKET_FULL);

  it('extracts the store name', () => {
    expect(result.storeName).toContain('CARREFOUR');
  });

  it('extracts the date', () => {
    expect(result.date).toBe('15/03/2025');
  });

  it('extracts the time', () => {
    expect(result.time).toBe('14:32');
  });

  it('extracts the receipt number', () => {
    expect(result.receiptNumber).toBe('00042587');
  });

  it('extracts line items with correct prices', () => {
    expect(result.items.length).toBeGreaterThanOrEqual(4);
    const lait = result.items.find((it) => it.name.toUpperCase().includes('LAIT'));
    expect(lait).toBeDefined();
    expect(lait?.price).toBe(1.29);
  });

  it('extracts the grand total', () => {
    expect(result.total).toBe(9.87);
  });

  it('extracts TVA amount and rate', () => {
    expect(result.tvaAmount).toBeCloseTo(0.54, 2);
    expect(result.tvaRate).toBeCloseTo(5.5, 1);
  });

  it('extracts the payment method', () => {
    expect(result.paymentMethod?.toLowerCase()).toContain('cb');
  });
});

// ---------------------------------------------------------------------------
// parseReceipt — minimal ticket
// ---------------------------------------------------------------------------
describe('parseReceipt — minimal ticket', () => {
  const result = parseReceipt(SAMPLE_TICKET_MINIMAL);

  it('extracts the store name', () => {
    expect(result.storeName).toContain('LIDL');
  });

  it('extracts the date', () => {
    expect(result.date).toBe('12/01/2025');
  });

  it('extracts the grand total', () => {
    expect(result.total).toBe(1.88);
  });
});

// ---------------------------------------------------------------------------
// parseReceipt — ticket with quantity lines
// ---------------------------------------------------------------------------
describe('parseReceipt — quantity ticket', () => {
  const result = parseReceipt(SAMPLE_QTY_TICKET);

  it('extracts date and time', () => {
    expect(result.date).toBe('20/06/2025');
    expect(result.time).toBe('09:15');
  });

  it('extracts receipt number', () => {
    expect(result.receiptNumber).toBe('987654');
  });

  it('extracts grand total', () => {
    expect(result.total).toBe(7.42);
  });

  it('extracts TVA', () => {
    expect(result.tvaAmount).toBeCloseTo(0.39, 2);
  });

  it('extracts payment method', () => {
    expect(result.paymentMethod?.toLowerCase()).toContain('carte');
  });

  it('extracts subtotal', () => {
    expect(result.subtotal).toBeCloseTo(7.42, 2);
  });
});

// ---------------------------------------------------------------------------
// parseReceipt — checksum
// ---------------------------------------------------------------------------
describe('parseReceipt — price checksum', () => {
  it('checksum matches when items sum equals declared total', () => {
    // Construct a minimal text where sum(items) == total
    const text = `
SUPERMARCHE TEST
PRODUIT A                    3,50 €
PRODUIT B                    1,50 €
TOTAL TTC                    5,00 €
    `.trim();
    const result = parseReceipt(text);
    expect(result.checksum.declared).toBe(5.00);
    expect(result.checksum.computed).toBeCloseTo(5.00, 2);
    expect(result.checksum.matches).toBe(true);
  });

  it('checksum does not match when sum differs from total', () => {
    const text = `
SUPERMARCHE TEST
PRODUIT A                    3,50 €
PRODUIT B                    1,50 €
TOTAL TTC                    6,00 €
    `.trim();
    const result = parseReceipt(text);
    expect(result.checksum.matches).toBe(false);
  });

  it('sets declared to null when no total found', () => {
    const result = parseReceipt('PRODUIT A   2,50 €');
    expect(result.checksum.declared).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseReceipt — edge cases
// ---------------------------------------------------------------------------
describe('parseReceipt — edge cases', () => {
  it('handles empty string without throwing', () => {
    expect(() => parseReceipt('')).not.toThrow();
    const result = parseReceipt('');
    expect(result.items).toEqual([]);
    expect(result.total).toBeUndefined();
  });

  it('handles text with no prices', () => {
    const result = parseReceipt('Bonjour et bienvenue dans notre magasin');
    expect(result.items).toEqual([]);
    expect(result.total).toBeUndefined();
  });

  it('does not crash on very long text', () => {
    const longText = Array(500).fill('PRODUIT QUELCONQUE   1,99 €').join('\n');
    expect(() => parseReceipt(longText)).not.toThrow();
  });
});
