/**
 * Route coverage test — specialized comparators
 *
 * Ensures that every specialized comparator page listed in ComparateursHub
 * has a corresponding Route entry wired in App.tsx.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(here, '../App.tsx'), 'utf-8');

const SPECIALIZED_ROUTES = [
  'comparateur-vols',
  'comparateur-bateaux',
  'comparateur-fret',
  'comparateur-carburants',
  'comparateur-assurances',
  'comparateur-formations',
  'comparateur-services',
  'comparateur-location-voiture',
  'comparateur-materiaux-batiment',
  'evaluation-cosmetique',
];

const GENERAL_ROUTES = [
  'comparateur',
  'comparateur-citoyen',
  'comparateur-avance',
  'compare',
  'comparateurs-prix',
  'comparaison-enseignes',
  'comparaison-panier',
  'comparateur-territoires',
  'comparaison-territoires',
  'comparateurs',
  'recherche-avancee',
];

describe('Specialized comparator routes in App.tsx', () => {
  SPECIALIZED_ROUTES.forEach((route) => {
    it(`route "${route}" is defined`, () => {
      expect(appSource).toContain(`path="${route}"`);
    });
  });
});

describe('General comparator routes in App.tsx', () => {
  GENERAL_ROUTES.forEach((route) => {
    it(`route "${route}" is defined`, () => {
      expect(appSource).toContain(`path="${route}"`);
    });
  });
});

describe('Specialized comparator page imports in App.tsx', () => {
  const PAGES = [
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

  PAGES.forEach((page) => {
    it(`page "${page}" is imported`, () => {
      expect(appSource).toContain(page);
    });
  });
});
