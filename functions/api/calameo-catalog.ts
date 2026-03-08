/**
 * Cloudflare Pages Function — Proxy catalogue Calameo
 *
 * Récupère les métadonnées d'un catalogue Calameo (titre, URL, couverture,
 * nombre de pages) et les expose au format PriceObservation.
 *
 * Les catalogues Calameo sont des documents visuels (PDF/flipbook).
 * L'extraction automatique de prix à partir des images de pages
 * nécessite une étape OCR supplémentaire (à brancher sur /api/ocr-ticket).
 *
 * En attendant, ce proxy renvoie le statut PARTIAL avec l'URL du catalogue
 * dans les métadonnées afin que l'interface puisse afficher un lien
 * "Consulter le catalogue".
 *
 * Paramètres GET :
 *   - bkcode   : code livre Calameo (ex: "005456123ba91a2661670")
 *   - authid   : identifiant d'accès Calameo (ex: "KEl4wzU8WfzM")
 *   - q        : libellé produit (pour filtrage futur via OCR)
 *   - source   : identifiant de source renvoyé dans les observations
 *                (ex: "ecologite_guadeloupe")
 */

const CALAMEO_API_BASE = 'https://api.calameo.com/1.0';
const CALAMEO_BOOK_BASE = 'https://www.calameo.com/books';
const CACHE_MAX_AGE_SECONDS = 3600; // 1h — les catalogues changent rarement

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

type CalameoBook = {
  BookCode?: unknown;
  Name?: unknown;
  Description?: unknown;
  Pages?: unknown;
  ThumbUrl?: unknown;
  PublicUrl?: unknown;
  Date?: unknown;
  Creation?: unknown;
  Modification?: unknown;
};

type CalameoApiResponse = {
  response?: {
    status?: string;
    content?: CalameoBook;
  };
};

const safeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const bkcode = (url.searchParams.get('bkcode') ?? '').trim();
  const authid = (url.searchParams.get('authid') ?? '').trim();
  const source = (url.searchParams.get('source') ?? 'calameo_catalog').trim();
  // q is reserved for future OCR-based price extraction
  const q = (url.searchParams.get('q') ?? '').trim();

  if (!bkcode) {
    return new Response(
      JSON.stringify({ error: 'Paramètre requis: bkcode' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Fetch book metadata from Calameo public API
  const apiParams = new URLSearchParams({ output: 'JSON', action: 'getBook', bkcode });
  if (authid) apiParams.set('authid', authid);
  const apiUrl = `${CALAMEO_API_BASE}/?${apiParams.toString()}`;

  const cache = caches.default;
  const cacheKey = new Request(apiUrl, { method: 'GET' });

  let upstream = await cache.match(cacheKey);
  if (!upstream) {
    upstream = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'A-KI-PRI-SA-YE/1.0 (observatoire prix DOM-TOM; contact: support@akiprisaye.fr)',
        Accept: 'application/json',
      },
    });

    if (upstream.ok) {
      const toCache = new Response(upstream.body, upstream);
      toCache.headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
      await cache.put(cacheKey, toCache.clone());
      upstream = toCache;
    }
  }

  const publicUrl = authid
    ? `${CALAMEO_BOOK_BASE}/${bkcode}?authid=${authid}`
    : `${CALAMEO_BOOK_BASE}/${bkcode}`;

  // If the Calameo API is unavailable, still return a usable reference
  if (!upstream.ok) {
    return new Response(
      JSON.stringify({
        status: 'PARTIAL',
        source,
        observations: [],
        catalog: { bkcode, publicUrl, query: q || undefined },
        warnings: [
          'Métadonnées Calameo indisponibles. Consulter le catalogue directement : ' + publicUrl,
        ],
      }),
      { status: 200, headers: CORS_HEADERS },
    );
  }

  let book: CalameoBook = {};
  try {
    const data = (await upstream.json()) as CalameoApiResponse;
    if (data?.response?.status === 'ok' && data.response.content) {
      book = data.response.content;
    }
  } catch {
    // Non-fatal — fall through with empty book metadata
  }

  const title = safeString(book.Name) ?? `Catalogue ${bkcode}`;
  const thumbUrl = safeString(book.ThumbUrl);
  const pageCount = safeNumber(book.Pages);
  const description = safeString(book.Description);

  /*
   * Les catalogues Calameo sont des documents visuels. L'extraction
   * automatique de prix à partir des images de pages nécessite une
   * étape OCR (à intégrer via /api/ocr-ticket). En attendant, ce
   * proxy renvoie PARTIAL avec l'URL du catalogue dans les métadonnées.
   */
  const catalog: Record<string, string | number> = {
    bkcode,
    title,
    publicUrl,
  };
  if (thumbUrl) catalog.thumbUrl = thumbUrl;
  if (pageCount !== null) catalog.pages = pageCount;
  if (description) catalog.description = description;
  if (q) catalog.query = q;

  const warnings = [
    `Catalogue visuel (${title}) : extraction automatique des prix non disponible. ` +
      `Consulter le catalogue : ${publicUrl}`,
  ];

  return new Response(
    JSON.stringify({
      status: 'PARTIAL',
      source,
      observations: [],
      catalog,
      warnings,
    }),
    { status: 200, headers: CORS_HEADERS },
  );
};
