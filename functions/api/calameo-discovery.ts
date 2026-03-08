/**
 * Cloudflare Pages Function — Découverte automatique des catalogues Calameo
 *
 * Interroge les comptes Calameo connus (magasins DOM-TOM) et retourne
 * la liste de leurs dernières publications, triées par date décroissante.
 *
 * Paramètres GET :
 *   - accounts  : identifiants de comptes Calameo séparés par des virgules
 *                 (ex: "006722065,005456123"). Si absent, utilise les comptes
 *                 par défaut inscrits dans KNOWN_ACCOUNTS.
 *   - per_page  : nombre de publications par compte (défaut: 10, max: 40)
 *
 * Réponse :
 *   {
 *     catalogs: Array<{
 *       bkcode:    string,      // code livre Calameo
 *       accountId: string,      // identifiant du compte éditeur
 *       title:     string,      // titre de la publication
 *       publicUrl: string,      // lien public Calameo
 *       thumbUrl?: string,      // miniature de couverture
 *       pages?:    number,      // nombre de pages
 *       date?:     string,      // date de publication (ISO)
 *     }>,
 *     fetchedAt: string,        // horodatage ISO de la requête
 *   }
 *
 * Le cache CDN est de 6 heures — durée volontairement longue car les
 * catalogues changent en moyenne toutes les 2 semaines.
 */

const CALAMEO_API_BASE = 'https://api.calameo.com/1.0';
const CALAMEO_BOOK_BASE = 'https://www.calameo.com/books';
const CACHE_MAX_AGE_SECONDS = 6 * 3600; // 6h

/**
 * Comptes Calameo DOM-TOM surveillés par défaut.
 * Format : "accountId:label"
 */
const KNOWN_ACCOUNTS: { id: string; label: string }[] = [
  { id: '006722065', label: '8 à Huit / SUP ECO / Carrefour Milénis DOM-TOM' },
  { id: '005456123', label: 'Ecologite Guadeloupe' },
  { id: '7762028',   label: 'Connexion Guadeloupe (high-tech / électroménager)' },
];

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

type CalameoAccountBooksResponse = {
  response?: {
    status?: string;
    total?: number;
    content?: {
      books?: CalameoBook[];
    };
  };
};

export interface DiscoveredCatalog {
  bkcode: string;
  accountId: string;
  title: string;
  publicUrl: string;
  thumbUrl?: string;
  pages?: number;
  date?: string;
}

const safeString = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;

const safeNumber = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

async function fetchAccountBooks(
  accountId: string,
  perPage: number,
  cache: Cache,
): Promise<DiscoveredCatalog[]> {
  const params = new URLSearchParams({
    output: 'JSON',
    action: 'getAccountBooks',
    account_id: accountId,
    per_page: String(perPage),
    sort: 'CREATION',
    way: 'DESC',
  });
  const apiUrl = `${CALAMEO_API_BASE}/?${params.toString()}`;
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

  if (!upstream.ok) return [];

  let data: CalameoAccountBooksResponse;
  try {
    data = (await upstream.json()) as CalameoAccountBooksResponse;
  } catch {
    return [];
  }

  const books = data?.response?.content?.books;
  if (!Array.isArray(books)) return [];

  return books.flatMap((book): DiscoveredCatalog[] => {
    const bkcode = safeString(book.BookCode);
    if (!bkcode) return [];

    const title = safeString(book.Name) ?? `Catalogue ${bkcode}`;
    const publicUrl =
      safeString(book.PublicUrl) ?? `${CALAMEO_BOOK_BASE}/${bkcode}`;

    return [
      {
        bkcode,
        accountId,
        title,
        publicUrl,
        thumbUrl: safeString(book.ThumbUrl),
        pages: safeNumber(book.Pages),
        date:
          safeString(book.Date) ??
          safeString(book.Creation) ??
          safeString(book.Modification),
      },
    ];
  });
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const rawAccounts = (url.searchParams.get('accounts') ?? '').trim();
  const requestedIds = rawAccounts
    ? rawAccounts.split(',').map((s) => s.trim()).filter(Boolean)
    : KNOWN_ACCOUNTS.map((a) => a.id);

  const perPage = Math.min(
    40,
    Math.max(1, Number(url.searchParams.get('per_page') ?? '10')),
  );

  // Deduplicate account IDs
  const uniqueIds = [...new Set(requestedIds)];

  const cache = caches.default;
  const results = await Promise.allSettled(
    uniqueIds.map((id) => fetchAccountBooks(id, perPage, cache)),
  );

  const catalogs: DiscoveredCatalog[] = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : [],
  );

  // Sort newest first (by date descending)
  catalogs.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return new Response(
    JSON.stringify({
      catalogs,
      fetchedAt: new Date().toISOString(),
      accountsQueried: uniqueIds,
    }),
    { status: 200, headers: CORS_HEADERS },
  );
};
