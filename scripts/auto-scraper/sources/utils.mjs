/**
 * sources/utils.mjs — Utilitaires partagés pour les scrapers
 *
 * Contient :
 *   - sleep                : pause async
 *   - fetchWithRetry       : fetch HTTP avec ré-essais et backoff exponentiel
 *   - fetchJSONWithRetry   : fetch JSON avec ré-essais
 *   - fetchTextWithRetry   : fetch XML/CSV avec ré-essais
 *   - isScrapingAllowed    : vérifie robots.txt avant tout scraping (politesse)
 *   - makeRateLimiter      : délai minimum entre requêtes vers un même domaine
 *   - timedSource          : enveloppe une source pour mesurer sa durée d'exécution
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

// ─── Robots.txt compliance ────────────────────────────────────────────────────

/** Cache en mémoire des robots.txt déjà lus (clé = origine) */
const _robotsCache = new Map();

/**
 * Vérifie si le scraping est autorisé pour une URL donnée en lisant le
 * robots.txt de l'origine.  Respecte les directives User-agent: * et
 * User-agent: akiprisaye-opendata-bot.
 *
 * Retourne `{ allowed: boolean, crawlDelay: number | null }`.
 * En cas d'erreur de lecture, autorise par défaut (fail-open).
 *
 * @param {string} url              URL cible du scraping
 * @param {string} [ua]             User-agent à tester (défaut : notre bot)
 * @returns {Promise<{ allowed: boolean, crawlDelay: number | null }>}
 */
export async function isScrapingAllowed(url, ua = 'akiprisaye-opendata-bot') {
  let origin;
  try {
    origin = new URL(url).origin;
  } catch {
    return { allowed: true, crawlDelay: null };
  }

  // Check cache
  if (_robotsCache.has(origin)) return _robotsCache.get(origin);

  const robotsUrl = `${origin}/robots.txt`;
  let text = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': ua },
    });
    clearTimeout(timer);
    if (res.ok) text = await res.text();
  } catch {
    // Network error → allow (fail-open)
    const result = { allowed: true, crawlDelay: null };
    _robotsCache.set(origin, result);
    return result;
  }

  // Parse robots.txt (simple implementation)
  const result = _parseRobots(text, ua);
  _robotsCache.set(origin, result);
  return result;
}

/**
 * Minimal robots.txt parser.
 * Supports: User-agent, Disallow, Allow, Crawl-delay.
 * @param {string} text
 * @param {string} ua
 */
function _parseRobots(text, ua) {
  const uaLower = ua.toLowerCase();
  const lines = text.split(/\r?\n/);

  let inMatchingBlock = false;
  let inWildcardBlock = false;
  const disallowSpecific = [];
  const allowSpecific    = [];
  const disallowWildcard = [];
  const allowWildcard    = [];
  let crawlDelaySpecific = null;
  let crawlDelayWildcard = null;

  for (const raw of lines) {
    const line = raw.split('#')[0].trim();
    if (!line) { inMatchingBlock = false; inWildcardBlock = false; continue; }

    const [field, ...rest] = line.split(':');
    const key   = field.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      inMatchingBlock = value.toLowerCase() === uaLower || value.toLowerCase().includes(uaLower);
      inWildcardBlock = value === '*';
    } else if (key === 'disallow') {
      if (inMatchingBlock) disallowSpecific.push(value);
      else if (inWildcardBlock) disallowWildcard.push(value);
    } else if (key === 'allow') {
      if (inMatchingBlock) allowSpecific.push(value);
      else if (inWildcardBlock) allowWildcard.push(value);
    } else if (key === 'crawl-delay') {
      const d = parseFloat(value);
      if (!isNaN(d)) {
        if (inMatchingBlock) crawlDelaySpecific = d;
        else if (inWildcardBlock) crawlDelayWildcard = d;
      }
    }
  }

  // Specific UA rules take priority over wildcard
  const disallow    = disallowSpecific.length > 0 ? disallowSpecific : disallowWildcard;
  const allow       = allowSpecific.length   > 0 ? allowSpecific   : allowWildcard;
  const crawlDelay  = crawlDelaySpecific     ?? crawlDelayWildcard;

  // If any Disallow rule matches '/' → blocked (unless Allow overrides)
  const blocked = disallow.some((p) => p === '/' || p === '');
  const allowed  = !blocked || allow.some((p) => p === '/');

  return { allowed, crawlDelay };
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

/**
 * Crée un rate-limiter par domaine.
 * Garantit un délai minimum `minDelayMs` entre deux appels successifs vers
 * le même domaine (politesse + prévention du throttling).
 *
 * Usage :
 *   const rl = makeRateLimiter(1000);
 *   await rl.wait('https://api.example.com/data');
 *   const res = await fetch('https://api.example.com/data');
 *
 * @param {number} minDelayMs  Délai minimum entre deux requêtes (ms), défaut 800ms
 */
export function makeRateLimiter(minDelayMs = 800) {
  /** @type {Map<string, number>} dernière timestamp par domaine */
  const lastCall = new Map();

  return {
    async wait(url) {
      let host;
      try { host = new URL(url).hostname; } catch { host = url; }
      const last = lastCall.get(host) ?? 0;
      const elapsed = Date.now() - last;
      if (elapsed < minDelayMs) {
        await sleep(minDelayMs - elapsed);
      }
      lastCall.set(host, Date.now());
    },
  };
}

// ─── Source timer ─────────────────────────────────────────────────────────────

/**
 * Enveloppe une source de scraping pour mesurer sa durée d'exécution et
 * capturer les erreurs.  Retourne `{ data, durationMs, error }` — jamais throw.
 *
 * Usage dans scrape.mjs :
 *   const fuel  = await timedSource('fuel',  scrapeFuelPrices);
 *   const food  = await timedSource('food',  scrapeFoodPrices);
 *   console.log(`fuel: ${fuel.durationMs}ms, ${fuel.data.length} entrées`);
 *
 * @template T
 * @param {string}           name
 * @param {() => Promise<T>} fn
 * @returns {Promise<{ data: T, durationMs: number, error: string | null }>}
 */
export async function timedSource(name, fn) {
  const t0 = Date.now();
  try {
    const data = await fn();
    return { data, durationMs: Date.now() - t0, error: null };
  } catch (err) {
    console.error(`  ❌ [${name}] erreur inattendue : ${err.message}`);
    return { data: /** @type {T} */ ([]), durationMs: Date.now() - t0, error: err.message };
  }
}
