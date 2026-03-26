export const trackClick = async (productId: string, amount: number) => {
  const eventData = {
    productId,
    amount,
    timestamp: Date.now(),
    type: 'PPC_CLICK'
  };

  try {
    const response = await fetch('https://akiprisaye-api.pages.dev/api/revenue/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) throw new Error("Serveur indisponible");
    return true;
  } catch (error) {
    console.warn("Échec du tracking (Cloudflare HS). Sauvegarde locale du revenu...");
    // On stocke dans le localStorage pour un replay ultérieur
    const queue = JSON.parse(localStorage.getItem('revenue_queue') || '[]');
    queue.push(eventData);
    localStorage.setItem('revenue_queue', JSON.stringify(queue));
    
    // On demande au navigateur de surveiller le retour du réseau
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore
      await registration.sync.register('sync-revenue');
    }
    return false;
  }
};
