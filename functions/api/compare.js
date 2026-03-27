export async function onRequest() {
  const data = { status: "active", message: "Comparison engine ready", results: [] };
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
