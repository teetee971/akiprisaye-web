// src/services/priceObservationService.ts

import type { PriceObservation } from '../types/PriceObservation';
import rawObservations from '../data/observations.json';
import { normalizeTerritoryCode } from './priceSearch/normalizeTerritoryCode';

/* ============================================================================
 * Configuration
 * ========================================================================== */

const ENABLE_PARTNER_APIS = false;

const ALLOWED_SOURCE_TYPES: PriceObservation['sourceType'][] = [
  'citizen',
  'open_data',
  'partner',
];

/* ============================================================================
 * Types internes (données brutes)
 * ========================================================================== */

interface RawProduct {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  tva_pct: number;
  categorie?: string;
}

interface RawObservation {
  territoire: string;
  commune: string;
  enseigne: string;
  date: string;
  heure: string;
  produits: RawProduct[];
  created_at: string;
}

interface SearchFilters {
  query: string;
  territory: string;
  store: string;
  source: PriceObservation['sourceType'] | 'all';
  periodDays: number | 'all';
}

/* ============================================================================
 * Utilitaires
 * ========================================================================== */

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const computeConfidenceScore = (
  observationsCount: number,
  observedAt: string
): number => {
  const countScore = Math.min(observationsCount, 10) * 5;

  const daysAgo = Math.floor(
    (Date.now() - new Date(observedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const recencyScore =
    daysAgo <= 7 ? 50 : daysAgo <= 30 ? 35 : daysAgo <= 90 ? 20 : 10;

  return Math.min(100, countScore + recencyScore);
};

const assertSourceType = (sourceType: PriceObservation['sourceType']) => {
  if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) {
    throw new Error('unsupported_source_type');
  }
  if (sourceType === 'partner' && !ENABLE_PARTNER_APIS) {
    throw new Error('partner_sources_disabled');
  }
};

/* ============================================================================
 * Construction des observations citoyennes
 * ========================================================================== */

const buildCitizenObservations = (): PriceObservation[] => {
  return (rawObservations as RawObservation[]).flatMap((observation) => {
    const observedAt = new Date(
      `${observation.date}T${observation.heure}`
    ).toISOString();

    const territory = normalizeTerritoryCode(observation.territoire);

    return observation.produits.map((product) => {
      const productLabel = product.nom.trim();
      const observationsCount = 1;

      return {
        productId: `${observation.enseigne}-${productLabel}`,
        productLabel,
        territory,
        storeLabel: observation.enseigne,
        price: product.prix_unitaire,
        currency: 'EUR',
        observedAt,
        sourceType: 'citizen',
        observationsCount,
        confidenceScore: computeConfidenceScore(
          observationsCount,
          observedAt
        ),
      };
    });
  });
};

/* ============================================================================
 * Pool global d’observations
 * ========================================================================== */

const OPEN_DATA_OBSERVATIONS: PriceObservation[] = [];
const PARTNER_OBSERVATIONS: PriceObservation[] = [];

const buildObservationPool = (): PriceObservation[] => {
  const observations = [
    ...buildCitizenObservations(),
    ...OPEN_DATA_OBSERVATIONS,
    ...PARTNER_OBSERVATIONS,
  ];

  observations.forEach((o) => assertSourceType(o.sourceType));
  return observations;
};

/* ============================================================================
 * Agrégation (moyenne + dernière observation)
 * ========================================================================== */

const aggregateObservations = (
  observations: PriceObservation[]
): PriceObservation[] => {
  const grouped = new Map<string, PriceObservation[]>();

  observations.forEach((obs) => {
    const key = [
      obs.productLabel,
      obs.territory,
      obs.storeLabel,
    ]
      .map(normalizeText)
      .join('|');

    const bucket = grouped.get(key) ?? [];
    bucket.push(obs);
    grouped.set(key, bucket);
  });

  return Array.from(grouped.values()).map((entries) => {
    const totalPrice = entries.reduce((sum, e) => sum + e.price, 0);
    const averagePrice = totalPrice / entries.length;

    const latest = entries.reduce((a, b) =>
      new Date(b.observedAt) > new Date(a.observedAt) ? b : a
    );

    const observationsCount = entries.reduce(
      (sum, e) => sum + (e.observationsCount ?? 1),
      0
    );

    return {
      ...latest,
      price: Number(averagePrice.toFixed(2)),
      observationsCount,
      confidenceScore: computeConfidenceScore(
        observationsCount,
        latest.observedAt
      ),
    };
  });
};

/* ============================================================================
 * Service public
 * ========================================================================== */

export const priceObservationService = {
  async search(filters: SearchFilters): Promise<PriceObservation[]> {
    const query = normalizeText(filters.query);

    if (filters.source !== 'all') {
      assertSourceType(filters.source);
    }

    const observations = aggregateObservations(
      buildObservationPool().filter((obs) => {
        const matchesQuery =
          query.length === 0 ||
          normalizeText(obs.productLabel).includes(query);

        const matchesTerritory =
          filters.territory === 'all' ||
          obs.territory === filters.territory;

        const matchesStore =
          filters.store === 'all' ||
          obs.storeLabel === filters.store;

        const matchesSource =
          filters.source === 'all' ||
          obs.sourceType === filters.source;

        const matchesPeriod =
          filters.periodDays === 'all'
            ? true
            : Date.now() -
                new Date(obs.observedAt).getTime() <=
              filters.periodDays * 24 * 60 * 60 * 1000;

        return (
          matchesQuery &&
          matchesTerritory &&
          matchesStore &&
          matchesSource &&
          matchesPeriod
        );
      })
    );

    return observations.sort(
      (a, b) =>
        new Date(b.observedAt).getTime() -
        new Date(a.observedAt).getTime()
    );
  },
};
