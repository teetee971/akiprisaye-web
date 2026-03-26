export const smartFetch = async (url: string, options = {}) => {
  const cacheKey = `cache_${url}`;

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.clone().json();
      // On sauvegarde la version fraîche
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return response;
    }
  } catch (error) {
    console.warn("Mode Offline: Récupération des données depuis le cache local.");
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      // On simule une réponse réussie avec les vieilles données
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' }
      });
    }
  }
  // Si rien en cache et pas de réseau, on laisse l'erreur passer
  return fetch(url, options);
};
