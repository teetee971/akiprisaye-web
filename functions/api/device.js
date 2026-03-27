export async function onRequest(context) {
  const agent = context.request.headers.get("user-agent");
  const isMobile = /iPhone|Android|iPad/i.test(agent);
  return new Response(JSON.stringify({ device: isMobile ? "Mobile" : "Desktop" }), {
    headers: { "Content-Type": "application/json" }
  });
}
