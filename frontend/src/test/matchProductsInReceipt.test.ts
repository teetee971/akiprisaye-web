/**
 * Unit tests for matchProductsInReceipt (receiptOcrPipeline)
 *
 * Couverture:
 * - Priorité EAN > nom
 * - Seuil de longueur (< 4 chars → pas de match)
 * - Seuil de termes (< 2 termes → pas de match)
 * - Nom discriminant → match
 * - Cache intra-appel (même label = même résultat)
 */
import { describe, it, expect } from 'vitest';
import { matchProductsInReceipt } from '../services/receiptOcrPipeline';
import type { ReceiptItem, ReceiptRecord } from '../types/receipt';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ReceiptItem> & { rawLabel: string }): ReceiptItem {
  return {
    lineIndex: 0,
    rawLabel: overrides.rawLabel,
    normalizedLabel: overrides.normalizedLabel ?? overrides.rawLabel,
    barcode: overrides.barcode ?? null,
    productMatchId: null,
    confidenceScore: 80,
    needsReview: false,
    totalPrice: 1.99,
    ...overrides,
  };
}

function makeReceipt(
  items: ReceiptItem[]
): Omit<ReceiptRecord, 'id' | 'createdAt' | 'updatedAt' | 'checksum'> {
  return {
    source: 'ocr_ticket',
    territory: 'gp',
    store: { normalizedName: 'Super U Test', territory: 'gp' },
    receiptDate: '2026-01-01',
    currency: 'EUR',
    totalTtc: items.reduce((s, i) => s + i.totalPrice, 0),
    vatLines: [],
    items,
    rawOcrText: '',
    confidenceScore: 80,
    needsReview: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('matchProductsInReceipt — EAN priority', () => {
  it('resolves via EAN when barcode matches a known product', () => {
    // Coca-Cola 2L EAN from SEED_PRODUCTS
    const item = makeItem({ rawLabel: 'BLABLA INCONNU', barcode: '5449000000996' });
    const result = matchProductsInReceipt(makeReceipt([item]));
    expect(result.items[0].productMatchId).toBe('5449000000996');
  });

  it('falls back to name search when EAN not found', () => {
    const item = makeItem({ rawLabel: 'Coca Cola 2L', barcode: '0000000000000' });
    const result = matchProductsInReceipt(makeReceipt([item]));
    // EAN unknown → name search finds Coca-Cola 2L
    expect(result.items[0].productMatchId).toBeTruthy();
  });
});

describe('matchProductsInReceipt — name matching thresholds', () => {
  it('returns null when label is shorter than 4 characters', () => {
    const item = makeItem({ rawLabel: 'LT' });
    const result = matchProductsInReceipt(makeReceipt([item]));
    expect(result.items[0].productMatchId).toBeNull();
  });

  it('returns null when label has fewer than 2 terms', () => {
    // Single term, even if longer than 4 chars
    const item = makeItem({ rawLabel: 'Sucre' });
    const result = matchProductsInReceipt(makeReceipt([item]));
    expect(result.items[0].productMatchId).toBeNull();
  });

  it('matches a product when label has ≥ 4 chars and ≥ 2 terms', () => {
    const item = makeItem({ rawLabel: 'Coca Cola' });
    const result = matchProductsInReceipt(makeReceipt([item]));
    expect(result.items[0].productMatchId).toBeTruthy();
  });

  it('returns null when label does not match any product', () => {
    const item = makeItem({ rawLabel: 'Produit Introuvable Inexistant ZZZZ' });
    const result = matchProductsInReceipt(makeReceipt([item]));
    expect(result.items[0].productMatchId).toBeNull();
  });
});

describe('matchProductsInReceipt — per-call cache', () => {
  it('resolves identical labels to the same productMatchId', () => {
    const items = [
      makeItem({ rawLabel: 'Coca Cola', lineIndex: 0 }),
      makeItem({ rawLabel: 'Coca Cola', lineIndex: 1 }),
    ];
    const result = matchProductsInReceipt(makeReceipt(items));
    expect(result.items[0].productMatchId).toBe(result.items[1].productMatchId);
    expect(result.items[0].productMatchId).toBeTruthy();
  });

  it('resolves different labels independently', () => {
    const items = [
      makeItem({ rawLabel: 'Coca Cola', lineIndex: 0 }),
      makeItem({ rawLabel: 'Produit Introuvable Inexistant ZZZZ', lineIndex: 1 }),
    ];
    const result = matchProductsInReceipt(makeReceipt(items));
    expect(result.items[0].productMatchId).toBeTruthy();
    expect(result.items[1].productMatchId).toBeNull();
  });
});

describe('matchProductsInReceipt — no mutation of input', () => {
  it('does not mutate the original receipt object', () => {
    const item = makeItem({ rawLabel: 'Coca Cola' });
    const receipt = makeReceipt([item]);
    const originalMatchId = receipt.items[0].productMatchId;
    matchProductsInReceipt(receipt);
    expect(receipt.items[0].productMatchId).toBe(originalMatchId);
  });
});
