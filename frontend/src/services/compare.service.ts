/**
 * Compare service — frontend API client
 *
 * Priority chain:
 *   1. Real API at VITE_API_BASE_URL (set in production / staging)
 *   2. Static mock data (development / GitHub Pages — no backend)
 *
 * The mock mirrors the exact shape of CompareResponse so the UI layer
 * never needs to know which path was taken.
 */

import type { CompareParams, CompareResponse, PriceObservationRow } from '../types/compare';

// ── Base URL (override via .env: VITE_API_BASE_URL=http://localhost:3001) ─────
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

// ── Static mock catalogue (GitHub Pages fallback) ─────────────────────────────
const MOCK_CATALOGUE: CompareResponse[] = [
  {
    product: { id: 'water-6x15', name: 'Pack eau 6x1.5L', barcode: '3270190204877', image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=1200&q=80' },
    territory: 'GP',
    retailerFilter: null,
    observations: [
      { retailer: 'Leader Price', territory: 'GP', price: 2.89, currency: 'EUR', observedAt: '2026-03-20T08:30:00Z', source: 'mock' },
      { retailer: 'Carrefour',    territory: 'GP', price: 3.49, currency: 'EUR', observedAt: '2026-03-20T08:20:00Z', source: 'mock' },
      { retailer: 'Super U',      territory: 'GP', price: 3.72, currency: 'EUR', observedAt: '2026-03-20T07:55:00Z', source: 'mock' },
    ],
    summary: { min: 2.89, max: 3.72, average: 3.37, savings: 0.83, count: 3 },
  },
  {
    product: { id: 'milk-1l', name: 'Lait demi-écrémé 1L', barcode: '3564700012459', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80' },
    territory: 'GP',
    retailerFilter: null,
    observations: [
      { retailer: 'Carrefour',    territory: 'GP', price: 1.32, currency: 'EUR', observedAt: '2026-03-20T08:28:00Z', source: 'mock' },
      { retailer: 'Leader Price', territory: 'GP', price: 1.41, currency: 'EUR', observedAt: '2026-03-20T08:07:00Z', source: 'mock' },
      { retailer: 'Super U',      territory: 'GP', price: 1.46, currency: 'EUR', observedAt: '2026-03-20T08:02:00Z', source: 'mock' },
    ],
    summary: { min: 1.32, max: 1.46, average: 1.40, savings: 0.14, count: 3 },
  },
  {
    product: { id: 'rice-1kg', name: 'Riz long 1kg', barcode: '3017620429484', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31b?auto=format&fit=crop&w=1200&q=80' },
    territory: 'GP',
    retailerFilter: null,
    observations: [
      { retailer: 'Match',     territory: 'GP', price: 2.91, currency: 'EUR', observedAt: '2026-03-20T08:12:00Z', source: 'mock' },
      { retailer: 'Carrefour', territory: 'GP', price: 3.18, currency: 'EUR', observedAt: '2026-03-20T08:04:00Z', source: 'mock' },
      { retailer: 'Super U',   territory: 'GP', price: 3.22, currency: 'EUR', observedAt: '2026-03-20T07:51:00Z', source: 'mock' },
    ],
    summary: { min: 2.91, max: 3.22, average: 3.10, savings: 0.31, count: 3 },
  },
];

// ── Mock resolver ─────────────────────────────────────────────────────────────

function resolveMock(params: CompareParams): CompareResponse {
  const term = params.query.toLowerCase();

  const base =
    MOCK_CATALOGUE.find(
      (c) =>
        c.product.name.toLowerCase().includes(term) ||
        c.product.barcode.includes(params.query),
    ) ?? MOCK_CATALOGUE[0];

  // Filter observations by territory + optional retailer
  const territoryCode = params.territory.toUpperCase();
  let obs: PriceObservationRow[] = base.observations.filter(
    (o) => o.territory.toUpperCase() === territoryCode || o.territory === params.territory,
  );
  // If territory filter returns nothing, show all (cross-territory demo)
  if (obs.length === 0) obs = base.observations;
  if (params.retailer) obs = obs.filter((o) => o.retailer === params.retailer);
  obs = [...obs].sort((a, b) => a.price - b.price);

  const min = obs[0]?.price ?? null;
  const max = obs[obs.length - 1]?.price ?? null;
  const average = obs.length ? obs.reduce((s, o) => s + o.price, 0) / obs.length : null;

  return {
    ...base,
    territory: params.territory,
    retailerFilter: params.retailer ?? null,
    observations: obs,
    summary: {
      min,
      max,
      average: average !== null ? parseFloat(average.toFixed(2)) : null,
      savings: min !== null && max !== null ? parseFloat((max - min).toFixed(2)) : null,
      count: obs.length,
    },
  };
}

// ── Real API call ─────────────────────────────────────────────────────────────

async function fetchFromApi(params: CompareParams): Promise<CompareResponse> {
  const qs = new URLSearchParams({
    query: params.query,
    territory: params.territory,
    ...(params.retailer ? { retailer: params.retailer } : {}),
  });
  const res = await fetch(`${API_BASE}/api/compare?${qs.toString()}`);
  if (!res.ok) throw new Error(`compare API ${res.status}`);
  return res.json() as Promise<CompareResponse>;
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Fetch comparison data. Falls back to the static mock when no backend
 * is reachable (GitHub Pages, local dev without a running server).
 */
export async function fetchCompare(params: CompareParams): Promise<CompareResponse> {
  if (!API_BASE) return resolveMock(params);

  try {
    return await fetchFromApi(params);
  } catch {
    return resolveMock(params);
  }
}
