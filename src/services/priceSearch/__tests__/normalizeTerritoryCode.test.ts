import { describe, it, expect } from 'vitest';
import { normalizeTerritoryCode } from '../normalizeTerritoryCode';

describe('normalizeTerritoryCode', () => {
  it('normalizes standard territory codes', () => {
    expect(normalizeTerritoryCode('gp')).toBe('gp');
    expect(normalizeTerritoryCode('GF')).toBe('gf');
    expect(normalizeTerritoryCode('re')).toBe('re');
  });

  it('normalizes DOM-TOM territory names', () => {
    expect(normalizeTerritoryCode('Guadeloupe')).toBe('gp');
    expect(normalizeTerritoryCode('Martinique')).toBe('mq');
    expect(normalizeTerritoryCode('Guyane')).toBe('gf');
    expect(normalizeTerritoryCode('La Réunion')).toBe('re');
    expect(normalizeTerritoryCode('Mayotte')).toBe('yt');
    expect(normalizeTerritoryCode('France métropole')).toBe('fr');
    expect(normalizeTerritoryCode('Saint-Pierre-et-Miquelon')).toBe('pm');
    expect(normalizeTerritoryCode('Saint-Barthélemy')).toBe('bl');
    expect(normalizeTerritoryCode('Saint-Martin')).toBe('mf');
    expect(normalizeTerritoryCode('Wallis-et-Futuna')).toBe('wf');
    expect(normalizeTerritoryCode('Polynésie française')).toBe('pf');
    expect(normalizeTerritoryCode('Nouvelle-Calédonie')).toBe('nc');
  });

  it('defaults to FR for missing or unknown values', () => {
    expect(normalizeTerritoryCode()).toBe('fr');
    expect(normalizeTerritoryCode('')).toBe('fr');
    expect(normalizeTerritoryCode('Unknown')).toBe('fr');
  });
});
