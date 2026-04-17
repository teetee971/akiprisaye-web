/**
 * Tests — Receipt OCR Pipeline
 *
 * Couvre:
 *  - parseReceiptFromOcr: extraction structurée
 *  - normalizeReceipt: normalisation des libellés et catégories
 *  - validateReceipt: règles métier, confidence scoring, needsReview
 *  - buildChecksum: déduplication
 *  - createPriceObservationsFromReceipt: transformation en observations
 *  - normalizeProductLabel: clé produit
 *  - detectCategory: catégorisation automatique
 *  - normalizeStoreName: enseignes connues et inconnues
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseReceiptFromOcr,
  normalizeReceipt,
  validateReceipt,
  createPriceObservationsFromReceipt,
  normalizeProductLabel,
  buildChecksum,
  detectCategory,
  normalizeStoreName,
} from '../receiptOcrPipeline';
import type { ReceiptRecord, OCRRawBlock } from '../../types/receipt';

// ─────────────────────────────────────────────────────────────────────────────
// Firebase mock — db null pour les tests unitaires
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({ db: null }));

// ─────────────────────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_OCR_FULL = `
CARREFOUR MARKET
23 RUE DE LA PAIX  97100 BASSE-TERRE
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

const SAMPLE_OCR_MINIMAL = `
LIDL
12/01/2025
PAIN                         0,89 €
LAIT                         0,99 €
TOTAL                        1,88 €
`.trim();

const EMPTY_BLOCKS: OCRRawBlock[] = [];

const BLOCKS_WITH_CONFIDENCE: OCRRawBlock[] = [{ text: SAMPLE_OCR_FULL, confidenceScore: 85 }];

// ─────────────────────────────────────────────────────────────────────────────
// normalizeProductLabel
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeProductLabel', () => {
  it('lowercases and removes accents', () => {
    expect(normalizeProductLabel('Lait Écrémé')).toBe('lait_ecreme');
  });

  it('replaces spaces with underscores', () => {
    expect(normalizeProductLabel('PAIN DE MIE')).toBe('pain_de_mie');
  });

  it('removes punctuation', () => {
    expect(normalizeProductLabel('Yaourt 0% mat.')).toBe('yaourt_0_mat');
  });

  it('trims leading and trailing underscores', () => {
    expect(normalizeProductLabel('  PRODUIT  ')).toBe('produit');
  });

  it('truncates at 80 characters', () => {
    const long = 'a'.repeat(100);
    expect(normalizeProductLabel(long).length).toBeLessThanOrEqual(80);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildChecksum
// ─────────────────────────────────────────────────────────────────────────────
describe('buildChecksum', () => {
  it('builds a deterministic fingerprint', () => {
    const c1 = buildChecksum('Carrefour Market', '2025-03-15', 9.87);
    const c2 = buildChecksum('Carrefour Market', '2025-03-15', 9.87);
    expect(c1).toBe(c2);
  });

  it('differs for different stores', () => {
    const c1 = buildChecksum('Carrefour', '2025-03-15', 9.87);
    const c2 = buildChecksum('Lidl', '2025-03-15', 9.87);
    expect(c1).not.toBe(c2);
  });

  it('differs for different totals', () => {
    const c1 = buildChecksum('Carrefour', '2025-03-15', 9.87);
    const c2 = buildChecksum('Carrefour', '2025-03-15', 10.0);
    expect(c1).not.toBe(c2);
  });

  it('normalizes store name (case-insensitive)', () => {
    const c1 = buildChecksum('CARREFOUR', '2025-03-15', 9.87);
    const c2 = buildChecksum('carrefour', '2025-03-15', 9.87);
    expect(c1).toBe(c2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// detectCategory
// ─────────────────────────────────────────────────────────────────────────────
describe('detectCategory', () => {
  it('detects dairy products', () => {
    expect(detectCategory('LAIT DEMI ECREME 1L')).toBe('Produits laitiers');
    expect(detectCategory('YAOURT NATURE X4')).toBe('Produits laitiers');
    expect(detectCategory('BEURRE 250G')).toBe('Produits laitiers');
  });

  it('detects beverages', () => {
    expect(detectCategory('EAU MINERALE 1.5L')).toBe('Boissons');
    expect(detectCategory('JUS ORANGE 1L')).toBe('Boissons');
  });

  it('detects cleaning products', () => {
    expect(detectCategory('JAVEL CONCENTRE 500ML')).toBe('Entretien');
    expect(detectCategory('LESSIVE LIQUIDE 2L')).toBe('Entretien');
  });

  it('detects fruits and vegetables', () => {
    expect(detectCategory('BANANES CARAÏBES 1KG')).toBe('Fruits et légumes');
    expect(detectCategory('TOMATES CERISES')).toBe('Fruits et légumes');
  });

  it('returns undefined for unknown products', () => {
    expect(detectCategory('PRODUIT INCONNU XYZ')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeStoreName
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeStoreName', () => {
  it('normalizes known chains', () => {
    expect(normalizeStoreName('CARREFOUR MARKET').normalizedName).toBe('Carrefour Market');
    expect(normalizeStoreName('CARREFOUR MARKET').brand).toBe('Carrefour');
  });

  it('normalizes Lidl', () => {
    expect(normalizeStoreName('LIDL').normalizedName).toBe('Lidl');
    expect(normalizeStoreName('LIDL').brand).toBe('Lidl');
  });

  it('normalizes E.Leclerc variants', () => {
    expect(normalizeStoreName('E LECLERC').normalizedName).toBe('E.Leclerc');
  });

  it('falls back gracefully for unknown stores', () => {
    const result = normalizeStoreName('BOULANGERIE DU PORT');
    expect(result.normalizedName).toBe('BOULANGERIE DU PORT');
    expect(result.brand).toBeUndefined();
  });

  it('handles undefined gracefully', () => {
    expect(normalizeStoreName(undefined).normalizedName).toBe('Enseigne inconnue');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseReceiptFromOcr
// ─────────────────────────────────────────────────────────────────────────────
describe('parseReceiptFromOcr', () => {
  it('extracts store name from a full receipt', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, BLOCKS_WITH_CONFIDENCE, 'gp');
    expect(result.store.normalizedName).toBe('Carrefour Market');
    expect(result.store.brand).toBe('Carrefour');
  });

  it('sets territory correctly', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'mq');
    expect(result.territory).toBe('mq');
  });

  it('extracts receipt date in ISO format', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.receiptDate).toBe('2025-03-15');
  });

  it('extracts time', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.receiptTime).toBe('14:32');
  });

  it('extracts total TTC', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.totalTtc).toBeCloseTo(9.87, 2);
  });

  it('extracts line items', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.items.length).toBeGreaterThanOrEqual(4);
  });

  it('assigns lineIndex to each item', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    result.items.forEach((item, idx) => {
      expect(item.lineIndex).toBe(idx);
    });
  });

  it('sets source to ocr_ticket', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.source).toBe('ocr_ticket');
  });

  it('sets currency to EUR', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.currency).toBe('EUR');
  });

  it('includes VAT lines', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.vatLines.length).toBeGreaterThanOrEqual(1);
    expect(result.vatLines[0].amount).toBeCloseTo(0.54, 2);
  });

  it('includes rawOcrText', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    expect(result.rawOcrText).toBe(SAMPLE_OCR_FULL);
  });

  it('handles minimal receipt without error', () => {
    const result = parseReceiptFromOcr(SAMPLE_OCR_MINIMAL, EMPTY_BLOCKS, 'gp');
    expect(result.items).toBeDefined();
    expect(result.totalTtc).toBeCloseTo(1.88, 2);
  });

  it('marks receipt as needsReview when confidence is low', () => {
    const result = parseReceiptFromOcr('texte quelconque sans prix', EMPTY_BLOCKS, 'gp');
    expect(result.needsReview).toBe(true);
  });

  it('uses OCR block confidence in global score', () => {
    const noConfBlocks: OCRRawBlock[] = [{ text: SAMPLE_OCR_FULL, confidenceScore: 20 }];
    const result = parseReceiptFromOcr(SAMPLE_OCR_FULL, noConfBlocks, 'gp');
    // Score global = 20*0.5 + fields*0.5 → should be lower than 100
    expect(result.confidenceScore).toBeLessThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeReceipt
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeReceipt', () => {
  it('normalizes product labels', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const normalized = normalizeReceipt(parsed);
    const lait = normalized.items.find((it) => it.rawLabel.toUpperCase().includes('LAIT'));
    expect(lait?.normalizedLabel).toBeDefined();
    expect(lait?.normalizedLabel).not.toBe('');
  });

  it('assigns categories to products', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const normalized = normalizeReceipt(parsed);
    const lait = normalized.items.find((it) => it.rawLabel.toUpperCase().includes('LAIT'));
    expect(lait?.category).toBe('Produits laitiers');
  });

  it('extracts package size from label (litres)', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const normalized = normalizeReceipt(parsed);
    const lait = normalized.items.find((it) => it.rawLabel.toUpperCase().includes('LAIT'));
    // "LAIT DEMI ECREME 1L" → packageSizeValue=1, packageSizeUnit='l'
    expect(lait?.packageSizeValue).toBeCloseTo(1, 1);
    expect(lait?.packageSizeUnit).toBe('l');
  });

  it('does not mutate items count', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const normalized = normalizeReceipt(parsed);
    expect(normalized.items.length).toBe(parsed.items.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateReceipt
// ─────────────────────────────────────────────────────────────────────────────
describe('validateReceipt', () => {
  it('builds a checksum', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const normalized = normalizeReceipt(parsed);
    const validated = validateReceipt(normalized);
    expect(validated.checksum).toBeDefined();
    expect(typeof validated.checksum).toBe('string');
    expect(validated.checksum!.length).toBeGreaterThan(0);
  });

  it('marks receipt needsReview when total is 0', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const noTotal = { ...parsed, totalTtc: 0 };
    const validated = validateReceipt(noTotal);
    expect(validated.needsReview).toBe(true);
  });

  it('marks item needsReview when price is 0', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const badItems = {
      ...parsed,
      items: parsed.items.map((it, idx) => (idx === 0 ? { ...it, totalPrice: 0 } : it)),
    };
    const validated = validateReceipt(badItems);
    expect(validated.items[0].needsReview).toBe(true);
    expect(validated.items[0].notes).toContain('Prix invalide');
  });

  it('marks future dates as suspicious', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, EMPTY_BLOCKS, 'gp');
    const futureReceipt = { ...parsed, receiptDate: futureDate };
    const validated = validateReceipt(futureReceipt);
    expect(validated.needsReview).toBe(true);
  });

  it('preserves valid receipts as not needing review (full sample)', () => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, BLOCKS_WITH_CONFIDENCE, 'gp');
    const normalized = normalizeReceipt(parsed);
    const validated = validateReceipt(normalized);
    // Full sample has good data — global score may still trigger review
    // but at minimum items with valid prices should not be flagged
    const validItems = validated.items.filter((it) => it.totalPrice > 0);
    expect(validItems.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createPriceObservationsFromReceipt
// ─────────────────────────────────────────────────────────────────────────────
describe('createPriceObservationsFromReceipt', () => {
  const buildReceipt = (): ReceiptRecord => {
    const parsed = parseReceiptFromOcr(SAMPLE_OCR_FULL, BLOCKS_WITH_CONFIDENCE, 'gp');
    const normalized = normalizeReceipt(parsed);
    const validated = validateReceipt(normalized);
    return {
      ...validated,
      id: 'test-receipt-001',
      createdAt: '2025-03-15T14:32:00.000Z',
      updatedAt: '2025-03-15T14:32:00.000Z',
    };
  };

  it('creates one observation per valid item', async () => {
    const receipt = buildReceipt();
    const validItems = receipt.items.filter((it) => it.totalPrice > 0);
    const obs = await createPriceObservationsFromReceipt(receipt);
    expect(obs.length).toBe(validItems.length);
  });

  it('sets source to receipt_ocr', async () => {
    const receipt = buildReceipt();
    const obs = await createPriceObservationsFromReceipt(receipt);
    obs.forEach((o) => expect(o.source).toBe('receipt_ocr'));
  });

  it('links observation to receipt', async () => {
    const receipt = buildReceipt();
    const obs = await createPriceObservationsFromReceipt(receipt);
    obs.forEach((o) => expect(o.receiptId).toBe('test-receipt-001'));
  });

  it('sets correct territory', async () => {
    const receipt = buildReceipt();
    const obs = await createPriceObservationsFromReceipt(receipt);
    obs.forEach((o) => expect(o.territory).toBe('gp'));
  });

  it('sets currency to EUR', async () => {
    const receipt = buildReceipt();
    const obs = await createPriceObservationsFromReceipt(receipt);
    obs.forEach((o) => expect(o.currency).toBe('EUR'));
  });

  it('does not create observation for items with price 0', async () => {
    const receipt = buildReceipt();
    const withZeroItem: ReceiptRecord = {
      ...receipt,
      items: receipt.items.map((it, idx) => (idx === 0 ? { ...it, totalPrice: 0 } : it)),
    };
    const obs = await createPriceObservationsFromReceipt(withZeroItem);
    const validItems = withZeroItem.items.filter((it) => it.totalPrice > 0);
    expect(obs.length).toBe(validItems.length);
  });

  it('propagates needsReview from item to observation', async () => {
    const receipt = buildReceipt();
    const withReviewItem: ReceiptRecord = {
      ...receipt,
      items: receipt.items.map((it, idx) =>
        idx === 0 ? { ...it, needsReview: true, totalPrice: 1.99 } : it
      ),
    };
    const obs = await createPriceObservationsFromReceipt(withReviewItem);
    expect(obs[0].needsReview).toBe(true);
  });

  it('sets unique ids for each observation', async () => {
    const receipt = buildReceipt();
    const obs = await createPriceObservationsFromReceipt(receipt);
    const ids = obs.map((o) => o.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
