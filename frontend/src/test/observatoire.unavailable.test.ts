/**
 * Tests — Observatoire : données momentanément indisponibles
 *
 * Valide :
 * - loadObservatoireData retourne un tableau vide (pas d'exception) quand le
 *   serveur répond avec une erreur HTTP ou ne répond pas du tout.
 * - Le message d'erreur standardisé est présent dans les deux pages qui
 *   l'affichent (Observatoire.tsx et ObservatoireTempsReel.tsx).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ */
/* loadObservatoireData — résilience réseau                            */
/* ------------------------------------------------------------------ */

describe('loadObservatoireData — données indisponibles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await loadObservatoireData('Guadeloupe');
    expect(result).toEqual([]);
  });

  it('returns empty array when server responds 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const result = await loadObservatoireData('Guadeloupe');
    expect(result).toEqual([]);
  });

  it('returns empty array when server responds 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const result = await loadObservatoireData('Martinique');
    expect(result).toEqual([]);
  });

  it('never throws — always resolves gracefully on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(loadObservatoireData('La Réunion')).resolves.toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Message standardisé — présent dans les deux pages                  */
/* ------------------------------------------------------------------ */

const EXPECTED_MSG = "La donnée de l'observatoire est momentanément indisponible";

describe('Message "données indisponibles" — présence dans les sources', () => {
  it('Observatoire.tsx contains the standard unavailability message', () => {
    const src = readFileSync(resolve(here, '../pages/Observatoire.tsx'), 'utf-8');
    expect(src).toContain(EXPECTED_MSG);
  });

  it('ObservatoireTempsReel.tsx contains the standard unavailability message', () => {
    const src = readFileSync(resolve(here, '../pages/ObservatoireTempsReel.tsx'), 'utf-8');
    expect(src).toContain(EXPECTED_MSG);
  });

  it('Observatoire.tsx contains a retry control', () => {
    const src = readFileSync(resolve(here, '../pages/Observatoire.tsx'), 'utf-8');
    expect(src).toContain('Réessayer');
  });

  it('ObservatoireTempsReel.tsx contains a retry control', () => {
    const src = readFileSync(resolve(here, '../pages/ObservatoireTempsReel.tsx'), 'utf-8');
    expect(src).toContain('Réessayer');
  });

  it('Observatoire.tsx uses role="alert" for the error region', () => {
    const src = readFileSync(resolve(here, '../pages/Observatoire.tsx'), 'utf-8');
    expect(src).toContain('role="alert"');
  });

  it('ObservatoireTempsReel.tsx uses role="alert" for the error region', () => {
    const src = readFileSync(resolve(here, '../pages/ObservatoireTempsReel.tsx'), 'utf-8');
    expect(src).toContain('role="alert"');
  });
});
