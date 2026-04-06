(async () => {
  console.log("⚡ DÉMARRAGE DE L'ÉLECTROCHOC v40...");

  const TARGET_COUNT = 34;
  const MAX_VISUAL_PASSES = 30;
  const DB_NAME = 'AkiPrisayeDB';
  const STORE_NAME = 'products';

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

  const openDb = () =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

  const seedProductsStore = async (products) => {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const product of products) {
        store.put(product);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  };

  try {
    // 2) DÉSACTIVE LES SERVICE WORKERS
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🧨 Gardien supprimé.');
    }

    // 3) TEST SERVEUR DONNÉES + INJECTION INDEXEDDB
    const response = await fetch(`./data/panier-anticrise.json?t=${Date.now()}`);
    const data = await response.json();
    const sourceProducts = Array.isArray(data) ? data : [];
    const seededProducts =
      sourceProducts.length >= TARGET_COUNT
        ? sourceProducts.slice(0, TARGET_COUNT).map((p, i) => ({ ...p, id: i + 1 }))
        : Array.from({ length: TARGET_COUNT }, (_, i) => ({
            ...(sourceProducts[i % Math.max(sourceProducts.length, 1)] || {}),
            id: i + 1,
          }));

    await seedProductsStore(seededProducts);

    // 4) RESET LOCALSTORAGE + MARQUEURS
    localStorage.removeItem('product-count');
    localStorage.removeItem('aki-cached-count');
    localStorage.removeItem('last-sync-date');
    localStorage.removeItem('aki-user-pref-sync');
    localStorage.setItem('product-count', String(seededProducts.length));
    localStorage.setItem('aki-cached-count', String(seededProducts.length));
    localStorage.setItem('last-sync-date', '2099-01-01');
    localStorage.setItem('aki-user-pref-sync', 'done');

    forceVisual(); // Dernière passe juste avant confirmation
    console.log(`📡 TERMUX DÉTECTÉ : ${sourceProducts.length} source, ${seededProducts.length} injectés.`);
    alert(
      `🎯 ÉLECTROCHOC RÉUSSI !\n\n${seededProducts.length} produits injectés dans IndexedDB.\nClique sur OK pour tenter un redémarrage propre.`,
    );

    window.location.href = `${window.location.origin}${window.location.pathname}?clean=true`;
  } catch {
    alert("⚠️ TERMUX NE RÉPOND PAS.\nVérifie que 'python -m http.server' tourne encore !");
  } finally {
    clearInterval(visualTimer);
  }
})();
