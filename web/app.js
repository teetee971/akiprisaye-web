// Service de comparaison de prix intégré avec Data.gouv API
const out = document.getElementById('output');
const write = (o) => { out.textContent = (typeof o === 'string') ? o : JSON.stringify(o,null,2) };

// Import du service API avec cache localStorage
let apiService;

// Initialisation du service API
async function initApiService() {
  if (!apiService) {
    // Charger le service API si pas déjà disponible
    if (typeof ApiService === 'undefined') {
      await loadScript('/js/api.js');
    }
    apiService = window.apiService || new ApiService();
  }
  return apiService;
}

// Fonction utilitaire pour charger des scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Chargement des prix via l'API avec cache
async function loadPrices(territory = 'guadeloupe', useCache = true){
  try {
    const api = await initApiService();
    
    if (!useCache) {
      api.clearCache('prices');
    }
    
    const result = await api.getPrices({ 
      territory, 
      limit: 50,
      sort: 'price' 
    });
    
    if (!result.ok) {
      console.warn('API indisponible, utilisation des données de fallback');
      return await loadFallbackPrices();
    }
    
    return result;
  } catch (error) {
    console.error('Erreur lors du chargement des prix:', error);
    return await loadFallbackPrices();
  }
}

// Données de fallback en cas d'erreur API
async function loadFallbackPrices() {
  try {
    const res = await fetch('../mock_api/prices.json');
    return await res.json();
  } catch (error) {
    console.error('Impossible de charger les données de fallback:', error);
    return {
      ok: false,
      items: [],
      message: 'Aucune donnée disponible'
    };
  }
}

// Comparaison de prix réelle entre DOM et Hexagone avec API
async function demoCompare(){
  try {
    write('🔄 Chargement des données de comparaison...');
    
    const api = await initApiService();
    const result = await api.comparePrice('guadeloupe');
    
    if (!result.ok) {
      write({ error: 'Erreur lors de la comparaison', message: result.error || 'Service indisponible' });
      return;
    }
    
    // Afficher les statistiques du cache
    const cacheStats = api.getCacheStats();
    
    write({ 
      message: `TOP écarts DOM/Hexagone - ${result.territory}`, 
      count: result.count,
      items: result.items.slice(0,8),
      cache: `${cacheStats.validEntries} entrées en cache`
    });
    
    // Sauvegarder les résultats dans localStorage pour consultation ultérieure
    localStorage.setItem('akp_last_comparison', JSON.stringify({
      timestamp: Date.now(),
      territory: result.territory,
      data: result.items.slice(0,20)
    }));
    
  } catch (error) {
    console.error('Erreur lors de la comparaison:', error);
    write({ error: 'Erreur de comparaison', details: error.message });
  }
}

// IA démo: forecast simple => moyenne mobile + seuil
async function demoForecast(){
  const res = await fetch('../mock_api/series.json');
  const {series} = await res.json();
  const window = 3;
  const ma = series.map((v,i,arr)=>{
    const s = arr.slice(Math.max(0,i-window+1),i+1);
    return {t:i, value:v, ma: s.reduce((a,b)=>a+b,0)/s.length };
  });
  // prévision = dernière moyenne + micro random
  const last = ma[ma.length-1].ma;
  const forecast = +(last * (1+ (Math.random()-0.5)*0.02)).toFixed(4);
  write({ message:'Prévision inflation (démo)', last_ma:last, forecast });
}

// Vwa Peyi — synthèse vocale basique (navigateur)
function demoVoice(){
  const msg = new SpeechSynthesisUtterance("Pri-la ka monté, mé nou ké trapé bon ti promo !");
  msg.lang = 'fr-FR'; // démo FR (créole TTS non standard selon OS)
  speechSynthesis.speak(msg);
  write('🔊 Vwa Peyi : phrase parlée (voir réglages audio)');
}

