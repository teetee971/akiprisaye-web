/**
 * Comparator hub route coverage test
 *
 * Ensures that every comparator exposed in ComparateursHub has a corresponding
 * Route entry in App.tsx, and that every comparator route wired in App.tsx is
 * surfaced back from the hub for internal navigation.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(here, '../App.tsx'), 'utf-8');
const hubSource = readFileSync(resolve(here, '../pages/ComparateursHub.tsx'), 'utf-8');

const isComparatorPath = (path: string) =>
  !path.includes(':') && // exclude dynamic route templates (e.g. /comparateur/:slug)
  (path.startsWith('/comparateur') ||
    path.startsWith('/comparaison') ||
    path === '/compare' ||
    path === '/comparatif-concurrence' ||
    path === '/recherche-prix' ||
    path.startsWith('/recherche-prix/'));

const hubComparatorPaths = Array.from(
  new Set(
    [...hubSource.matchAll(/path:\s*'([^']+)'/g)]
      .map(([, path]) => path)
      .filter(isComparatorPath)
      .filter((path) => !['/comparateurs', '/comparateurs-hub'].includes(path))
  )
).sort();

const appComparatorRoutes = Array.from(
  new Set(
    [...appSource.matchAll(/<Route path="([^"]+)"/g)]
      .map(([, path]) => `/${path}`)
      .filter(isComparatorPath)
      .filter((path) => !['/comparateurs', '/comparateurs-hub'].includes(path))
  )
).sort();

describe('ComparateursHub comparator links', () => {
  it('exposes every comparator route wired in App.tsx', () => {
    expect(hubComparatorPaths).toEqual(appComparatorRoutes);
  });

  it('still includes the main comparator entry points users expect', () => {
    expect(hubComparatorPaths).toEqual(
      expect.arrayContaining([
        '/comparateur',
        '/comparateur-citoyen',
        '/comparateur-avance',
        '/compare',
        '/comparateurs-prix',
        '/comparateur-vols',
        '/comparateur-bateaux',
        '/comparateur-fret',
        '/comparateur-carburants',
        '/comparateur-assurances',
        '/comparateur-formations',
        '/comparateur-services',
        '/comparateur-location-voiture',
        '/comparateur-materiaux-batiment',
        '/comparateur-territoires',
        '/comparaison-territoires',
        '/recherche-prix',
        '/recherche-prix/avions',
        '/recherche-prix/bateaux',
        '/recherche-prix/fret',
        '/recherche-prix/fret-aerien',
        '/recherche-prix/electricite',
        '/recherche-prix/eau',
        '/recherche-prix/abonnements-internet',
        '/recherche-prix/abonnements-mobile',
        '/recherche-prix/delais-logistiques',
        '/recherche-prix/indice-logistique',
        '/recherche-prix/pourquoi-delais-produit',
      ])
    );
  });
});

describe('Specialized comparator page imports in App.tsx', () => {
  const pages = [
    'FlightComparator',
    'BoatComparator',
    'FreightComparator',
    'FuelComparator',
    'InsuranceComparator',
    'TrainingComparator',
    'ServiceComparator',
    'CarRentalComparator',
    'BuildingMaterialsComparator',
    'EvaluationCosmetique',
  ];

  pages.forEach((page) => {
    it(`page "${page}" is imported`, () => {
      expect(appSource).toContain(page);
    });
  });
});
