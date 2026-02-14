const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

type Store = {
  id: string;
  name: string;
  chain: string;
  territory: string;
  lat: number;
  lon: number;
};

const STORES: Store[] = [
  { id: 'gp-pointe-a-pitre-centre', name: 'Pointe-à-Pitre Centre', chain: 'Marché local', territory: 'GP', lat: 16.241, lon: -61.534 },
  { id: 'gp-baie-mahault-destinrellan', name: 'Baie-Mahault Destrellan', chain: 'Hypermarché', territory: 'GP', lat: 16.258, lon: -61.588 },
  { id: 'mq-fort-de-france-centre', name: 'Fort-de-France Centre', chain: 'Marché local', territory: 'MQ', lat: 14.609, lon: -61.073 },
  { id: 're-saint-denis-centre', name: 'Saint-Denis Centre', chain: 'Supermarché', territory: 'RE', lat: -20.878, lon: 55.448 },
];

const toRad = (deg: number) => (deg * Math.PI) / 180;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const parseNumber = (value: string | null) => {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: corsHeaders });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const lat = parseNumber(url.searchParams.get('lat'));
  const lon = parseNumber(url.searchParams.get('lon'));
  const radius = Math.min(50, Math.max(1, parseNumber(url.searchParams.get('radius')) ?? 10));
  const maxResults = Math.min(100, Math.max(1, parseNumber(url.searchParams.get('maxResults')) ?? 20));

  if (lat === null || lon === null) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required query params: lat, lon' }),
      { status: 400, headers: corsHeaders },
    );
  }

  const chains = (url.searchParams.get('chains') ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  const stores = STORES
    .map((store) => ({
      ...store,
      distance: haversineKm(lat, lon, store.lat, store.lon),
      travelTimeSeconds: Math.round((haversineKm(lat, lon, store.lat, store.lon) / 35) * 3600),
    }))
    .filter((store) => store.distance <= radius)
    .filter((store) => chains.length === 0 || chains.some((chain) => store.chain.toLowerCase().includes(chain)))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        location: { lat, lon },
        radius,
        count: stores.length,
        stores,
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      },
    },
  );
};
