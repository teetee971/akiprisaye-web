/**
 * Tests — Observatoire : normalisation territoire + mapping tolérant
 *
 * Valide :
 * - Les observations avec territory="GP" (majuscule) sont retrouvées
 *   quand le filtre utilise selectedTerritory="gp" (minuscule).
 * - Les champs storeName et confidence provenant du JSON externe
 *   sont correctement accessibles via l'interface PriceObservation.
 */

import { describe, it, expect } from 'vitest';
import { normalizeTerritoryCode } from '../services/priceSearch/normalizeTerritoryCode';
import { getObservationsForQuery } from '../services/observationsService';
import type { PriceObservation } from '../types/PriceObservation';

/* ------------------------------------------------------------------ */
/* normalizeTerritoryCode — accepte casse quelconque                   */
/* ------------------------------------------------------------------ */

describe('normalizeTerritoryCode — casse insensible', () => {
  it('converts uppercase "GP" to lowercase canonical "gp"', () => {
    expect(normalizeTerritoryCode('GP')).toBe('gp');
  });

  it('converts lowercase "gp" to canonical "gp"', () => {
    expect(normalizeTerritoryCode('gp')).toBe('gp');
  });

  it('converts mixed case "Gp" to canonical "gp"', () => {
    expect(normalizeTerritoryCode('Gp')).toBe('gp');
  });
});

/* ------------------------------------------------------------------ */
/* getObservationsForQuery — filtre territoire casse insensible         */
/* ------------------------------------------------------------------ */

describe('getObservationsForQuery — territory filter case-insensitive', () => {
  it('finds observations when query.territory is uppercase "GP" and data has lowercase "gp"', () => {
    // observationsMock has territory:'gp' (lowercase)
    const result = getObservationsForQuery({ territory: 'GP' });
    expect(result.observations.length).toBeGreaterThan(0);
    expect(result.metadata.status).not.toBe('NO_DATA');
  });

  it('finds observations when query.territory is lowercase "gp"', () => {
    const result = getObservationsForQuery({ territory: 'gp' });
    expect(result.observations.length).toBeGreaterThan(0);
  });

  it('returns NO_DATA for unknown territory', () => {
    const result = getObservationsForQuery({ territory: 'XX' });
    expect(result.observations.length).toBe(0);
    expect(result.metadata.status).toBe('NO_DATA');
  });
});

/* ------------------------------------------------------------------ */
/* PriceObservation — mapping tolérant storeName / confidence           */
/* ------------------------------------------------------------------ */

describe('PriceObservation — champs storeName et confidence acceptés', () => {
  it('accepts storeName as alias for storeLabel from external JSON', () => {
    const obs: PriceObservation = {
      productId: 'riz-1kg',
      productLabel: 'Riz blanc 1kg',
      territory: 'GP',
      price: 2.45,
      observedAt: '2026-01-06T11:30:00Z',
      storeName: 'Carrefour Abymes',
    };
    expect(obs.storeName).toBe('Carrefour Abymes');
  });

  it('accepts confidence as string from external JSON (e.g. "élevée")', () => {
    const obs: PriceObservation = {
      productId: 'lait-1l',
      productLabel: 'Lait UHT demi-écrémé 1L',
      territory: 'GP',
      price: 1.05,
      observedAt: '2026-01-06T11:30:00Z',
      confidence: 'élevée',
    };
    expect(obs.confidence).toBe('élevée');
  });

  it('accepts confidence as number for computed score', () => {
    const obs: PriceObservation = {
      productId: 'lait-1l',
      productLabel: 'Lait UHT demi-écrémé 1L',
      territory: 'GP',
      price: 1.05,
      observedAt: '2026-01-06T11:30:00Z',
      confidence: 0.85,
    };
    expect(obs.confidence).toBe(0.85);
  });
});
