export async function onRequest(context) {
  // Simule les données récoltées par ton tracker
  const peaks = [
    { hour: '08h', users: 12 },
    { hour: '12h', users: 45 }, // Pic déjeuner
    { hour: '18h', users: 28 },
    { hour: '20h', users: 54 }  // Pic soirée
  ];
  return new Response(JSON.stringify(peaks), {
    headers: { "Content-Type": "application/json" }
  });
}
