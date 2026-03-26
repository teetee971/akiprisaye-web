export async function onRequest(context) {
  const data = {
    territory: "GP",
    plan: "creator",
    quotaRemaining: 5,
    status: "active"
  };
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
