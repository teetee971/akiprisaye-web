import { describe, it, expect } from 'vitest';
import { normalizeTerritoryCode } from '../normalizeTerritoryCode';

describe('normalizeTerritoryCode', () => {
  it('normalizes standard territory codes', () => {
    expect(normalizeTerritoryCode('gp')).toBe('GP');
    expect(normalizeTerritoryCode('GF')).toBe('GF');
    expect(normalizeTerritoryCode('re')).toBe('RE');
  });

  it('normalizes DOM-TOM territory names', () => {
    expect(normalizeTerritoryCode('Guadeloupe')).toBe('GP');
    expect(normalizeTerritoryCode('Martinique')).toBe('MQ');
    expect(normalizeTerritoryCode('Guyane')).toBe('GF');
    expect(normalizeTerritoryCode('La Réunion')).toBe('RE');
    expect(normalizeTerritoryCode('Mayotte')).toBe('YT');
    expect(normalizeTerritoryCode('France métropole')).toBe('FR');
    expect(normalizeTerritoryCode('Saint-Pierre-et-Miquelon')).toBe('PM');
    expect(normalizeTerritoryCode('Saint-Barthélemy')).toBe('BL');
    expect(normalizeTerritoryCode('Saint-Martin')).toBe('MF');
    expect(normalizeTerritoryCode('Wallis-et-Futuna')).toBe('WF');
    expect(normalizeTerritoryCode('Polynésie française')).toBe('PF');
    expect(normalizeTerritoryCode('Nouvelle-Calédonie')).toBe('NC');
  });

  it('defaults to FR for missing or unknown values', () => {
    expect(normalizeTerritoryCode()).toBe('FR');
    expect(normalizeTerritoryCode('')).toBe('FR');
    expect(normalizeTerritoryCode('Unknown')).toBe('FR');
  });
});