// Radar cherté — alerte si produit dépasse seuil avec API réelle
async function demoAlerts(){
  try {
    write('🔄 Analyse des alertes de cherté...');
    
    const api = await initApiService();
    const data = await api.comparePrice('guadeloupe');
    
    if (!data.ok) {
      write({ error: 'Impossible de récupérer les données pour les alertes' });
      return;
    }
    
    const seuil = 15; // %
    const flagged = data.items.filter(p => p.delta_pct >= seuil);
    
    // Sauvegarder les alertes avec timestamp
    const alertsData = {
      timestamp: Date.now(),
      seuil,
      territory: data.territory,
      alerts: flagged.slice(0,20)
    };
    
    localStorage.setItem('akp_alerts', JSON.stringify(alertsData));
    
    write({ 
      message: `🚨 Produits au-dessus du seuil ${seuil}% - ${data.territory}`, 
      count: flagged.length, 
      items: flagged.slice(0,10),
      savedToCache: true
    });
    
    // Notification si beaucoup d'alertes
    if (flagged.length > 10) {
      write(`⚠️ Attention: ${flagged.length} produits dépassent le seuil de cherté !`);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse des alertes:', error);
    write({ error: 'Erreur d\'analyse', details: error.message });
  }
}

// Wiring UI
document.getElementById('btn-compare').onclick = demoCompare;
document.getElementById('btn-ia').onclick = demoForecast;
document.getElementById('btn-vwa').onclick = demoVoice;
document.querySelectorAll('[data-demo="compare"]').forEach(b=> b.onclick = demoCompare);
document.querySelectorAll('[data-demo="forecast"]').forEach(b=> b.onclick = demoForecast);
document.querySelectorAll('[data-demo="voice"]').forEach(b=> b.onclick = demoVoice);
document.querySelectorAll('[data-demo="alerts"]').forEach(b=> b.onclick = demoAlerts);

// Nouvelles fonctions utilitaires

// Vider le cache et recharger
async function clearCacheAndReload() {
  try {
    const api = await initApiService();
    api.clearCache();
    write('🗑️ Cache vidé - prochaines requêtes seront fraîches');
  } catch (error) {
    write({ error: 'Erreur lors du vidage du cache', details: error.message });
  }
}

// Afficher les statistiques du cache
async function showCacheStats() {
  try {
    const api = await initApiService();
    const stats = api.getCacheStats();
    write({ 
      message: '📊 Statistiques du cache',
      ...stats,
      cacheSize: `${Math.round(stats.totalSize / 1024)} KB`
    });
  } catch (error) {
    write({ error: 'Erreur lors de la récupération des stats', details: error.message });
  }
}

// Fonction de test de connectivité API
async function testApiConnectivity() {
  try {
    write('🔍 Test de connectivité API...');
    
    const api = await initApiService();
    
    // Tester les différents endpoints
    const tests = {
      territories: false,
      prices: false,
      news: false
    };
    
    try {
      await api.getTerritories();
      tests.territories = true;
    } catch (e) { console.warn('Territories API failed:', e.message); }
    
    try {
      await api.getPrices({ territory: 'guadeloupe', limit: 1 });
      tests.prices = true;
    } catch (e) { console.warn('Prices API failed:', e.message); }
    
    try {
      await api.getNews();
      tests.news = true;
    } catch (e) { console.warn('News API failed:', e.message); }
    
    const successCount = Object.values(tests).filter(Boolean).length;
    
    write({
      message: `🌐 Test de connectivité terminé`,
      success: `${successCount}/3 endpoints fonctionnels`,
      details: tests,
      recommendation: successCount === 3 ? 'Tous les services sont opérationnels' : 
                     successCount > 0 ? 'Fonctionnement partiel - certains services indisponibles' :
                     'Aucun service disponible - vérifiez votre connexion'
    });
    
  } catch (error) {
    write({ error: 'Erreur lors du test de connectivité', details: error.message });
  }
}

// Ajouter les nouveaux boutons s'ils existent
document.querySelectorAll('[data-demo="cache-clear"]').forEach(b=> b.onclick = clearCacheAndReload);
document.querySelectorAll('[data-demo="cache-stats"]').forEach(b=> b.onclick = showCacheStats);
document.querySelectorAll('[data-demo="api-test"]').forEach(b=> b.onclick = testApiConnectivity);

// Service worker (offline démo)
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('../sw.js').catch(console.warn);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Pré-charger le service API
    await initApiService();
    console.log('✅ Service API initialisé');
    
    // Afficher un message de bienvenue avec les stats du cache
    const api = window.apiService;
    const stats = api.getCacheStats();
    
    if (stats.validEntries > 0) {
      write(`💾 ${stats.validEntries} données en cache disponibles`);
    } else {
      write('🌐 Prêt à charger des données fraîches depuis l\'API');
    }
    
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation:', error);
    write('⚠️ Mode fallback activé - fonctionnalités limitées');
  }
});
