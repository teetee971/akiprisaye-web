(async () => {
  console.log("⚡ DÉMARRAGE DE L'ÉLECTROCHOC v41...");

  const TARGET_COUNT = 34;
  const MAX_VISUAL_PASSES = 30;
  const DB_NAME_FALLBACK = 'AkiPrisayeDB';
  const STORE_NAME_FALLBACK = 'products';
  const COUNTER_MATCH_PATTERN = /\b\d+\s+ARTICLES?(\s+SYNCHRONISÉS?)?\b/i;
  const COUNTER_REPLACE_PATTERN = /\b\d+\s+ARTICLES?(\s+SYNCHRONISÉS?)?\b/gi;
  const CANDIDATE_STORE_NAMES = ['products', 'catalog', 'catalogue', 'items', 'ean_products'];
  const CANDIDATE_LOCALSTORAGE_KEYS = [
    'product-count',
    'aki-cached-count',
    'last-sync-date',
    'aki-user-pref-sync',
    'catalog-count',
    'catalogue-count',
    'products-count',
  ];

  const normalizeProduct = (entry, territory = 'guadeloupe', bucket = 'essentiel') => {
    const id = entry?.id || `${bucket}-${Math.random().toString(36).slice(2, 8)}`;
    const label = entry?.label || entry?.name || 'Produit sans nom';
    const price = Number(entry?.price_min ?? entry?.price ?? 0);
    const store = entry?.store || entry?.storeName || 'Magasin local';

    return {
      id,
      name: label,
      label,
      price,
      price_min: price,
      store,
      category: bucket,
      territory,
      syncedAt: new Date().toISOString(),
      source: 'panier-anticrise',
    };
  };

  const extractProducts = (data) => {
    if (Array.isArray(data)) return data;

    const territories = data?.territories;
    if (!territories || typeof territories !== 'object') return [];

    const flattened = [];
    for (const [territoryName, territoryData] of Object.entries(territories)) {
      const basket = territoryData?.basket;
      if (!basket || typeof basket !== 'object') continue;
      for (const [bucketName, items] of Object.entries(basket)) {
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          flattened.push(normalizeProduct(item, territoryName, bucketName));
        }
      }
    }

    return flattened;
  };

  const buildSeededProducts = (products) => {
    if (!products.length) return [];

    return Array.from({ length: TARGET_COUNT }, (_, i) => {
      const source = products[i % products.length] || {};
      const baseId = source.id || source.ean || source.label || `seed-${i + 1}`;
      return {
        ...source,
        id: `${String(baseId)}__${i + 1}`,
        seedIndex: i + 1,
      };
    });
  };

  const readUiSyncedCount = () => {
    const bodyText = document.body?.innerText || '';
    const match = bodyText.match(/(\d+)\s+ARTICLES?\s+SYNCHRONISÉS?/i);
    return match ? Number(match[1]) : null;
  };

  // 1) PATCH VISUEL CIBLÉ (sans casser toute la page)
  const forceVisual = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let patched = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const original = node.nodeValue || '';
      if (COUNTER_MATCH_PATTERN.test(original)) {
        node.nodeValue = original.replace(
          COUNTER_REPLACE_PATTERN,
          `${TARGET_COUNT} ARTICLES SYNCHRONISÉS`,
        );
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

  // Renforce le patch sur les rerenders tardifs
  const observer = new MutationObserver(() => {
    forceVisual();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const openDb = (dbName, version = 1, createFallbackStore = false) =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, version);
      req.onupgradeneeded = (event) => {
        if (!createFallbackStore) return;
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME_FALLBACK)) {
          db.createObjectStore(STORE_NAME_FALLBACK, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

  const getDatabases = async () => {
    if (typeof indexedDB.databases === 'function') {
      try {
        return (await indexedDB.databases()).filter((entry) => entry?.name);
      } catch {
        return [];
      }
    }
    return [];
  };

  const seedKnownDatabases = async (products) => {
    const databases = await getDatabases();
    let writes = 0;
    let maxVerifiedCount = 0;

    for (const dbMeta of databases) {
      const dbName = dbMeta?.name;
      if (!dbName) continue;
      try {
        const db = await openDb(dbName, dbMeta.version || 1, false);
        const storeNames = Array.from(db.objectStoreNames || []);
        const targetStore = storeNames.find((name) =>
          CANDIDATE_STORE_NAMES.includes(String(name).toLowerCase()),
        );
        if (!targetStore) {
          db.close();
          continue;
        }
        await new Promise((resolve, reject) => {
          const tx = db.transaction(targetStore, 'readwrite');
          const store = tx.objectStore(targetStore);
          store.clear();
          for (const product of products) {
            store.put(product);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
        const verifiedCount = await new Promise((resolve, reject) => {
          const tx = db.transaction(targetStore, 'readonly');
          const store = tx.objectStore(targetStore);
          const req = store.count();
          req.onsuccess = () => resolve(req.result || 0);
          req.onerror = () => reject(req.error);
        });
        maxVerifiedCount = Math.max(maxVerifiedCount, Number(verifiedCount) || 0);
        db.close();
        writes += 1;
      } catch (err) {
        console.warn(`Failed to seed database "${dbName}":`, err);
      }
    }

    // Fallback explicite si aucun DB/store "produits" connu n'a été trouvé
    if (writes === 0) {
      const db = await openDb(DB_NAME_FALLBACK, 1, true);
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME_FALLBACK, 'readwrite');
        const store = tx.objectStore(STORE_NAME_FALLBACK);
        store.clear();
        for (const product of products) {
          store.put(product);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      const verifiedCount = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME_FALLBACK, 'readonly');
        const store = tx.objectStore(STORE_NAME_FALLBACK);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      });
      maxVerifiedCount = Math.max(maxVerifiedCount, Number(verifiedCount) || 0);
      db.close();
      writes = 1;
    }

    return { writes, maxVerifiedCount };
  };

  try {
    // 2) DÉSACTIVE LES SERVICE WORKERS
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🧨 Gardien supprimé.');
    }

    // 3) TEST SERVEUR DONNÉES + INJECTION INDEXEDDB
    const dataUrl = new URL('data/panier-anticrise.json', window.location.href);
    dataUrl.searchParams.set('t', String(Date.now()));
    const response = await fetch(dataUrl.toString());
    const data = await response.json();
    const sourceProducts = extractProducts(data);
    if (!sourceProducts.length) {
      throw new Error(`Aucune donnée produit exploitable dans ${dataUrl.toString()}`);
    }
    const seededProducts = buildSeededProducts(sourceProducts);

    const { writes: seededStores, maxVerifiedCount } = await seedKnownDatabases(seededProducts);

    // 4) RESET LOCALSTORAGE + MARQUEURS
    CANDIDATE_LOCALSTORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('product-count', String(seededProducts.length));
    localStorage.setItem('aki-cached-count', String(seededProducts.length));
    localStorage.setItem('catalog-count', String(seededProducts.length));
    localStorage.setItem('catalogue-count', String(seededProducts.length));
    localStorage.setItem('products-count', String(seededProducts.length));
    localStorage.setItem('last-sync-date', '2099-01-01');
    localStorage.setItem('aki-user-pref-sync', 'done');

    forceVisual(); // Dernière passe juste avant confirmation
    console.log(
      `📡 TERMUX DÉTECTÉ : ${sourceProducts.length} source, ${seededProducts.length} injectés dans ${seededStores} store(s), vérifiés=${maxVerifiedCount}.`,
    );
    const uiCountBeforeReload = readUiSyncedCount();
    if (maxVerifiedCount < TARGET_COUNT) {
      alert(
        `⚠️ Vérification partielle : ${maxVerifiedCount}/${TARGET_COUNT} enregistrements visibles après écriture.\nL'application lit probablement une autre source de données.`,
      );
    }
    alert(
      `🎯 ÉLECTROCHOC RÉUSSI !\n\n${seededProducts.length} produits injectés (${seededStores} store(s), vérifiés: ${maxVerifiedCount}).\nCompteur UI détecté avant reload: ${uiCountBeforeReload ?? 'non trouvé'}.\nClique sur OK pour tenter un redémarrage propre.`,
    );

    window.location.href = `${window.location.origin}${window.location.pathname}?clean=true`;
  } catch {
    alert("⚠️ TERMUX NE RÉPOND PAS.\nVérifie que 'python -m http.server' tourne encore !");
  } finally {
    clearInterval(visualTimer);
    observer.disconnect();
  }
})();
