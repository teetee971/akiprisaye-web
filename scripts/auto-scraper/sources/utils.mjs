/**
 * sources/utils.mjs — Utilitaires partagés pour les scrapers
 *
 * Contient :
 *   - fetchWithRetry  : fetch HTTP avec ré-essais et backoff exponentiel
 *   - sleep           : pause async
 */

/**
 * Pause asynchrone.
 * @param {number} ms
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Exécute un fetch HTTP avec ré-essais automatiques en cas d'échec transitoire.
 *
 * Stratégie : backoff exponentiel (1s → 2s → 4s) avec jitter ±20%.
 * Les erreurs réseau (timeout, connexion refusée) et les codes HTTP 5xx sont
 * considérés comme transitoires et déclenchent un ré-essai.
 * Les codes HTTP 4xx sont considérés définitifs (pas de ré-essai).
 *
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number; label?: string }} options
 * @param {number} maxAttempts   Nombre total de tentatives (défaut : 3)
 * @returns {Promise<Response | null>}
 */
export async function fetchWithRetry(url, options = {}, maxAttempts = 3) {
  const { timeoutMs = 20_000, label = url.slice(0, 60), ...fetchOptions } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal, ...fetchOptions });
      clearTimeout(timer);

      // 4xx → définitif, pas de ré-essai
      if (res.status >= 400 && res.status < 500) {
        return res;
      }

      // 5xx → transitoire
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      const isLast = attempt === maxAttempts;
      if (isLast) {
        console.log(`  ❌ [fetch] ${label} — échec après ${maxAttempts} tentative(s) : ${err.message}`);
        return null;
      }
      const delay = Math.round((2 ** (attempt - 1)) * 1000 * (0.8 + Math.random() * 0.4));
      console.log(`  ⚠️  [fetch] ${label} — tentative ${attempt}/${maxAttempts} échouée (${err.message}), ré-essai dans ${delay}ms…`);
      await sleep(delay);
    }
  }
  return null;
}

/**
 * Fetch JSON avec ré-essais.
 * @param {string} url
 * @param {string} label  Label pour les logs
 * @param {string} [scraperTag]  Tag du scraper (ex: 'food', 'bqp')
 * @param {number} [maxAttempts]
 * @returns {Promise<any | null>}
 */
export async function fetchJSONWithRetry(url, label, scraperTag = '', maxAttempts = 3) {
  const tag = scraperTag ? `[${scraperTag}]` : '';
  const res = await fetchWithRetry(url, {
    timeoutMs: 20_000,
    label,
    headers: {
      'User-Agent': 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web; contact: contact@akiprisaye.fr)',
      'Accept': 'application/json',
    },
  }, maxAttempts);

  if (!res) return null;
  if (!res.ok) {
    console.log(`  ⚠️  ${tag} ${label} HTTP ${res.status}`);
    return null;
  }
  try {
    return await res.json();
  } catch (err) {
    console.log(`  ⚠️  ${tag} ${label} erreur JSON : ${err.message}`);
    return null;
  }
}

/**
 * Fetch texte avec ré-essais (pour les réponses XML/CSV).
 * @param {string} url
 * @param {string} label
 * @param {string} [scraperTag]
 * @param {number} [maxAttempts]
 * @returns {Promise<string | null>}
 */
export async function fetchTextWithRetry(url, label, scraperTag = '', maxAttempts = 3) {
  const tag = scraperTag ? `[${scraperTag}]` : '';
  const res = await fetchWithRetry(url, {
    timeoutMs: 20_000,
    label,
    headers: {
      'User-Agent': 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web)',
      'Accept': 'application/xml, text/xml, text/csv, text/plain, */*',
    },
  }, maxAttempts);

  if (!res) return null;
  if (!res.ok) {
    console.log(`  ⚠️  ${tag} ${label} HTTP ${res.status}`);
    return null;
  }
  try {
    return await res.text();
  } catch (err) {
    console.log(`  ⚠️  ${tag} ${label} erreur lecture : ${err.message}`);
    return null;
  }
}
