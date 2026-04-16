/**
 * Cloudflare Pages Function — /api/flight-offers
 *
 * Proxy vers Amadeus Self-Service Flight Offers Search (v2).
 *
 * GET /api/flight-offers?origin=PTP&destination=ORY&departureDate=2026-06-15&adults=1
 *     [&returnDate=2026-06-22][&children=1][&infants=0]
 *     [&nonStop=true][&travelClass=ECONOMY][&max=20][&currency=EUR]
 *     [&includeRaw=true]
 *
 * Variables d'environnement (secrets serveur) :
 * - AMADEUS_CLIENT_ID
 * - AMADEUS_CLIENT_SECRET
 * - AMADEUS_HOST (optionnel, défaut test: https://test.api.amadeus.com)
 */

interface Env {
  AMADEUS_CLIENT_ID?: string;
  AMADEUS_CLIENT_SECRET?: string;
  AMADEUS_HOST?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const REQUEST_TIMEOUT_MS = 12_000;
const ACCESS_TOKEN_CACHE_TTL_MS = 25 * 60 * 1000; // 25 min

let cachedToken: { value: string; expiresAt: number } | null = null;

function jsonResponse(payload: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...(extraHeaders ?? {}),
    },
  });
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function safeInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function createTimeoutController(ms: number): { controller: AbortController; timer: ReturnType<typeof setTimeout> } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

