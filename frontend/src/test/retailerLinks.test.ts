/**
 * Tests — retailerLinks utility
 *
 * Validates buildRetailerUrl(), getRetailerBaseUrl(), and knownRetailers().
 */

import { describe, it, expect } from 'vitest';
import {
  buildRetailerUrl,
  getRetailerBaseUrl,
  knownRetailers,
  safeRetailerUrl,
  isValidRetailerUrl,
} from '../utils/retailerLinks';

describe('getRetailerBaseUrl', () => {
  it('returns a URL for known retailers', () => {
    expect(getRetailerBaseUrl('Carrefour')).toBe('https://www.carrefour.fr/');
    expect(getRetailerBaseUrl('E.Leclerc')).toBe('https://www.e.leclerc/');
    expect(getRetailerBaseUrl('Leader Price')).toBe('https://www.leaderprice.fr/');
    expect(getRetailerBaseUrl('Intermarché')).toBe('https://www.intermarche.com/');
    expect(getRetailerBaseUrl('Super U')).toBe('https://www.coursesu.com/');
  });

  it('returns null for unknown retailer', () => {
    expect(getRetailerBaseUrl('Enseigne inconnue')).toBeNull();
    expect(getRetailerBaseUrl('')).toBeNull();
  });
});

describe('buildRetailerUrl', () => {
  it('returns a UTM-enriched URL for known retailers', () => {
    const url = buildRetailerUrl('Carrefour');
    expect(url).not.toBeNull();
    expect(url).toContain('utm_source=akiprisaye');
    expect(url).toContain('utm_campaign=comparateur-prix');
    expect(url).toContain('utm_medium=prix-comparateur');
  });

  it('returns null for unknown retailer', () => {
    expect(buildRetailerUrl('Enseigne inconnue')).toBeNull();
  });

  it('includes a barcode deep-link for Carrefour', () => {
    const url = buildRetailerUrl('Carrefour', '3017620422003');
    expect(url).toContain('recherche');
    expect(url).toContain('3017620422003');
  });

  it('includes a barcode deep-link for E.Leclerc', () => {
    const url = buildRetailerUrl('E.Leclerc', '5449000000996');
    expect(url).toContain('5449000000996');
  });

  it('includes a barcode deep-link for Intermarché', () => {
    const url = buildRetailerUrl('Intermarché', '7610400071680');
    expect(url).toContain('7610400071680');
  });

  it('returns a basic URL for Lidl (no deep-link support)', () => {
    const url = buildRetailerUrl('Lidl', '3017620422003');
    expect(url).not.toBeNull();
    expect(url).toContain('lidl.fr');
    expect(url).toContain('utm_source=akiprisaye');
  });
});

describe('knownRetailers', () => {
  it('returns a non-empty array', () => {
    expect(knownRetailers().length).toBeGreaterThan(5);
  });

  it('includes major French retailers', () => {
    const known = knownRetailers();
    expect(known).toContain('Carrefour');
    expect(known).toContain('E.Leclerc');
    expect(known).toContain('Leader Price');
    expect(known).toContain('Intermarché');
  });
});

describe('safeRetailerUrl', () => {
  it('passes through valid known retailer URLs unchanged', () => {
    expect(safeRetailerUrl('https://www.carrefour.fr/')).toBe('https://www.carrefour.fr/');
    expect(safeRetailerUrl('https://www.e.leclerc/')).toBe('https://www.e.leclerc/');
    expect(safeRetailerUrl('https://www.coursesu.com/')).toBe('https://www.coursesu.com/');
    expect(safeRetailerUrl('https://www.leaderprice.fr/')).toBe('https://www.leaderprice.fr/');
    expect(safeRetailerUrl('https://www.intermarche.com/')).toBe('https://www.intermarche.com/');
  });

  it('passes through UTM-enriched retailer URLs unchanged', () => {
    const url = buildRetailerUrl('E.Leclerc') as string;
    expect(safeRetailerUrl(url)).toBe(url);
  });

  it('returns /comparateur for an unknown external domain', () => {
    expect(safeRetailerUrl('https://www.example.com/produit')).toBe('/comparateur');
    expect(safeRetailerUrl('https://www.totally-wrong-site.fr/')).toBe('/comparateur');
  });

  it('returns /comparateur for null or undefined', () => {
    expect(safeRetailerUrl(null)).toBe('/comparateur');
    expect(safeRetailerUrl(undefined)).toBe('/comparateur');
  });

  it('returns /comparateur for empty string', () => {
    expect(safeRetailerUrl('')).toBe('/comparateur');
  });

  it('returns /comparateur for an unparseable URL', () => {
    expect(safeRetailerUrl('not-a-url')).toBe('/comparateur');
  });

  it('passes through subdomain URLs on allowed domains', () => {
    expect(safeRetailerUrl('https://drive.carrefour.fr/')).toBe('https://drive.carrefour.fr/');
    expect(safeRetailerUrl('https://www.lidl.fr/c/promotions')).toBe(
      'https://www.lidl.fr/c/promotions'
    );
  });
});

describe('isValidRetailerUrl', () => {
  it('returns true for known retailer domains', () => {
    expect(isValidRetailerUrl('https://www.carrefour.fr/')).toBe(true);
    expect(isValidRetailerUrl('https://www.e.leclerc/')).toBe(true);
    expect(isValidRetailerUrl('https://www.coursesu.com/')).toBe(true);
    expect(isValidRetailerUrl('https://www.leaderprice.fr/')).toBe(true);
    expect(isValidRetailerUrl('https://www.aldi.fr/')).toBe(true);
  });

  it('returns false for unknown / off-allowlist domains', () => {
    expect(isValidRetailerUrl('https://www.example.com/')).toBe(false);
    expect(isValidRetailerUrl('https://www.amazon.fr/')).toBe(false);
    expect(isValidRetailerUrl('https://chars-militaires.fr/')).toBe(false);
  });

  it('returns false for null, undefined, and empty string', () => {
    expect(isValidRetailerUrl(null)).toBe(false);
    expect(isValidRetailerUrl(undefined)).toBe(false);
    expect(isValidRetailerUrl('')).toBe(false);
  });

  it('returns false for unparseable URLs', () => {
    expect(isValidRetailerUrl('not-a-url')).toBe(false);
    expect(isValidRetailerUrl('//no-scheme')).toBe(false);
  });

  it('returns true for subdomains of allowed domains', () => {
    expect(isValidRetailerUrl('https://drive.carrefour.fr/')).toBe(true);
    expect(isValidRetailerUrl('https://www.lidl.fr/promotions')).toBe(true);
  });

  it('mirrors safeRetailerUrl logic — valid URLs are not rewritten', () => {
    const url = 'https://www.e.leclerc/?utm_source=akiprisaye';
    expect(isValidRetailerUrl(url)).toBe(true);
    expect(safeRetailerUrl(url)).toBe(url);
  });

  it('mirrors safeRetailerUrl logic — invalid URLs both reject', () => {
    const url = 'https://www.exemple-inconnu.com/';
    expect(isValidRetailerUrl(url)).toBe(false);
    expect(safeRetailerUrl(url)).toBe('/comparateur');
  });
});
