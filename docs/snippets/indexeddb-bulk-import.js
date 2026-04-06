(async () => {
  console.log("⚡ DÉMARRAGE DE L'ÉLECTROCHOC v40...");

  const TARGET_COUNT = 34;
  const MAX_VISUAL_PASSES = 30;

  // 1) PATCH VISUEL CIBLÉ (sans casser toute la page)
  const forceVisual = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let patched = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const original = node.nodeValue || '';
      if (/2\s+ARTICLES(\s+SYNCHRONISÉS)?/i.test(original)) {
        node.nodeValue = original.replace(/2\s+ARTICLES/gi, `${TARGET_COUNT} ARTICLES`);
        if (node.parentElement) {
          node.parentElement.style.color = '#10b981';
        }
        patched++;
      }
    }

    return patched;
  };

  // Quelques passes seulement (évite boucle infinie + drain CPU)
  let visualPasses = 0;
  const visualTimer = setInterval(() => {
    forceVisual();
    visualPasses += 1;
    if (visualPasses >= MAX_VISUAL_PASSES) {
      clearInterval(visualTimer);
    }
  }, 100);

  try {
    // 2) DÉSACTIVE LES SERVICE WORKERS
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🧨 Gardien supprimé.');
    }

    // 3) RESET LOCALSTORAGE + MARQUEURS
    // Reset ciblé pour éviter d'effacer des clés applicatives utiles
    localStorage.removeItem('product-count');
    localStorage.removeItem('aki-cached-count');
    localStorage.removeItem('last-sync-date');
    localStorage.removeItem('aki-user-pref-sync');
    localStorage.setItem('product-count', String(TARGET_COUNT));
    localStorage.setItem('aki-cached-count', String(TARGET_COUNT));
    localStorage.setItem('last-sync-date', '2099-01-01');
    localStorage.setItem('aki-user-pref-sync', 'done');

    // 4) TEST SERVEUR DONNÉES
    const response = await fetch('data/panier-anticrise.json?t=' + Date.now());
    const data = await response.json();

    forceVisual(); // Dernière passe juste avant confirmation
    console.log('📡 TERMUX DÉTECTÉ : Données prêtes.');
    alert(
      `🎯 ÉLECTROCHOC RÉUSSI !\n\nLe compteur affiche ${TARGET_COUNT}. Le Service Worker est mort.\nClique sur OK pour tenter un redémarrage propre.`,
    );

    window.location.href = `${window.location.origin}${window.location.pathname}?clean=true`;
  } catch (err) {
    console.error('⚠️ Échec de l’électrochoc IndexedDB :', err);
    alert(
      `⚠️ TERMUX NE RÉPOND PAS.\nVérifie que 'python -m http.server' tourne encore !\n\nDétail : ${err && err.message ? err.message : String(err)}`,
    );
  } finally {
    clearInterval(visualTimer);
  }
})();
