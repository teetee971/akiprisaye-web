export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf; // Le trésor : ville, région, département

  const data = {
    timestamp: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip"),
    ville: cf.city || "Inconnue",
    region: cf.region || "Inconnue", // Ex: Guadeloupe
    pays: cf.country || "Inconnu",
    coords: { lat: cf.latitude, lon: cf.longitude },
    isBot: cf.asOrganization && cf.asOrganization.toLowerCase().includes("google")
  };

  // Ici, on renvoie les infos au dashboard pour test
  return new Response(JSON.stringify({ status: "tracked", details: data }), {
    headers: { "Content-Type": "application/json" }
  });
}