async function getAccessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value;
  }

  const host = (env.AMADEUS_HOST ?? 'https://test.api.amadeus.com').replace(/\/$/, '');
  const clientId = env.AMADEUS_CLIENT_ID;
  const clientSecret = env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials are missing');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const { controller, timer } = createTimeoutController(REQUEST_TIMEOUT_MS);
  try {
    const tokenRes = await fetch(`${host}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });

    if (!tokenRes.ok) {
      throw new Error(`Token endpoint error ${tokenRes.status}`);
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!tokenJson.access_token) {
      throw new Error('No access token in Amadeus response');
    }

    const ttlMs = Math.max(60_000, Math.min((tokenJson.expires_in ?? 1800) * 1000, ACCESS_TOKEN_CACHE_TTL_MS));
    cachedToken = {
      value: tokenJson.access_token,
      expiresAt: now + ttlMs,
    };

    return tokenJson.access_token;
  } finally {
    clearTimeout(timer);
  }
}

function mapOffer(offer: Record<string, unknown>, includeRaw: boolean) {
  const itineraries = Array.isArray(offer.itineraries) ? offer.itineraries as Array<Record<string, unknown>> : [];
  const firstLeg = itineraries[0] ?? {};
  const segments = Array.isArray(firstLeg.segments) ? firstLeg.segments as Array<Record<string, unknown>> : [];
  const firstSegment = segments[0] ?? {};
  const lastSegment = segments[segments.length - 1] ?? {};
  const price = (offer.price ?? {}) as Record<string, unknown>;
  const validatingAirlineCodes = Array.isArray(offer.validatingAirlineCodes)
    ? offer.validatingAirlineCodes.filter((x): x is string => typeof x === 'string')
    : [];

  return {
    id: typeof offer.id === 'string' ? offer.id : null,
    total: typeof price.total === 'string' ? price.total : null,
    base: typeof price.base === 'string' ? price.base : null,
    currency: typeof price.currency === 'string' ? price.currency : null,
    airline: validatingAirlineCodes[0] ?? null,
    numberOfBookableSeats:
      typeof offer.numberOfBookableSeats === 'number' ? offer.numberOfBookableSeats : null,
    duration: typeof firstLeg.duration === 'string' ? firstLeg.duration : null,
    stops: Math.max(segments.length - 1, 0),
    departure: {
      iataCode:
        typeof (firstSegment.departure as Record<string, unknown> | undefined)?.iataCode === 'string'
          ? ((firstSegment.departure as Record<string, unknown>).iataCode as string)
          : null,
      at:
        typeof (firstSegment.departure as Record<string, unknown> | undefined)?.at === 'string'
          ? ((firstSegment.departure as Record<string, unknown>).at as string)
          : null,
    },
    arrival: {
      iataCode:
        typeof (lastSegment.arrival as Record<string, unknown> | undefined)?.iataCode === 'string'
          ? ((lastSegment.arrival as Record<string, unknown>).iataCode as string)
          : null,
      at:
        typeof (lastSegment.arrival as Record<string, unknown> | undefined)?.at === 'string'
          ? ((lastSegment.arrival as Record<string, unknown>).at as string)
          : null,
    },
    ...(includeRaw ? { raw: offer } : {}),
  };
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);

  const origin = (url.searchParams.get('origin') ?? '').toUpperCase();
  const destination = (url.searchParams.get('destination') ?? '').toUpperCase();
  const departureDate = url.searchParams.get('departureDate') ?? '';
  const returnDate = url.searchParams.get('returnDate') ?? undefined;
  const includeRaw = url.searchParams.get('includeRaw') === 'true';

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return jsonResponse({ error: 'origin et destination doivent être des codes IATA sur 3 lettres (ex: PTP, ORY).' }, 400);
  }

  if (!isIsoDate(departureDate)) {
    return jsonResponse({ error: 'departureDate doit être au format YYYY-MM-DD.' }, 400);
  }

  if (returnDate && !isIsoDate(returnDate)) {
    return jsonResponse({ error: 'returnDate doit être au format YYYY-MM-DD.' }, 400);
  }

  if (returnDate && returnDate < departureDate) {
    return jsonResponse({ error: 'returnDate doit être égale ou postérieure à departureDate.' }, 400);
  }

  const adults = safeInt(url.searchParams.get('adults'), 1, 1, 9);
  const children = safeInt(url.searchParams.get('children'), 0, 0, 9);
  const infants = safeInt(url.searchParams.get('infants'), 0, 0, adults);
  const max = safeInt(url.searchParams.get('max'), 20, 1, 250);

  const searchParams = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults: String(adults),
    max: String(max),
  });

  if (children > 0) searchParams.set('children', String(children));
  if (infants > 0) searchParams.set('infants', String(infants));

  const nonStop = url.searchParams.get('nonStop');
  if (nonStop === 'true' || nonStop === 'false') searchParams.set('nonStop', nonStop);

  const travelClass = (url.searchParams.get('travelClass') ?? '').toUpperCase();
  if (['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].includes(travelClass)) {
    searchParams.set('travelClass', travelClass);
  }

  const currency = (url.searchParams.get('currency') ?? '').toUpperCase();
  if (/^[A-Z]{3}$/.test(currency)) searchParams.set('currencyCode', currency);

  if (returnDate) searchParams.set('returnDate', returnDate);

  const { controller, timer } = createTimeoutController(REQUEST_TIMEOUT_MS);
  try {
    const host = (env.AMADEUS_HOST ?? 'https://test.api.amadeus.com').replace(/\/$/, '');
    const token = await getAccessToken(env);

    const res = await fetch(`${host}/v2/shopping/flight-offers?${searchParams.toString()}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return jsonResponse(
        {
          error: 'Erreur API Amadeus',
          status: res.status,
          details: body,
        },
        res.status,
      );
    }

    const rawData = Array.isArray(body.data) ? body.data as Array<Record<string, unknown>> : [];
    const offers = rawData.map((offer) => mapOffer(offer, includeRaw));

    return jsonResponse({
      route: `${origin}-${destination}`,
      departureDate,
      returnDate: returnDate ?? null,
      adults,
      children,
      infants,
      count: offers.length,
      offers,
      dictionaries: body.dictionaries ?? {},
      meta: body.meta ?? {},
      source: 'amadeus-self-service-flight-offers-search',
      includeRaw,
      fetchedAt: new Date().toISOString(),
    }, 200, {
      'cache-control': 'public, s-maxage=120',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('credentials are missing') ? 500 : 502;
    return jsonResponse({ error: 'Impossible de récupérer les offres de vol', details: message }, status);
  } finally {
    clearTimeout(timer);
  }
};
