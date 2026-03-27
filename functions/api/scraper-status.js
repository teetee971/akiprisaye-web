export async function onRequest(context) {
  const robots = [
    { name: "Carrefour Destreland", status: "online", health: 98, lastScan: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
    { name: "Leclerc Galleria", status: "online", health: 95, lastScan: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { name: "TotalEnergies 971", status: "online", health: 100, lastScan: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { name: "Vito Martinique", status: "warning", health: 60, lastScan: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), note: "Erreur" },
    { name: "Prix Fruits/Légumes", status: "offline", health: 0, lastScan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), note: "Maintenance" }
    { name: "Carrefour Destreland", status: "online", health: 98, lastScan: "Il y a 12 min" },
    { name: "Leclerc Galleria", status: "online", health: 95, lastScan: "Il y a 45 min" },
    { name: "TotalEnergies 971", status: "online", health: 100, lastScan: "Il y a 5 min" },
    { name: "Vito Martinique", status: "warning", health: 60, lastScan: "Il y a 3h (Erreur)" },
    { name: "Prix Fruits/Légumes", status: "offline", health: 0, lastScan: "Hier (Maintenance)" }
  ];

  return new Response(JSON.stringify(robots), {
    headers: { "Content-Type": "application/json" }
  });
}
