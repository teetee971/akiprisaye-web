export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf;
  
  const stats = {
    timestamp: new Date().toISOString(),
    heure: new Date().getHours() + "h",
    ville: cf.city || "Inconnue",
    region: cf.region || "Inconnue", // 🇬🇵 Guadeloupe, 🇲🇶 Martinique, etc.
    lat: cf.latitude,
    lon: cf.longitude
  };

  return new Response(JSON.stringify({ status: "ok", radar: stats }), {
    headers: { "Content-Type": "application/json" }
  });
}
