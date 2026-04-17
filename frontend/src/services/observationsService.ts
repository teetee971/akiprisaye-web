import { observationsMock } from '../data/observationsMock';
import type { NormalizedPriceObservation, ObservationDataStatus } from '../types/market';

export function normalizeObservation(
  input: Partial<NormalizedPriceObservation> & {
    barcode: string;
    territory: string;
    price: number;
    observedAt: string;
    storeName?: string;
    source?: string;
  }
): NormalizedPriceObservation {
  return {
    id: input.id ?? `${input.barcode}-${input.territory}-${input.observedAt}`,
    barcode: input.barcode,
    productName: input.productName ?? 'Produit non précisé',
    territory: input.territory as NormalizedPriceObservation['territory'],
    storeId: input.storeId,
    storeName: input.storeName ?? 'Magasin non précisé',
    price: Number(input.price),
    currency: 'EUR',
    observedAt: new Date(input.observedAt).toISOString(),
    source: input.source ?? 'source non précisée',
    reliability: input.reliability ?? 'medium',
  };
}

export function computeObservationStatus(
  observations: NormalizedPriceObservation[]
): ObservationDataStatus {
  if (!observations.length) return 'NO_DATA';
  if (observations.length < 2) return 'PARTIAL';
  return 'OK';
}

export function getObservationsForQuery(query: {
  territory?: string;
  barcode?: string;
  q?: string;
}) {
  const normalized = observationsMock.map((item) => normalizeObservation(item));
  const filtered = normalized
    .filter(
      (obs) => !query.territory || obs.territory.toLowerCase() === query.territory.toLowerCase()
    )
    .filter((obs) => !query.barcode || obs.barcode === query.barcode)
    .filter((obs) => !query.q || obs.productName.toLowerCase().includes(query.q.toLowerCase()))
    .sort((a, b) => +new Date(b.observedAt) - +new Date(a.observedAt));

  return {
    observations: filtered,
    metadata: {
      status: computeObservationStatus(filtered),
      total: filtered.length,
      lastUpdatedAt: filtered[0]?.observedAt ?? null,
    },
  };
}
