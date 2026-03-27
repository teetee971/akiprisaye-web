export async function onRequest(context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const data = { territory: "GP", plan: "creator", quotaRemaining: 5, status: "active" };
  return new Response(JSON.stringify(data), { headers });
}
