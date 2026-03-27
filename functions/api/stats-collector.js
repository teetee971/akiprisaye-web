export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf || {};
  const agent = request.headers.get("user-agent");
  
  const stats = {
    city: cf.city || "Pointe-à-Pitre",
    region: cf.region || "Guadeloupe",
    device: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent) ? "Mobile 📱" : "Desktop 💻",
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" }
  });
}
