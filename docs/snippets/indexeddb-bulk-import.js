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
  const CHUNK_SIZE = 100;
  const FETCH_TIMEOUT_MS = 8000;

  const runtimeOrigin =
    typeof location !== 'undefined' && /^https?:/i.test(location.origin)
      ? location.origin
      : FALLBACK_ORIGIN;

  function buildUrl(path) {
    return new URL(path, runtimeOrigin).toString();
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

  function extractProducts(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.products)) return payload.products;
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
    const looksLikeUrl = /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/');

    if (looksLikeUrl) {
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

        return { url, products, tried };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ ${url} → ${message}`);
      }
    }

    throw new Error(
      `Aucun dataset JSON valide trouvé (ou délai dépassé ${FETCH_TIMEOUT_MS} ms). URL testées :\n- ${tried.join('\n- ')}`,
    );
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

    if (db.objectStoreNames.contains(STORE_NAME)) {
      return db;
    }

    const repairedVersion = db.version + 1;
    db.close();

    console.warn(
      `⚠️ Store "${STORE_NAME}" absent. Réparation automatique en version ${repairedVersion}...`,
    );

    return openDb(repairedVersion);
  }

  function clearStore(db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Échec du vidage du store'));
      tx.onabort = () => reject(tx.error || new Error('Transaction annulée pendant clear()'));
    });
  }

  function insertChunk(db, items) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const item of items) {
        store.put(item);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Échec d’insertion du chunk'));
      tx.onabort = () => reject(tx.error || new Error('Transaction annulée pendant insertion'));
    });
  }

  try {
    console.log(`🌍 Origine utilisée : ${runtimeOrigin}`);
    console.log('🔎 Recherche du JSON disponible...');

    let fileLabel = 'source locale';
    let products = null;
    const preferredUrl = prompt(
      "URL JSON personnalisée (laisser vide pour auto-détection). Ex: /data/observatoire/prix-panier-base.json",
      '',
    );

    try {
      const found = await resolveFirstReachableUrl(preferredUrl || '');
      fileLabel = found.url;
      products = found.products;
    } catch (networkError) {
      console.warn('⚠️ Aucun dataset distant valide trouvé. Basculage vers import local (.json).');
      console.warn(networkError);
      let rawText;
      try {
        rawText = await pickLocalJsonText();
      } catch (localPickerError) {
        console.warn('⚠️ Sélecteur de fichier indisponible (souvent: absence de user activation).');
        console.warn(localPickerError);
        rawText = await readJsonFromPromptOrUrl();
      }
      const payload = JSON.parse(rawText);
      products = extractProducts(payload);
      fileLabel = 'source manuelle/locale';
    }

    if (!products) {
      throw new Error('Impossible d’extraire products[] depuis la source distante ou le fichier local.');
    }

    console.log(`📁 Fichier retenu : ${fileLabel}`);
    console.log(`📦 ÉTAPE 1 : ${products.length} produits prêts à l’injection.`);

    const db = await ensureProductsStore();
    await clearStore(db);

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const part = products.slice(i, i + CHUNK_SIZE);
      await insertChunk(db, part);
      const inserted = Math.min(i + CHUNK_SIZE, products.length);
      console.log(`💉 Injection : ${inserted}/${products.length}...`);
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    db.close();
    alert(`🏆 VICTOIRE FINALE ! ${products.length} produits chargés.`);
    location.reload();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ CRASH :', message);
    alert(`Ton téléphone a encore fait une indigestion : ${message}`);
  }
})();
