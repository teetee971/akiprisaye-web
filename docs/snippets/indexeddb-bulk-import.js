(async () => {
  console.log('🦾 DÉMARRAGE DE LA SERINGUE 2.5 (mode assisté)...');

  if (typeof location !== 'undefined' && location.protocol === 'devtools:') {
    const message =
      'Contexte DevTools détecté (devtools://). Ouvre la Console sur la page cible (contexte "top"), puis relance le script.';
    console.error(`❌ ${message}`);
    alert(message);
    return;
  }

  const FILE_CANDIDATES = [
    '/data/data_ultra_1775330358.json',
    '/data/prices.json',
    '/data/prices-dataset.json',
    '/data/expanded-prices.json',
    '/data/catalogue.json',
    '/prices.json',
    '/prices-dataset.json',
    '/expanded-prices.json',
    '/catalogue.json',
  ];
  const FALLBACK_ORIGIN = 'https://akiprisaye-v13-horizon.pages.dev';
  const DB_NAME = 'AkiPrisayeDB';
  const STORE_NAME = 'products';
  const CHUNK_SIZE = 500;
  const FETCH_TIMEOUT_MS = 8000;

  const runtimeOrigin =
    typeof location !== 'undefined' && /^https?:/i.test(location.origin)
      ? location.origin
      : FALLBACK_ORIGIN;
  const appBasePath = (() => {
    if (typeof document === 'undefined') return '/';
    const baseHref = document.querySelector('base[href]')?.getAttribute('href');
    if (!baseHref) return '/';
    try {
      const parsed = new URL(baseHref, runtimeOrigin);
      return parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
    } catch {
      return '/';
    }
  })();

  function buildUrl(path) {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const prefixedPath =
      appBasePath !== '/' && !normalizedPath.startsWith('api/')
        ? `${appBasePath}${normalizedPath}`
        : `/${normalizedPath}`;
    return new URL(prefixedPath, runtimeOrigin).toString();
  }

  function assertNotDevtoolsUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return;

    try {
      const url = new URL(value, runtimeOrigin);
      const protocol = url.protocol.toLowerCase();
      const hostname = url.hostname.toLowerCase();

      if (
        protocol === 'devtools:' ||
        protocol === 'chrome:' ||
        hostname === 'chrome-devtools-frontend.appspot.com' ||
        value.toLowerCase().includes('targettype=tab')
      ) {
        throw new Error(
          'URL DevTools détectée. Utilise une URL de données JSON (https://.../data/...json), pas devtools://',
        );
      }
    } catch {
      // Fallback for unparsable values: keep conservative string-based checks
      const lower = value.toLowerCase();
      if (
        lower.startsWith('devtools://') ||
        lower.startsWith('chrome://') ||
        lower.includes('targettype=tab')
      ) {
        throw new Error(
          'URL DevTools détectée. Utilise une URL de données JSON (https://.../data/...json), pas devtools://',
        );
      }
    }
  }

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function isLikelyProductRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    const productIdentityKeys = ['id', 'name', 'title', 'sku', 'slug', 'reference'];
    return productIdentityKeys.some((key) => key in value);
  }

  function isProductArray(value) {
    return Array.isArray(value) && value.every(isLikelyProductRecord);
  }

  function extractProducts(payload) {
    if (isProductArray(payload?.products)) return payload.products;
    if (isProductArray(payload)) return payload;
    return null;
  }

  function pickLocalJsonText() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = async () => {
        try {
          const file = input.files?.[0];
          if (!file) {
            reject(new Error('Aucun fichier sélectionné.'));
            return;
          }
          const text = await file.text();
          resolve(text);
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          input.remove();
        }
      };

      input.click();
    });
  }

  async function readJsonFromPromptOrUrl() {
    const input = prompt(
      "Import secours: colle le JSON ici, OU colle une URL JSON complète (https://...).",
      '',
    );

    if (!input || !input.trim()) {
      throw new Error('Aucune donnée manuelle fournie.');
    }

    const trimmed = input.trim();
    const looksLikeUrl = /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || (trimmed.includes('.') && !trimmed.includes(' '));

    if (looksLikeUrl) {
      assertNotDevtoolsUrl(trimmed);
      const url = /^https?:\/\//i.test(trimmed) ? trimmed : buildUrl(trimmed);
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error(`URL manuelle invalide (${response.status}) : ${url}`);
      }
      return response.text();
    }

    return trimmed;
  }

  async function resolveFirstReachableUrl(preferredUrl) {
    const tried = [];
    const queue = [];

    if (preferredUrl && preferredUrl.trim()) {
      const trimmed = preferredUrl.trim();
      assertNotDevtoolsUrl(trimmed);
      const absolute = /^https?:\/\//i.test(trimmed) ? trimmed : buildUrl(trimmed);
      queue.push(absolute);
    }

    for (const path of FILE_CANDIDATES) {
      queue.push(buildUrl(path));
    }

    const uniqueQueue = [...new Set(queue)];

    for (const url of uniqueQueue) {
      tried.push(url);
      console.log(`🔎 Test URL: ${url}`);

      try {
        const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
        if (!response.ok) {
          console.warn(`⚠️ ${url} → HTTP ${response.status}`);
          continue;
        }

        const rawText = await response.text();
        let payload;
        try {
          payload = JSON.parse(rawText);
        } catch {
          console.warn(`⚠️ ${url} → réponse non JSON (probable HTML de fallback SPA)`);
          continue;
        }

        const products = extractProducts(payload);
        if (!products) {
          console.warn(`⚠️ ${url} → JSON valide mais sans tableau products[]`);
          continue;
        }
        patched++;
      }
    }

    console.warn(
      `⚠️ Aucun dataset JSON valide trouvé (ou délai dépassé ${FETCH_TIMEOUT_MS} ms). URL testées :\n- ${tried.join('\n- ')}`,
    );
    return null;
  }

  function openDb(version = 1) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, version);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Impossible d’ouvrir IndexedDB'));
    });
  }

  async function ensureProductsStore() {
    const db = await openDb(1);

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
    console.log(`🌍 Origine utilisée : ${runtimeOrigin}`);
    console.log('🔎 Recherche du JSON disponible...');

    let fileLabel = 'source locale';
    let products = null;
    const wantsCustomUrl = confirm(
      'Tu veux saisir une URL JSON personnalisée ? (OK = oui, Annuler = auto-détection)',
    );
    const preferredUrl = wantsCustomUrl
      ? prompt(
          "URL JSON personnalisée (laisser vide pour auto-détection). Ex: /data/observatoire/prix-panier-base.json",
          '',
        )
      : '';

    try {
      const found = await resolveFirstReachableUrl(preferredUrl || '');
      if (found) {
        fileLabel = found.url;
        products = found.products;
      }
    } catch {
      // Le détail est déjà journalisé.
    }

    if (!products) {
      console.warn('⚠️ Aucun dataset distant valide trouvé. Basculage vers import local (.json).');
      let rawText;
      try {
        rawText = await pickLocalJsonText();
      } catch (localPickerError) {
        console.warn('⚠️ Sélecteur de fichier indisponible (souvent: absence de user activation).');
        console.warn(localPickerError);
        try {
          rawText = await readJsonFromPromptOrUrl();
        } catch {
          alert(
            "Aucune source exploitable trouvée. Conseil: relance le script puis colle directement une URL JSON valide quand demandé (ou colle le JSON brut).",
          );
          return;
        }
      }
      const payload = JSON.parse(rawText);
      products = extractProducts(payload);
      fileLabel = 'source manuelle/locale';
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

    db.close();
    alert(`🏆 VICTOIRE FINALE ! ${products.length} produits chargés.`);
    if (confirm('Import terminé. Recharger la page maintenant ?')) {
      location.reload();
    }
  } catch (err) {
    console.error('⚠️ Échec de l’électrochoc IndexedDB :', err);
    alert(
      `⚠️ TERMUX NE RÉPOND PAS.\nVérifie que 'python -m http.server' tourne encore !\n\nDétail : ${err && err.message ? err.message : String(err)}`,
    );
  } finally {
    clearInterval(visualTimer);
    observer.disconnect();
  }
})();
