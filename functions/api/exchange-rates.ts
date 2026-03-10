/**
 * Cloudflare Pages Function — /api/exchange-rates
 *
 * Proxy gratuit pour les taux de change en temps réel.
 * Source : open.er-api.com (ExchangeRate-API) — gratuit, sans clé API.
 *
 * GET /api/exchange-rates?base=EUR&symbols=USD,GBP,JPY
 *
 * Paramètres :
 *  base    — devise de base (défaut : EUR)
 *  symbols — devises cibles séparées par virgule (défaut : USD,GBP,JPY,CHF,CAD,AUD,XOF,XAF)
 *
 * Réponse :
 * {
 *   base: "EUR",
 *   rates: { USD: 1.15, GBP: 0.86, ... },
 *   time_last_update_utc: "...",
 *   fetchedAt: "..."
 * }
 *
 * Cache 1h — les taux sont mis à jour une fois par jour par la source.
 *
 * Inspiré de : https://freeapis.juheapi.com/apis (open.er-api.com)
 */

export interface Env {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_TTL_SECONDS = 3_600; // 1 heure
const REQUEST_TIMEOUT_MS = 8_000;

/** Devises pertinentes pour le projet (DOM-COM + comparaisons internationales) */
const DEFAULT_SYMBOLS = ['USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'XOF', 'XAF', 'MUR', 'HTG'];

/** Bases supportées (subset de ce que open.er-api.com propose) */
const SUPPORTED_BASES = new Set(['EUR', 'USD', 'GBP']);

interface ErApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc?: string;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      'cache-control': `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    const rawBase = (url.searchParams.get('base') ?? 'EUR').toUpperCase();
    const base = SUPPORTED_BASES.has(rawBase) ? rawBase : 'EUR';

    const rawSymbols = url.searchParams.get('symbols') ?? '';
    const requestedSymbols = rawSymbols
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{3}$/.test(s)); // validate 3-letter codes only

    const symbols = requestedSymbols.length > 0 ? requestedSymbols : DEFAULT_SYMBOLS;

    const apiUrl = `https://open.er-api.com/v6/latest/${base}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Upstream error ${res.status}`);

      const data = (await res.json()) as ErApiResponse;

      if (data.result !== 'success') throw new Error('Upstream returned non-success');

      // Filter to requested symbols only
      const filteredRates: Record<string, number> = {};
      for (const sym of symbols) {
        if (sym in data.rates) {
          filteredRates[sym] = data.rates[sym];
        }
      }
      // Always include the base itself
      filteredRates[base] = 1;

      return jsonResponse({
        base,
        rates: filteredRates,
        time_last_update_utc: data.time_last_update_utc ?? null,
        fetchedAt: new Date().toISOString(),
        source: 'open.er-api.com',
      });
    } catch {
      clearTimeout(timeout);
      // Fallback: last-known approximate rates — ECB reference as of 2026-03-10.
      // Update these values when open.er-api.com rates drift significantly (>5%).
      const fallbackRates: Record<string, Record<string, number>> = {
        EUR: { EUR: 1, USD: 1.158, GBP: 0.866, JPY: 183, CHF: 0.903, CAD: 1.572, AUD: 1.646, XOF: 655.957, XAF: 655.957, MUR: 53.75, HTG: 151 },
        USD: { USD: 1, EUR: 0.864, GBP: 0.748, JPY: 158, CHF: 0.780, CAD: 1.358, AUD: 1.422, XOF: 567, XAF: 567, MUR: 46, HTG: 130 },
        GBP: { GBP: 1, EUR: 1.155, USD: 1.338, JPY: 212, CHF: 1.043, CAD: 1.815, AUD: 1.901, XOF: 758, XAF: 758, MUR: 62, HTG: 175 },
      };
      const fb = fallbackRates[base] ?? fallbackRates['EUR'];
      const filteredFb: Record<string, number> = {};
      for (const sym of symbols) {
        if (sym in fb) filteredFb[sym] = fb[sym];
      }
      filteredFb[base] = 1;

      return jsonResponse({
        base,
        rates: filteredFb,
        time_last_update_utc: null,
        fetchedAt: new Date().toISOString(),
        source: 'fallback',
      });
    }
  },
};
