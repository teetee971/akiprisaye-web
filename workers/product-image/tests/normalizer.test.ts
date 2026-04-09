import { describe, expect, it } from 'vitest';
import { normalizeQuery, STORE_SUFFIXES } from '../src/normalizer';

describe('normalizeQuery', () => {
  it('lowercases and trims input', () => {
    expect(normalizeQuery('  SUCRE BLANC  ')).toBe('sucre blanc');
  });

  it('strips diacritics', () => {
    expect(normalizeQuery('crème fraîche')).toBe('creme fraiche');
    expect(normalizeQuery('épinards')).toBe('epinards');
    expect(normalizeQuery('côtelettes')).toBe('cotelettes');
  });

  it('removes punctuation', () => {
    expect(normalizeQuery('sucre, blanc!')).toBe('sucre blanc');
    expect(normalizeQuery('lait 1/2 écrémé')).toBe('lait 1 2 ecreme');
  });

  it('preserves quantity expressions', () => {
    expect(normalizeQuery('lait 1l')).toBe('lait 1l');
    expect(normalizeQuery('sucre 500g')).toBe('sucre 500g');
    expect(normalizeQuery('huile 1.5l')).toBe('huile 1.5l');
    expect(normalizeQuery('fromage 250g')).toBe('fromage 250g');
    expect(normalizeQuery('jus 1kg')).toBe('jus 1kg');
  });

  it('removes store suffixes', () => {
    expect(normalizeQuery('sucre blanc crf')).toBe('sucre blanc');
    expect(normalizeQuery('sucre blanc carrefour')).toBe('sucre blanc');
    expect(normalizeQuery('lait super u 1l')).toBe('lait 1l');
    expect(normalizeQuery('beurre leader price 250g')).toBe('beurre 250g');
    expect(normalizeQuery('yaourt intermarche nature')).toBe('yaourt nature');
    expect(normalizeQuery('café leclerc 250g')).toBe('cafe 250g');
    expect(normalizeQuery('fromage lidl 200g')).toBe('fromage 200g');
    expect(normalizeQuery('biere aldi 50cl')).toBe('biere 50cl');
  });

  it('collapses extra spaces after removal', () => {
    expect(normalizeQuery('sucre  blanc   1kg')).toBe('sucre blanc 1kg');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeQuery('')).toBe('');
    expect(normalizeQuery('   ')).toBe('');
  });

  it('handles typical Antillean receipt labels', () => {
    expect(normalizeQuery('SUCRE MARIE GALANTE 1KG')).toBe('sucre marie galante 1kg');
    expect(normalizeQuery('JUS ANANAS 1L CRF')).toBe('jus ananas 1l');
    expect(normalizeQuery('RIZ LONG GRAIN 5KG LEADER PRICE')).toBe('riz long grain 5kg');
  });

  it('handles multi-word store names correctly', () => {
    expect(normalizeQuery('pâtes super u 500g')).toBe('pates 500g');
    expect(normalizeQuery('pain hyper u complet')).toBe('pain complet');
  });

  it('exposes STORE_SUFFIXES as a non-empty array', () => {
    expect(Array.isArray(STORE_SUFFIXES)).toBe(true);
    expect(STORE_SUFFIXES.length).toBeGreaterThan(0);
    expect(STORE_SUFFIXES).toContain('carrefour');
    expect(STORE_SUFFIXES).toContain('leclerc');
  });
});
