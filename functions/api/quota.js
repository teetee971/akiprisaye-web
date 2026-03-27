export async function onRequest() {
  return new Response(JSON.stringify({ territory: "GP", plan: "creator", quotaRemaining: 5, status: "active" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
