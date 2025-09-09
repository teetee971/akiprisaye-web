// functions/api/territories.js
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8",
  };
}

const TERRITORIES = [
  { code: "guadeloupe", name: "Guadeloupe", type: "DROM" },
  { code: "martinique", name: "Martinique", type: "DROM" },
  { code: "guyane", name: "Guyane française", type: "DROM" },
  { code: "reunion", name: "La Réunion", type: "DROM" },
  { code: "mayotte", name: "Mayotte", type: "DROM" },
  { code: "saint-martin", name: "Saint-Martin", type: "COM" },
  { code: "saint-barthelemy", name: "Saint-Barthélemy", type: "COM" },
  { code: "polynesie-francaise", name: "Polynésie française", type: "COM" },
  { code: "nouvelle-caledonie", name: "Nouvelle-Calédonie", type: "COM" },
  { code: "wallis-et-futuna", name: "Wallis-et-Futuna", type: "COM" },
  { code: "saint-pierre-et-miquelon", name: "Saint-Pierre-et-Miquelon", type: "COM" },
];

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders() });
  }
  return new Response(JSON.stringify({
    ok: true,
    count: TERRITORIES.length,
    territories: TERRITORIES
  }, null, 2), { status: 200, headers: corsHeaders() });
}
