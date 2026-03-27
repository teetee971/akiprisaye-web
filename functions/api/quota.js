export async function onRequest(context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
  if (context.request.method === "OPTIONS") return new Response(null, { headers });
  return new Response(JSON.stringify({ status: "ok", version: "27/03 à 06:03" }), { headers });
}
