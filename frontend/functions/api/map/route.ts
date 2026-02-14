const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

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

const parsePoint = (value: string | null): { lat: number; lon: number } | null => {
  if (!value) return null;
  const [latRaw, lonRaw] = value.split(',').map((v) => Number(v.trim()));
  if (!Number.isFinite(latRaw) || !Number.isFinite(lonRaw)) return null;
  if (Math.abs(latRaw) > 90 || Math.abs(lonRaw) > 180) return null;
  return { lat: latRaw, lon: lonRaw };
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: corsHeaders });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const from = parsePoint(url.searchParams.get('from'));
  const to = parsePoint(url.searchParams.get('to'));

  if (!from || !to) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid query params: expected from=lat,lon and to=lat,lon' }),
      { status: 400, headers: corsHeaders },
    );
  }

  const distanceKm = haversineKm(from.lat, from.lon, to.lat, to.lon);
  const averageUrbanSpeedKmh = 30;
  const travelSeconds = Math.round((distanceKm / averageUrbanSpeedKmh) * 3600);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        from,
        to,
        distance: {
          km: Number(distanceKm.toFixed(2)),
          meters: Math.round(distanceKm * 1000),
        },
        estimatedTime: {
          seconds: travelSeconds,
          minutes: Math.round(travelSeconds / 60),
        },
        note: 'Route estimation calculated from straight-line distance (fallback mode).',
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
