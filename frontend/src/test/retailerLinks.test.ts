/**
 * Tests — retailerLinks utility
 *
 * Validates buildRetailerUrl(), getRetailerBaseUrl(), and knownRetailers().
 */

import { describe, it, expect } from 'vitest';
import { buildRetailerUrl, getRetailerBaseUrl, knownRetailers } from '../utils/retailerLinks';

describe('getRetailerBaseUrl', () => {
  it('returns a URL for known retailers', () => {
    expect(getRetailerBaseUrl('Carrefour')).toBe('https://www.carrefour.fr/');
    expect(getRetailerBaseUrl('E.Leclerc')).toBe('https://www.e.leclerc/');
    expect(getRetailerBaseUrl('Leader Price')).toBe('https://www.leaderprice.fr/');
    expect(getRetailerBaseUrl('Intermarché')).toBe('https://www.intermarche.com/');
    expect(getRetailerBaseUrl('Super U')).toBe('https://www.courses.super-u.fr/');
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
