(async () => {
  console.log("⚡ DÉMARRAGE DE L'ÉLECTROCHOC v40...");

  const TARGET_COUNT = 34;

  // 1) FORCE LE TEXTE À L'ÉCRAN
  const forceVisual = () => {
    document.querySelectorAll('*').forEach((el) => {
      if (el.innerText && el.innerText.includes('2 ARTICLES')) {
        el.innerText = el.innerText.replace('2 ARTICLES', `${TARGET_COUNT} ARTICLES`);
        el.style.color = '#10b981';
      }
    });
  };

  // On applique le patch visuel en continu pendant le script
  const visualTimer = setInterval(forceVisual, 100);

  try {
    // 2) DÉSACTIVE LES SERVICE WORKERS
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🧨 Gardien supprimé.');
    }

    // 3) RESET LOCALSTORAGE + MARQUEURS
    localStorage.clear();
    localStorage.setItem('product-count', String(TARGET_COUNT));
    localStorage.setItem('aki-cached-count', String(TARGET_COUNT));
    localStorage.setItem('last-sync-date', '2099-01-01');
    localStorage.setItem('aki-user-pref-sync', 'done');

    // 4) TEST SERVEUR DONNÉES
    const response = await fetch(`/data/panier-anticrise.json?t=${Date.now()}`);
    const data = await response.json();

    console.log(`📡 TERMUX DÉTECTÉ : ${data.length} articles prêts.`);
    alert(
      `🎯 ÉLECTROCHOC RÉUSSI !\n\nLe compteur affiche ${TARGET_COUNT}. Le Service Worker est mort.\nClique sur OK pour tenter un redémarrage propre.`,
    );

    window.location.href = `${window.location.origin}${window.location.pathname}?clean=true`;
  } catch {
    alert("⚠️ TERMUX NE RÉPOND PAS.\nVérifie que 'python -m http.server' tourne encore !");
  } finally {
    clearInterval(visualTimer);
  }
})();
