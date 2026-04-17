/**
 * Tests — seoContentEngine utility
 *
 * Validates determinism, value ranges and shape of generated content.
 */

import { describe, it, expect } from 'vitest';
import {
  getPageAngle,
  generatePageIntro,
  generatePriceTip,
  generateFaqItems,
  getSimilarProductSlugs,
} from '../utils/seoContentEngine';

// ── getPageAngle ──────────────────────────────────────────────────────────────

describe('getPageAngle', () => {
  it('returns a value between 0 and 4 inclusive', () => {
    const samples = [
      'coca-cola-1-5l-guadeloupe',
      'riz-basmati-1kg-martinique',
      'nutella-400g-reunion',
      '',
    ];
    for (const slug of samples) {
      const angle = getPageAngle(slug);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThanOrEqual(4);
    }
  });

  it('is deterministic — same slug always produces same angle', () => {
    const slug = 'coca-cola-1-5l-guadeloupe';
    expect(getPageAngle(slug)).toBe(getPageAngle(slug));
  });

  it('different slugs can produce different angles', () => {
    const angles = new Set<number>();
    const slugs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'ab', 'ac'];
    for (const s of slugs) angles.add(getPageAngle(s));
    expect(angles.size).toBeGreaterThan(1);
  });
});

// ── generatePageIntro ──────────────────────────────────────────────────────────

describe('generatePageIntro', () => {
  it('returns a non-empty string', () => {
    const result = generatePageIntro('Coca-Cola 1,5L', 'GP', 0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(20);
  });

  it('includes the product name', () => {
    const result = generatePageIntro('Nutella 400g', 'MQ', 1);
    expect(result).toContain('Nutella 400g');
  });

  it('handles all 5 angles without throwing', () => {
    for (let angle = 0; angle < 5; angle++) {
      expect(() => generatePageIntro('Test Product', 'GP', angle)).not.toThrow();
    }
  });

  it('handles unknown territory gracefully', () => {
    const result = generatePageIntro('Test', 'ZZ', 0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── generatePriceTip ──────────────────────────────────────────────────────────

describe('generatePriceTip', () => {
  it('returns a non-empty string', () => {
    const result = generatePriceTip('Eau Évian 1,5L', 'RE', 2);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  it('is deterministic for same inputs', () => {
    const a = generatePriceTip('Lait Entier 1L', 'GP', 3);
    const b = generatePriceTip('Lait Entier 1L', 'GP', 3);
    expect(a).toBe(b);
  });
});

// ── generateFaqItems ──────────────────────────────────────────────────────────

describe('generateFaqItems', () => {
  it('returns exactly 3 FAQ items', () => {
    const items = generateFaqItems('Riz Basmati 1kg', 'GP', 0);
    expect(items).toHaveLength(3);
  });

  it('each item has a non-empty q and a', () => {
    const items = generateFaqItems('Panzani 500g', 'MQ', 1);
    for (const item of items) {
      expect(typeof item.q).toBe('string');
      expect(item.q.length).toBeGreaterThan(5);
      expect(typeof item.a).toBe('string');
      expect(item.a.length).toBeGreaterThan(10);
    }
  });

  it('is deterministic for same inputs', () => {
    const a = generateFaqItems('Coca-Cola 1,5L', 'GP', 2);
    const b = generateFaqItems('Coca-Cola 1,5L', 'GP', 2);
    expect(a).toEqual(b);
  });

  it('handles all 5 angles', () => {
    for (let angle = 0; angle < 5; angle++) {
      const items = generateFaqItems('Test', 'GP', angle);
      expect(items).toHaveLength(3);
    }
  });
});

// ── getSimilarProductSlugs ────────────────────────────────────────────────────

describe('getSimilarProductSlugs', () => {
  it('returns exactly 5 slugs', () => {
    const slugs = getSimilarProductSlugs('coca-cola-1-5l', 'boissons', 'GP');
    expect(slugs).toHaveLength(5);
  });

  it('does not include the input product slug in results', () => {
    const productSlug = 'coca-cola-1-5l';
    const slugs = getSimilarProductSlugs(productSlug, 'boissons', 'GP');
    for (const s of slugs) {
      expect(s).not.toBe(`${productSlug}-guadeloupe`);
      expect(s.startsWith(productSlug)).toBe(false);
    }
  });

  it('returns slugs with territory suffix', () => {
    const slugs = getSimilarProductSlugs('riz-basmati-1kg', 'epicerie', 'MQ');
    for (const slug of slugs) {
      expect(slug.endsWith('-martinique')).toBe(true);
    }
  });

  it('is deterministic — same input produces same output', () => {
    const a = getSimilarProductSlugs('nutella-400g', 'epicerie', 'RE');
    const b = getSimilarProductSlugs('nutella-400g', 'epicerie', 'RE');
    expect(a).toEqual(b);
  });

  it('works for unknown category', () => {
    const slugs = getSimilarProductSlugs('unknown-product', 'unknown-cat', 'GP');
    expect(slugs).toHaveLength(5);
  });
});
