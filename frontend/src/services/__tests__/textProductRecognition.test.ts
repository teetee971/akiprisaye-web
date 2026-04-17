/**
 * Text Product Recognition Service Tests
 * Part of PR D - Text-based Product Recognition
 *
 * Node-safe tests only (no OCR, no browser APIs)
 */

import { describe, it, expect } from 'vitest';
import { extractProductHints, fuzzySearchProducts } from '../textProductRecognition';

describe('extractProductHints', () => {
  it('should extract volume information', () => {
    const hints = extractProductHints('EVIAN 1.5L');
    expect(hints.volume).toBe('1.5L');
  });

  it('should extract volume in different units', () => {
    expect(extractProductHints('Coca 330ML').volume).toBe('330ML');
    expect(extractProductHints('Riz 1KG').volume).toBe('1KG');
    expect(extractProductHints('Sucre 500G').volume).toBe('500G');
    expect(extractProductHints('Jus 2L').volume).toBe('2L');
  });

  it('should extract price information', () => {
    const hints = extractProductHints('NUTELLA 5.99€');
    expect(hints.price).toBe('5.99€');
  });

  it('should extract price with comma separator', () => {
    expect(extractProductHints('Lait 1,20€').price).toBe('1,20€');
  });

  it('should extract keywords (words > 3 chars)', () => {
    const hints = extractProductHints('NUTELLA PATE A TARTINER 750G');
    expect(hints.keywords).toContain('NUTELLA');
    expect(hints.keywords).toContain('PATE');
    expect(hints.keywords).toContain('TARTINER');
    expect(hints.keywords).toContain('750G');
  });

  it('should filter out short words', () => {
    const hints = extractProductHints('EAU DE SOURCE 1L');
    expect(hints.keywords).not.toContain('DE');
    expect(hints.keywords).toContain('SOURCE');
  });

  it('should limit keywords to 10', () => {
    const longText = 'ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN TWELVE';
    const hints = extractProductHints(longText);
    expect(hints.keywords.length).toBeLessThanOrEqual(10);
  });

  it('should include normalized raw text', () => {
    const hints = extractProductHints('Nutella 750g - 5.99€');
    expect(hints.raw).toBe('NUTELLA 750G 5.99€');
  });

  it('should handle text without volume or price', () => {
    const hints = extractProductHints('PAIN DE MIE');
    expect(hints.volume).toBeUndefined();
    expect(hints.price).toBeUndefined();
    expect(hints.keywords).toContain('PAIN');
  });

  it('should handle empty text', () => {
    const hints = extractProductHints('');
    expect(hints.raw).toBe('');
    expect(hints.keywords).toEqual([]);
    expect(hints.volume).toBeUndefined();
    expect(hints.price).toBeUndefined();
  });

  it('should extract from OCR-like text', () => {
    const ocrText = `
      NUTELLA
      Pâte à tartiner
      750g
      Prix: 5.99€
    `;
    const hints = extractProductHints(ocrText);
    expect(hints.keywords).toContain('NUTELLA');
    expect(hints.volume).toBe('750G');
    expect(hints.price).toBe('5.99€');
  });
});

describe('fuzzySearchProducts', () => {
  const mockCatalog = [
    { label: 'Nutella 750g' },
    { label: 'Riz Basmati 1kg' },
    { label: 'Lait UHT Demi-écrémé 1L' },
    { label: 'Eau Evian 1.5L' },
    { label: 'Coca-Cola 330ml' },
  ];

  it('should find exact matches with high score', () => {
    const results = fuzzySearchProducts(['NUTELLA'], mockCatalog);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('Nutella 750g');
    expect(results[0].score).toBeGreaterThan(0.5);
  });

  it('should find partial matches', () => {
    const results = fuzzySearchProducts(['RIZ'], mockCatalog);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('Riz Basmati 1kg');
  });

  it('should combine multiple keywords', () => {
    const results = fuzzySearchProducts(['LAIT', 'UHT'], mockCatalog);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('Lait UHT Demi-écrémé 1L');
  });

  it('should return empty array for no matches', () => {
    const results = fuzzySearchProducts(['NONEXISTENT', 'PRODUCT'], mockCatalog);
    expect(results).toEqual([]);
  });

  it('should handle empty keywords', () => {
    const results = fuzzySearchProducts([], mockCatalog);
    expect(results).toEqual([]);
  });

  it('should return scores between 0 and 1', () => {
    const results = fuzzySearchProducts(['NUTELLA'], mockCatalog);
    results.forEach((result) => {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  it('should sort results by relevance (highest score first)', () => {
    const results = fuzzySearchProducts(['EAU'], mockCatalog);
    if (results.length > 1) {
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    }
  });

  it('should handle empty catalog', () => {
    const results = fuzzySearchProducts(['NUTELLA'], []);
    expect(results).toEqual([]);
  });

  it('should be case-insensitive through fuzzy matching', () => {
    const results1 = fuzzySearchProducts(['NUTELLA'], mockCatalog);
    const results2 = fuzzySearchProducts(['nutella'], mockCatalog);
    expect(results1.length).toBeGreaterThan(0);
    expect(results2.length).toBeGreaterThan(0);
  });

  it('should handle special characters in search', () => {
    const catalogWithSpecial = [{ label: 'Coca-Cola 330ml' }, { label: "Lay's Chips" }];
    const results = fuzzySearchProducts(['COCA', 'COLA'], catalogWithSpecial);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should respect fuzzy threshold', () => {
    // With threshold 0.4, very different words should not match
    const results = fuzzySearchProducts(['ABCDEFGHIJK'], mockCatalog);
    expect(results.length).toBe(0);
  });
});

describe('Integration: extractProductHints + fuzzySearchProducts', () => {
  const mockCatalog = [
    { label: 'Nutella 750g' },
    { label: 'Riz Basmati 1kg' },
    { label: 'Lait UHT Demi-écrémé 1L' },
  ];

  it('should extract hints and find products', () => {
    const ocrText = 'NUTELLA 750G';
    const hints = extractProductHints(ocrText);
    const results = fuzzySearchProducts(hints.keywords, mockCatalog);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('Nutella 750g');
  });

  it('should handle partial OCR text', () => {
    const ocrText = 'RIZ BASMA 1KG';
    const hints = extractProductHints(ocrText);
    const results = fuzzySearchProducts(hints.keywords, mockCatalog);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('Riz Basmati 1kg');
  });

  it('should provide confidence scores for user validation', () => {
    const ocrText = 'LAIT UHT';
    const hints = extractProductHints(ocrText);
    const results = fuzzySearchProducts(hints.keywords, mockCatalog);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
    // User should see this score to validate
  });
});
