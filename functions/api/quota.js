export async function onRequest() {
  const data = { territory: "GP", plan: "creator", quotaRemaining: 5, status: "active" };
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
