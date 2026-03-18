// src/hooks/useProductLivePrices.ts
// Hook pour récupérer les prix d'un produit en temps quasi-réel
// sur tous les territoires DOM-TOM via Open Food Facts + Open Prices API

import { useState, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LivePriceEntry {
  territory: string
  territoryName: string
  price: number
  currency: string
  storeName: string
  observedAt: string
  source: string
}

export interface LiveProduct {
  ean: string
  name: string
  brand: string
  category: string
  imageUrl: string
  nutriscore: string
  quantity: number | null
  unit: string
}

export interface TerritoryPriceSummary {
  territory: string
  territoryName: string
  min: number | null
  max: number | null
  avg: number | null
  count: number
  currency: string
  entries: LivePriceEntry[]
}

export interface LivePricesResult {
  product: LiveProduct | null
  byTerritory: TerritoryPriceSummary[]
  allEntries: LivePriceEntry[]
  cheapestTerritory: string | null
  scannedAt: string
}

export type LivePricesState = {
  loading: boolean
  result: LivePricesResult | null
  error: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOM_TERRITORIES: Record<string, string> = {
  gp: 'Guadeloupe',
  mq: 'Martinique',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2'
const OPEN_PRICES_BASE = 'https://prices.openfoodfacts.org/api/v1'

const BOT_UA = 'akiprisaye-opendata-bot/2.0 (https://akiprisaye.fr)'

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': BOT_UA, Accept: 'application/json' },
      signal,
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// ─── Open Food Facts ──────────────────────────────────────────────────────────

async function fetchProductInfo(ean: string, signal?: AbortSignal): Promise<LiveProduct | null> {
  const url = `${OFF_BASE}/product/${encodeURIComponent(ean)}?fields=product_name,brands,categories_tags,image_front_url,nutriscore_grade,product_quantity,quantity_unit`
  const data = await fetchJSON<{ product?: Record<string, unknown> }>(url, signal)
  if (!data?.product) return null

  const p = data.product
  return {
    ean,
    name:       String(p.product_name ?? ''),
    brand:      String(p.brands ?? ''),
    category:   ((p.categories_tags as string[] | undefined)?.[0] ?? '').replace(/^en:/, ''),
    imageUrl:   String(p.image_front_url ?? ''),
    nutriscore: String(p.nutriscore_grade ?? ''),
    quantity:   p.product_quantity ? parseFloat(String(p.product_quantity)) : null,
    unit:       String(p.quantity_unit ?? ''),
  }
}

// ─── Open Prices ──────────────────────────────────────────────────────────────

interface OpenPricesItem {
  price?: number
  currency?: string
  location_country?: string
  location_osm_name?: string
  date?: string
}

async function fetchOpenPrices(ean: string, signal?: AbortSignal): Promise<LivePriceEntry[]> {
  const url = `${OPEN_PRICES_BASE}/prices?product_code=${encodeURIComponent(ean)}&size=200`
  const data = await fetchJSON<{ items?: OpenPricesItem[] }>(url, signal)
  if (!data?.items) return []

  const entries: LivePriceEntry[] = []

  for (const item of data.items) {
    const countryRaw = (item.location_country ?? '').toLowerCase()
    // Match DOM territories: full code or ISO 3166-1 alpha-2 subset
    const territory = Object.keys(DOM_TERRITORIES).find(
      (t) => countryRaw === t || countryRaw.includes(t),
    )
    if (!territory || !item.price) continue

    entries.push({
      territory,
      territoryName: DOM_TERRITORIES[territory],
      price:         item.price,
      currency:      item.currency ?? 'EUR',
      storeName:     item.location_osm_name ?? '',
      observedAt:    item.date ?? new Date().toISOString(),
      source:        'openprices',
    })
  }

  return entries
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function aggregateByTerritory(entries: LivePriceEntry[]): TerritoryPriceSummary[] {
  return Object.entries(DOM_TERRITORIES).map(([territory, territoryName]) => {
    const terEntries = entries.filter((e) => e.territory === territory)
    const prices = terEntries.map((e) => e.price).filter((p) => p > 0)

    const min = prices.length ? Math.min(...prices) : null
    const max = prices.length ? Math.max(...prices) : null
    const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null
    const currency = terEntries[0]?.currency ?? 'EUR'

    return { territory, territoryName, min, max, avg, count: terEntries.length, currency, entries: terEntries }
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook pour scanner les prix d'un produit en temps quasi-réel sur les
 * 5 territoires DOM-TOM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte).
 *
 * Sources : Open Food Facts (fiche produit) + Open Prices (prix contributifs)
 *
 * Usage :
 *   const { state, scan, clear } = useProductLivePrices()
 *   await scan('3017620422003')
 */
export function useProductLivePrices() {
  const [state, setState] = useState<LivePricesState>({
    loading: false,
    result:  null,
    error:   null,
  })

  const abortRef = useRef<AbortController | null>(null)

  const scan = useCallback(async (ean: string) => {
    // Cancel any in-progress scan
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ loading: true, result: null, error: null })

    try {
      // Fetch product info + prices in parallel
      const [product, priceEntries] = await Promise.all([
        fetchProductInfo(ean, controller.signal),
        fetchOpenPrices(ean, controller.signal),
      ])

      if (controller.signal.aborted) return

      const byTerritory = aggregateByTerritory(priceEntries)

      // Find cheapest territory (with at least 1 price)
      const withPrices = byTerritory.filter((t) => t.min != null)
      const cheapest = withPrices.reduce<TerritoryPriceSummary | null>(
        (best, t) => (!best || (t.min ?? Infinity) < (best.min ?? Infinity) ? t : best),
        null,
      )

      setState({
        loading: false,
        result: {
          product,
          byTerritory,
          allEntries:        priceEntries,
          cheapestTerritory: cheapest?.territory ?? null,
          scannedAt:         new Date().toISOString(),
        },
        error: null,
      })
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setState({
        loading: false,
        result:  null,
        error:   'Impossible de récupérer les prix. Vérifiez votre connexion.',
      })
    }
  }, [])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setState({ loading: false, result: null, error: null })
  }, [])

  return { state, scan, clear }
}
