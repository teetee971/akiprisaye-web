/**
 * useCatalogueProductImage
 *
 * Fetches a product image from Open Food Facts (by text search) for
 * catalogue items that have no EAN/barcode.
 *
 * - Results are cached at the module level so repeated mounts do not
 *   trigger duplicate network requests.
 * - When no image is found the hook returns a category-based emoji so
 *   the UI always has something to display immediately.
 */

import { useEffect, useState } from 'react';

// ─── Category emoji map ───────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  ÉPICERIE: '🛒',
  BOISSONS: '🥤',
  HYGIÈNE: '🧴',
  BÉBÉ: '👶',
  BOUCHERIE: '🥩',
  POISSONNERIE: '🐟',
  'FRUITS ET LÉGUMES': '🥗',
  BOULANGERIE: '🥖',
  CRÈMERIE: '🥛',
  SURGELÉS: '❄️',
  CHARCUTERIE: '🍖',
  'PLATS CUISINÉS': '🍽️',
  CONFISERIE: '🍬',
  BAZAR: '🏪',
  'ULTRA FRAIS': '🥗',
};

export function getCategoryEmoji(category?: string): string {
  if (!category) return '🛒';
  return CATEGORY_EMOJI[category.toUpperCase()] ?? '🛒';
}

// ─── OFF text-search cache ────────────────────────────────────────────────────

const IMAGE_CACHE = new Map<string, string | null>();
const PENDING = new Map<string, Promise<string | null>>();

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const TIMEOUT_MS = 8_000;

async function fetchOFFImageByName(productName: string): Promise<string | null> {
  const params = new URLSearchParams({
    search_terms: productName,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '3',
    fields: 'image_front_small_url,image_front_url,image_url',
  });

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { products?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.products) || data.products.length === 0) return null;

    for (const p of data.products) {
      const url =
        (p['image_front_small_url'] as string | undefined) ??
        (p['image_front_url'] as string | undefined) ??
        (p['image_url'] as string | undefined);
      if (url && typeof url === 'string' && url.startsWith('https://')) return url;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

function resolveImage(productName: string): Promise<string | null> {
  const key = productName.trim().toLowerCase();
  if (IMAGE_CACHE.has(key)) return Promise.resolve(IMAGE_CACHE.get(key) ?? null);
  if (PENDING.has(key)) return PENDING.get(key)!;

  const promise = fetchOFFImageByName(productName).then((url) => {
    IMAGE_CACHE.set(key, url);
    PENDING.delete(key);
    return url;
  });
  PENDING.set(key, promise);
  return promise;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface CatalogueProductImageResult {
  /** HTTPS URL from Open Food Facts, or null while loading / not found */
  imageUrl: string | null;
  /** Emoji fallback for the product category (always available) */
  emoji: string;
  loading: boolean;
}

export function useCatalogueProductImage(
  productName: string,
  category?: string
): CatalogueProductImageResult {
  const emoji = getCategoryEmoji(category);
  const cacheKey = productName.trim().toLowerCase();

  const [imageUrl, setImageUrl] = useState<string | null>(
    IMAGE_CACHE.has(cacheKey) ? (IMAGE_CACHE.get(cacheKey) ?? null) : null
  );
  const [loading, setLoading] = useState(!IMAGE_CACHE.has(cacheKey));

  useEffect(() => {
    let cancelled = false;
    if (IMAGE_CACHE.has(cacheKey)) {
      setImageUrl(IMAGE_CACHE.get(cacheKey) ?? null);
      setLoading(false);
      return;
    }

    setLoading(true);
    resolveImage(productName).then((url) => {
      if (!cancelled) {
        setImageUrl(url);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, productName]);

  return { imageUrl, emoji, loading };
}
