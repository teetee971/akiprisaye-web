/**
 * Tests for scanHubClassifier — text classification and extraction
 */
import { describe, it, expect } from 'vitest';
import {
  classifyScanText,
  extractPrices,
  extractAdditives,
  estimateNovaIndex,
  estimateNutriScore,
  extractReceiptData,
  getScanHubTypeLabel,
} from '../services/scanHubClassifier';

// ---------------------------------------------------------------------------
// classifyScanText
// ---------------------------------------------------------------------------
describe('classifyScanText', () => {
  it('classifies receipt text correctly', () => {
    const text = 'TOTAL TTC 12,50 € TVA 5.5% CARTE BANCAIRE ticket n°12345';
    const result = classifyScanText(text);
    expect(result.type).toBe('receipt');
    expect(result.confidence).toBeGreaterThan(35);
  });

  it('classifies nutritional table correctly', () => {
    const text = 'Valeurs nutritionnelles pour 100g kcal 350 Matières grasses 12g Glucides 45g Protéines 8g Sel 0,5g';
    const result = classifyScanText(text);
    expect(result.type).toBe('nutrition');
  });

  it('classifies ingredients list correctly', () => {
    const text = 'Ingrédients: farine, sucre, oeufs. Allergènes: gluten. Peut contenir des traces de noix.';
    const result = classifyScanText(text);
    expect(result.type).toBe('ingredients');
  });

  it('classifies shelf label correctly', () => {
    const text = 'Prix au kg : 3,99 €/kg Rayon épicerie lot de 6';
    const result = classifyScanText(text);
    expect(result.type).toBe('shelf_label');
  });

  it('falls back to product for long unclassified text', () => {
    const longText = 'a'.repeat(150);
    const result = classifyScanText(longText);
    expect(result.type).toBe('product');
  });

  it('returns unknown for very short ambiguous text', () => {
    const result = classifyScanText('abc');
    expect(result.type).toBe('unknown');
  });

  it('confidence is always between 35 and 98', () => {
    const texts = [
      'TOTAL TTC ticket caisse TVA rendu monnaie',
      'Ingrédients: eau, sel',
      '',
      'x',
    ];
    for (const t of texts) {
      const { confidence } = classifyScanText(t);
      expect(confidence).toBeGreaterThanOrEqual(35);
      expect(confidence).toBeLessThanOrEqual(98);
    }
  });

  it('populates signals array for detected features', () => {
    const text = 'Ticket caisse Total TTC TVA montant à payer CB';
    const { signals } = classifyScanText(text);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some((s) => s.includes('ticket'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// extractPrices
// ---------------------------------------------------------------------------
describe('extractPrices', () => {
  it('extracts French comma-decimal prices', () => {
    const prices = extractPrices('Pain 1,29 € Lait 0,89 € Total 2,18 €');
    expect(prices).toContain(1.29);
    expect(prices).toContain(0.89);
    expect(prices).toContain(2.18);
  });

  it('extracts dot-decimal prices', () => {
    const prices = extractPrices('Produit 2.99 € Autre 1.49');
    expect(prices).toContain(2.99);
    expect(prices).toContain(1.49);
  });

  it('does not include years as prices', () => {
    const prices = extractPrices('Année 2024 sans prix');
    // 2024 should not appear as a price (bare integer >100 without €)
    expect(prices).not.toContain(2024);
  });

  it('returns empty array for text without prices', () => {
    const prices = extractPrices('Bonjour monde');
    expect(prices).toEqual([]);
  });

  it('extracts integer prices with € symbol', () => {
    const prices = extractPrices('Remise 5 € offerte');
    expect(prices).toContain(5);
  });
});

// ---------------------------------------------------------------------------
// extractAdditives
// ---------------------------------------------------------------------------
describe('extractAdditives', () => {
  it('extracts standard E-numbers', () => {
    const text = 'Contient E100, E330, E471, E1422';
    const additives = extractAdditives(text);
    expect(additives).toContain('E100');
    expect(additives).toContain('E330');
    expect(additives).toContain('E471');
    expect(additives).toContain('E1422');
  });

  it('extracts E-numbers with letter suffix', () => {
    const additives = extractAdditives('Colorant E102a présent');
    expect(additives.some((a) => a.startsWith('E102'))).toBe(true);
  });

  it('deduplicates repeated additives', () => {
    const additives = extractAdditives('E330, E330, E330');
    expect(additives.filter((a) => a === 'E330')).toHaveLength(1);
  });

  it('returns empty array when no additives', () => {
    expect(extractAdditives('Eau, sel, farine')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// estimateNovaIndex
// ---------------------------------------------------------------------------
describe('estimateNovaIndex', () => {
  it('returns NOVA 1 for zero additives', () => {
    expect(estimateNovaIndex(0)).toContain('NOVA 1');
  });

  it('returns NOVA 2-3 for 1-2 additives', () => {
    expect(estimateNovaIndex(1)).toContain('NOVA 2-3');
    expect(estimateNovaIndex(2)).toContain('NOVA 2-3');
  });

  it('returns NOVA 4 for more than 2 additives', () => {
    expect(estimateNovaIndex(3)).toContain('NOVA 4');
    expect(estimateNovaIndex(10)).toContain('NOVA 4');
  });
});

// ---------------------------------------------------------------------------
// estimateNutriScore
// ---------------------------------------------------------------------------
describe('estimateNutriScore', () => {
  it('detects Nutri-Score letter from text', () => {
    expect(estimateNutriScore('Nutri-Score A')).toBe('Nutri-Score A');
    expect(estimateNutriScore('nutri score c')).toBe('Nutri-Score C');
    expect(estimateNutriScore('NutriScore:E')).toBe('Nutri-Score E');
  });

  it('returns non-determined when no score found', () => {
    const result = estimateNutriScore('Aucune information nutritionnelle');
    expect(result).toContain('non déterminé');
  });
});

// ---------------------------------------------------------------------------
// getScanHubTypeLabel
// ---------------------------------------------------------------------------
describe('getScanHubTypeLabel', () => {
  it('returns French labels for all types', () => {
    expect(getScanHubTypeLabel('receipt')).toBe('Ticket de caisse');
    expect(getScanHubTypeLabel('nutrition')).toBe('Tableau nutritionnel');
    expect(getScanHubTypeLabel('ingredients')).toContain('ingrédients');
    expect(getScanHubTypeLabel('unknown')).toBe('Type non identifié');
  });
});

// ---------------------------------------------------------------------------
// extractReceiptData
// ---------------------------------------------------------------------------
describe('extractReceiptData', () => {
  const TICKET = `
INTERMARCHE
15/02/2025  10h45
Ticket N°00123

YAOURT NATURE X4              1,89 €
JUS D'ORANGE 1L               2,35 €
PAIN COMPLET                  1,49 €

TOTAL TTC                     5,73 €
TVA 5.5%                      0,30 €
CB                            5,73 €
`.trim();

  const result = extractReceiptData(TICKET);

  it('extracts store name', () => {
    expect(result.storeName).toContain('INTERMARCHE');
  });

  it('extracts date and time', () => {
    expect(result.date).toBe('15/02/2025');
    expect(result.time).toBe('10:45');
  });

  it('extracts total', () => {
    expect(result.total).toBeCloseTo(5.73, 2);
  });

  it('extracts TVA', () => {
    expect(result.tvaAmount).toBeCloseTo(0.30, 2);
  });

  it('extracts payment method', () => {
    expect(result.paymentMethod?.toLowerCase()).toContain('cb');
  });

  it('priceChecksum.declared equals total', () => {
    expect(result.priceChecksum.declared).toBe(result.total);
  });
});
