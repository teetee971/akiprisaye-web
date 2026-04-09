import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'https://teetee971.github.io/akiprisaye-web';

// Reference Firebase config for project a-ki-pri-sa-ye.
// Source of truth: GCP Console (project number 187272078809, ID a-ki-pri-sa-ye)
// confirmed 2026-03-16; re-verified 2026-03-16T18:29Z (live bundle index-Bx8znz_t.js).
// Values must match GitHub Actions secrets VITE_FIREBASE_APP_ID
// and VITE_FIREBASE_MEASUREMENT_ID (the values injected into the production bundle).
const EXPECTED_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY',
  projectId: 'a-ki-pri-sa-ye',
  messagingSenderId: '187272078809',
  appId: '1:187272078809:web:501d916973a75edb06e5c8',
  measurementId: 'G-W0R1B4HHE1',
};
const CRITICAL_ROUTES = ['/', '/comparateur', '/scanner', '/observatoire', '/alertes', '/connexion'];
// Known stale bundles that must no longer appear in the deployed HTML.
// index-DHqr0YlO.js was the last bundle built with the incorrect Firebase API key (2026-03-15).
const STALE_BUNDLE_NAMES = ['index-DHqr0YlO.js'];
const OPTIONAL_SECURITY_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'strict-transport-security',
  'content-security-policy',
];
const SERVICE_WORKER_FILENAME = 'service-worker.js';
const SITEMAP_FILENAME = 'sitemap.xml';
const INTERNAL_ASSET_EXTENSIONS = ['js', 'css', 'png', 'svg', 'webmanifest'];
const MAX_ERROR_BODY_LENGTH = 180;
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_MAX_RETRIES = 3;
const FETCH_RETRY_DELAY_MS = 5_000;
const INTERNAL_ASSET_PATTERN = new RegExp(
  `(?:/assets/[^"'?#]+|/[^"'?#]+\\.(?:${INTERNAL_ASSET_EXTENSIONS.join('|')}))(?:[?#].*)?$`,
  'i',
);

function logOk(message) {
  console.log(`✅ ${message}`);
}

function logWarn(message) {
  console.warn(`⚠️  ${message}`);
}

function fail(message) {
  throw new Error(message);
}

export function normalizeBaseUrl(url = DEFAULT_URL) {
  return String(url).replace(/\/+$/, '');
}

export function isGitHubPagesSite(siteUrl) {
  return new URL(siteUrl).hostname.endsWith('github.io');
}

export function isCloudflarePagesSite(siteUrl) {
  return new URL(siteUrl).hostname.endsWith('.pages.dev');
}

export function hasReactShell(html) {
  return /<div[^>]+id=["']root["']/i.test(html);
}

/**
 * Returns true if the fetched response appears to be a Cloudflare Access challenge page.
 * This can happen when preview deployment URLs are protected by Cloudflare Access —
 * the fetch follows the redirect and lands on the challenge page (200 status, no React shell).
 * Checks both the final response URL (after redirects) and the HTML body.
 */
export function isCloudflareAccessPage(responseUrl, body) {
  try {
    const host = new URL(responseUrl).hostname.toLowerCase();
    if (host === 'cloudflareaccess.com' || host.endsWith('.cloudflareaccess.com')) {
      return true;
    }
  } catch {
    // ignore unparseable URLs
  }
  return /cloudflareaccess\.com/i.test(body);
}

export function containsLegacyFallback(html) {
  return /Le site est en ligne/i.test(html);
}

export function hasGitHubPagesSpaFallback(html) {
  return /\?p=%2F/i.test(html) || /Redirection en cours/i.test(html);
}

export function extractServiceWorkerVersion(source) {
  const match = source.match(/akiprisaye-smart-cache-v(\d+)/i);
  return match ? Number(match[1]) : null;
}

/**
 * Finds the main JS entry bundle path (index-*.js loaded via `type="module"`) in the HTML.
 * Returns the raw path string as it appears in the `src` attribute, or null if not found.
 */
export function extractMainBundlePath(html) {
  // Match <script> tags that have BOTH type="module" and a src pointing to index-*.js,
  // regardless of attribute order.
  const scriptTagRegex = /<script\b([^>]*)>/gi;
  let tagMatch;
  while ((tagMatch = scriptTagRegex.exec(html)) !== null) {
    const attrs = tagMatch[1];
    if (!/\btype=["']module["']/i.test(attrs)) continue;
    const srcMatch = attrs.match(/\bsrc=["']([^"']+\/index-[^"']+\.js)["']/i);
    if (srcMatch) return srcMatch[1];
  }
  return null;
}

/** Escape a string for safe use inside a RegExp pattern. */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts Firebase config field values from a minified JS bundle string.
 * Handles both minified (`key:"value"`) and formatted (`key: "value"`) forms.
 * Returns an object with the extracted string values (or null for absent fields).
 */
export function extractFirebaseConfigFromBundle(js) {
  /** @param {string} key */
  function extract(key) {
    const re = new RegExp(`\\b${escapeRegExp(key)}\\s*:\\s*["']([^"']+)["']`);
    const m = js.match(re);
    return m ? m[1] : null;
  }
  return {
    projectId: extract('projectId'),
    messagingSenderId: extract('messagingSenderId'),
    appId: extract('appId'),
    measurementId: extract('measurementId'),
    apiKey: extract('apiKey'),
    authDomain: extract('authDomain'),
  };
}

function normalizeInternalPath(resourceUrl, siteUrl) {
  if (!resourceUrl || /^(?:mailto:|tel:|javascript:|data:|#)/i.test(resourceUrl)) {
    return null;
  }

  const parsed = new URL(resourceUrl, siteUrl);
  const siteOrigin = new URL(siteUrl).origin;
  if (parsed.origin !== siteOrigin) {
    return null;
  }

  const pathWithQuery = `${parsed.pathname}${parsed.search}`;
  return INTERNAL_ASSET_PATTERN.test(pathWithQuery) ? pathWithQuery : null;
}

export function extractInternalAssetPaths(html, siteUrl) {
  const resources = new Set();
  const attributeRegex = /\b(?:src|href)=["']([^"'<>]+)["']/gi;

  let match;
  while ((match = attributeRegex.exec(html)) !== null) {
    const normalized = normalizeInternalPath(match[1], siteUrl);
    if (normalized) {
      resources.add(normalized);
    }
  }

  return [...resources];
}

export function inferAssetBasePath(assetPaths) {
  for (const assetPath of assetPaths) {
    const assetsIndex = assetPath.indexOf('/assets/');
    if (assetsIndex >= 0) {
      const prefix = assetPath.slice(0, assetsIndex);
      return prefix ? `${prefix}/` : '/';
    }

    const manifestMatch = assetPath.match(/^(.*\/)manifest\.webmanifest(?:[?#].*)?$/i);
    if (manifestMatch) {
      return manifestMatch[1] || '/';
    }

    const iconMatch = assetPath.match(/^(.*\/)icon-\d+\.png(?:[?#].*)?$/i);
    if (iconMatch) {
      return iconMatch[1] || '/';
    }
  }

  return '/';
}

export function joinSiteUrl(baseUrl, path) {
  const siteUrl = new URL(`${normalizeBaseUrl(baseUrl)}/`);
  const siteBasePath = siteUrl.pathname.replace(/\/$/, '');
  const normalizedPath = String(path || '/');

  if (normalizedPath.startsWith(siteUrl.pathname)) {
    return new URL(normalizedPath, siteUrl.origin).toString();
  }

  if (normalizedPath.startsWith('/')) {
    // Preserve the repository subpath on GitHub Pages (e.g. /akiprisaye-web).
    // When siteBasePath is empty, the root route intentionally becomes "/" .
    const resolvedPath = normalizedPath === '/' ? `${siteBasePath}/` : `${siteBasePath}${normalizedPath}`;
    return new URL(resolvedPath, siteUrl.origin).toString();
  }

  return new URL(normalizedPath, siteUrl).toString();
}

/**
 * Returns true if a known stale bundle filename appears anywhere in the HTML.
 * This catches cases where the CDN is still serving an outdated index.html that
 * references an old bundle even after the build was regenerated.
 */
export function isStaleBundleReferenced(html, staleBundleName) {
  return html.includes(staleBundleName);
}

/**
 * Returns true if the HTML contains a <meta http-equiv="Content-Security-Policy"> tag.
 * This is the only way to deliver a CSP on static hosting platforms (GitHub Pages,
 * Cloudflare Pages) that do not allow custom HTTP response headers.
 * Note: frame-ancestors is not supported inside a meta CSP and requires a real HTTP header.
 */
export function hasMetaCSP(html) {
  return /<meta[^>]+http-equiv=["']?content-security-policy/i.test(html);
}

/**
 * Counts the number of non-overlapping occurrences of `needle` in `text`.
 * Equivalent to what `grep -c` / `grep -o | wc -l` would return for a literal string.
 * Returns 0 when `needle` is empty or absent.
 */
export function countOccurrences(text, needle) {
  if (!needle || typeof text !== 'string') return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

export function extractSitemapPaths(xml, siteUrl) {
  const site = new URL(`${normalizeBaseUrl(siteUrl)}/`);
  const siteBasePath = site.pathname.replace(/\/$/, '');
  const paths = new Set();

  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
    const rawUrl = match[1]?.trim();
    if (!rawUrl) {
      continue;
    }

    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      continue;
    }

    if (parsed.origin !== site.origin) {
      continue;
    }

    const normalizedPathname = parsed.pathname.replace(/\/+$/, '') || '/';
    if (normalizedPathname === siteBasePath || normalizedPathname === `${siteBasePath}/`) {
      paths.add('/');
      continue;
    }

    if (siteBasePath) {
      if (!normalizedPathname.startsWith(`${siteBasePath}/`)) {
        continue;
      }

      paths.add(normalizedPathname.slice(siteBasePath.length) || '/');
      continue;
    }

    paths.add(normalizedPathname);
  }

  return [...paths];
}

/**
 * Returns true for transient server-side HTTP errors that should be retried.
 * Covers 429 (rate-limit), 502 (bad gateway), 503 (service unavailable), and
 * 504 (gateway timeout) — all common transient failures on GitHub Pages CDN.
 */
export function isTransientHttpError(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function fetchText(url) {
  let lastResponse;
  let lastBody;
  let lastError;
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt++) {
    const isLastAttempt = attempt === FETCH_MAX_RETRIES;
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_DELAY_MS));
    }
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const body = await response.text();
      if (!isTransientHttpError(response.status)) {
        return { response, body };
      }
      lastResponse = response;
      lastBody = body;
      if (!isLastAttempt) {
        logWarn(`Tentative ${attempt + 1}/${FETCH_MAX_RETRIES + 1} — ${url} a répondu ${response.status}, nouvel essai dans ${FETCH_RETRY_DELAY_MS / 1000}s…`);
      }
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!isLastAttempt) {
        logWarn(`Tentative ${attempt + 1}/${FETCH_MAX_RETRIES + 1} — erreur réseau sur ${url}: ${errorMessage}. Nouvel essai dans ${FETCH_RETRY_DELAY_MS / 1000}s…`);
      }
    }
  }
  if (lastResponse) {
    return { response: lastResponse, body: lastBody };
  }
  throw new Error(`Échec réseau lors de la récupération de ${url}`, lastError ? { cause: lastError } : undefined);
}

async function fetchStatus(url) {
  let lastResponse;
  let lastError;
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt++) {
    const isLastAttempt = attempt === FETCH_MAX_RETRIES;
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_DELAY_MS));
    }
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!isTransientHttpError(response.status)) {
        return response;
      }
      lastResponse = response;
      if (!isLastAttempt) {
        logWarn(`Tentative ${attempt + 1}/${FETCH_MAX_RETRIES + 1} — ${url} a répondu ${response.status}, nouvel essai dans ${FETCH_RETRY_DELAY_MS / 1000}s…`);
      }
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!isLastAttempt) {
        logWarn(`Tentative ${attempt + 1}/${FETCH_MAX_RETRIES + 1} — erreur réseau sur ${url}: ${errorMessage}. Nouvel essai dans ${FETCH_RETRY_DELAY_MS / 1000}s…`);
      }
    }
  }
  if (lastResponse) {
    return lastResponse;
  }
  throw new Error(`Échec réseau lors de la récupération de ${url}`, lastError ? { cause: lastError } : undefined);
}

function hasAcceptableRouteResponse(response, body, githubPages) {
  return response.ok || (
    githubPages &&
    response.status === 404 &&
    hasGitHubPagesSpaFallback(body) &&
    !containsLegacyFallback(body)
  );
}

async function verifyHomepage(siteUrl) {
  const rootUrl = `${normalizeBaseUrl(siteUrl)}/`;
  const { response, body } = await fetchText(rootUrl);

  if (isCloudflareAccessPage(response.url, body)) {
    logWarn('URL protégée par Cloudflare Access — validation ignorée pour cette URL.');
    return { html: null, headers: response.headers, cloudflareAccess: true };
  }

  if (!response.ok) {
    fail(`La page d'accueil a répondu ${response.status} au lieu de 200.`);
  }

  if (!hasReactShell(body)) {
    fail('La page d\'accueil ne contient pas de conteneur React `#root`.');
  }

  if (containsLegacyFallback(body)) {
    fail("Le fallback legacy 'Le site est en ligne' est encore présent dans le HTML.");
  }

  logOk("Page d'accueil accessible avec un shell React.");
  return { html: body, headers: response.headers, cloudflareAccess: false };
}

async function verifyAssets(siteUrl, html) {
  const assetPaths = extractInternalAssetPaths(html, siteUrl);
  if (assetPaths.length === 0) {
    fail('Aucun asset interne exploitable n\'a été détecté dans le HTML déployé.');
  }

  for (const assetPath of assetPaths) {
    const url = joinSiteUrl(siteUrl, assetPath);
    const response = await fetchStatus(url);
    if (!response.ok) {
      fail(`Asset référencé introuvable: ${assetPath} (HTTP ${response.status}).`);
    }
  }

  logOk(`${assetPaths.length} asset(s) référencé(s) par le HTML sont bien servis.`);
  return assetPaths;
}

async function verifyServiceWorker(siteUrl, assetPaths) {
  const basePath = inferAssetBasePath(assetPaths);
  const swPath = `${basePath}${SERVICE_WORKER_FILENAME}`.replace(/\/+/g, '/');
  const url = joinSiteUrl(siteUrl, swPath);
  const { response, body } = await fetchText(url);

  if (!response.ok) {
    fail(`Service Worker introuvable à ${swPath} (HTTP ${response.status}).`);
  }

  const version = extractServiceWorkerVersion(body);
  if (version === null) {
    fail('Le Service Worker est servi mais sa version de cache n\'a pas pu être détectée.');
  }

  if (/['"]\/index\.html['"]/i.test(body)) {
    fail("Le Service Worker précache encore '/index.html'.");
  }

  logOk(`Service Worker accessible (${swPath}) avec cache v${version}.`);
}

async function verifyRoutes(siteUrl) {
  const githubPages = isGitHubPagesSite(siteUrl);
  let fallbackRoutes = 0;

  for (const route of CRITICAL_ROUTES) {
    const { response, body } = await fetchText(joinSiteUrl(siteUrl, route));
    if (hasAcceptableRouteResponse(response, body, githubPages)) {
      if (!response.ok) {
        fallbackRoutes += 1;
      }
      continue;
    }

    fail(`La route critique ${route} a répondu ${response.status}.`);
  }

  if (fallbackRoutes > 0) {
    logWarn(`${fallbackRoutes} route(s) critique(s) utilisent le fallback GitHub Pages (HTTP 404 attendu sur deep links).`);
  }

  logOk(`${CRITICAL_ROUTES.length} routes critiques répondent correctement.`);
}

async function verifySitemap(siteUrl) {
  const githubPages = isGitHubPagesSite(siteUrl);
  const { response, body } = await fetchText(joinSiteUrl(siteUrl, `/${SITEMAP_FILENAME}`));

  if (!response.ok) {
    fail(`Sitemap introuvable (/${SITEMAP_FILENAME}, HTTP ${response.status}).`);
  }

  const indexedPaths = extractSitemapPaths(body, siteUrl);
  if (indexedPaths.length === 0) {
    fail('Le sitemap public ne contient aucune route indexable exploitable.');
  }

  let fallbackRoutes = 0;
  for (const route of indexedPaths) {
    const result = await fetchText(joinSiteUrl(siteUrl, route));
    if (hasAcceptableRouteResponse(result.response, result.body, githubPages)) {
      if (!result.response.ok) {
        fallbackRoutes += 1;
      }
      continue;
    }

    fail(`La route indexée ${route} du sitemap a répondu ${result.response.status}.`);
  }

  if (fallbackRoutes > 0) {
    logWarn(`${fallbackRoutes} route(s) indexée(s) du sitemap utilisent le fallback GitHub Pages (HTTP 404 attendu sur deep links).`);
  }

  logOk(`Sitemap public valide (${indexedPaths.length} route(s) indexée(s) vérifiées).`);
}

async function verifyNoBundleRegression(siteUrl, html, assetPaths) {
  const basePath = inferAssetBasePath(assetPaths);
  const currentBundle = extractMainBundlePath(html);

  for (const staleName of STALE_BUNDLE_NAMES) {
    if (isStaleBundleReferenced(html, staleName)) {
      fail(
        `L'ancien bundle déprécié "${staleName}" est encore référencé dans le HTML déployé.\n` +
        `  → Le build actif intègre toujours l'ancienne configuration.\n` +
        `  → Vérifiez que le dernier build a bien été regénéré et déployé correctement.`,
      );
    }

    // Probe whether the CDN is still serving the stale file (informational only).
    // A 404/410 confirms the CDN has purged it; a 200 means the edge cache still
    // holds it but is harmless because the HTML no longer points to it.
    const stalePath = `${basePath}assets/${staleName}`.replace(/\/+/g, '/');
    const staleUrl = joinSiteUrl(siteUrl, stalePath);
    const response = await fetchStatus(staleUrl);
    if (response.ok) {
      logWarn(
        `L'ancien bundle "${staleName}" est encore accessible via le CDN (HTTP ${response.status}) mais n'est plus référencé dans le HTML.\n` +
        `  → Le cache CDN sera purgé automatiquement à expiration (max-age). Aucune action requise.`,
      );
    } else {
      logOk(`Ancien bundle "${staleName}" non servi par le CDN (HTTP ${response.status}) — cache purgé.`);
    }
  }

  const currentBundleFile = currentBundle ? currentBundle.split('/').pop() : '(inconnu)';
  logOk(
    `Aucun bundle déprécié référencé dans le HTML actif` +
    ` (bundle actuel: ${currentBundleFile}, vérifié: ${STALE_BUNDLE_NAMES.join(', ')}).`,
  );
}

async function verifyApi(siteUrl) {
  if (isGitHubPagesSite(siteUrl) || isCloudflarePagesSite(siteUrl)) {
    logOk('/api ignoré (hébergement statique - pas d\'endpoints /api servis).');
    return;
  }

  const { response, body } = await fetchText(joinSiteUrl(siteUrl, '/api/health'));
  if (!response.ok) {
    fail(`/api/health a répondu ${response.status}: ${body.slice(0, MAX_ERROR_BODY_LENGTH)}`);
  }

  logOk('/api/health répond 200.');
}

export function hasAcceptableHtmlCacheControl(cacheControl, siteUrl) {
  if (isGitHubPagesSite(siteUrl)) {
    // GitHub Pages serves HTML with a short shared cache (currently max-age=600),
    // so validation must accept that platform-managed policy in addition to no-store.
    return /(?:max-age=\d+|no-store)/i.test(cacheControl);
  }

  return /(?:no-store|max-age=0)/i.test(cacheControl);
}

function verifyHeaders(headers, siteUrl, html) {
  const cacheControl = headers.get('cache-control') || '';
  if (!hasAcceptableHtmlCacheControl(cacheControl, siteUrl)) {
    fail(`Cache-Control HTML inattendu: "${cacheControl || 'absent'}".`);
  }

  logOk(`Headers HTML cohérents (${cacheControl}).`);

  if (isGitHubPagesSite(siteUrl) || isCloudflarePagesSite(siteUrl)) {
    // On static hosting (GitHub Pages, Cloudflare Pages) it is impossible to set server-side
    // HTTP security headers such as X-Frame-Options, X-Content-Type-Options, or
    // Strict-Transport-Security. These are platform-managed concerns.
    // • X-Frame-Options / frame-ancestors : not enforceable on static hosting; frame-ancestors
    //   is also not supported in meta CSP (HTTP header only) — documented limitation.
    // • X-Content-Type-Options : no meta equivalent; browsers already sniff conservatively for
    //   module scripts loaded via Vite — not a regression risk.
    // • Strict-Transport-Security : enforced transparently by the hosting platform (GitHub Pages
    //   always serves over HTTPS).
    // Instead, check that the HTML contains a CSP <meta> tag for the directives that *can*
    // be expressed in HTML (script-src, connect-src, img-src, frame-src, …).
    if (html && hasMetaCSP(html)) {
      logOk('Content-Security-Policy présente via balise <meta> dans le HTML (hébergement statique).');
    } else {
      logWarn('Content-Security-Policy absente du HTML — balise <meta http-equiv="Content-Security-Policy"> manquante.');
    }
    logOk(
      'X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security : ' +
      'non injectables via header HTTP sur hébergement statique (GitHub Pages / Cloudflare Pages). ' +
      'HSTS assuré par la plateforme; frame-ancestors non supporté dans meta CSP.',
    );
    return;
  }

  for (const header of OPTIONAL_SECURITY_HEADERS) {
    if (headers.get(header)) {
      logOk(`Header ${header} présent.`);
    } else {
      logWarn(`Header ${header} manquant.`);
    }
  }
}

/**
 * Returns true when `branch` is the protected production branch.
 * Exported for unit tests.
 */
export function isMainBranch(branch) {
  return typeof branch === 'string' && branch.trim() === 'main';
}

/**
 * Parses and validates the fields of a version.json payload.
 * Throws a descriptive Error when a required field is missing or malformed.
 * Exported for unit tests.
 *
 * @param {unknown} json - Parsed JSON object from version.json
 * @returns {{ branch: string, commit: string, builtAt: string | null, runId: string | null }}
 */
export function parseVersionJson(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('version.json: le payload n\'est pas un objet JSON valide.');
  }
  const obj = /** @type {Record<string, unknown>} */ (json);

  const branch = obj['branch'];
  if (typeof branch !== 'string' || branch.trim() === '') {
    throw new Error('version.json: champ "branch" manquant ou vide.');
  }

  const commit = obj['commit'];
  if (typeof commit !== 'string' || !/^[0-9a-f]{7,40}$/i.test(commit.trim())) {
    throw new Error(`version.json: champ "commit" manquant ou invalide ("${commit}"). Attendu: SHA hexadécimal.`);
  }

  const builtAt = typeof obj['builtAt'] === 'string' ? obj['builtAt'] : null;
  const runId = typeof obj['runId'] === 'string' ? obj['runId'] : null;

  return { branch: branch.trim(), commit: commit.trim(), builtAt, runId };
}

async function verifyVersionJson(siteUrl) {
  const url = `${normalizeBaseUrl(siteUrl)}/version.json`;
  let response;
  let body;
  try {
    ({ response, body } = await fetchText(url));
  } catch (err) {
    fail(`version.json inaccessible (${url}) : ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  if (!response.ok) {
    fail(`version.json introuvable : HTTP ${response.status} sur ${url}`);
    return;
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    fail(`version.json : JSON invalide — impossible de parser la réponse de ${url}`);
    return;
  }

  const { branch, commit, builtAt, runId } = parseVersionJson(json);

  // On production the deployed site MUST have been built from main.
  // On preview/feature-branch deployments this is expected to differ — emit a
  // warning instead of failing so the validator can complete its other checks.
  if (!isMainBranch(branch)) {
    logWarn(
      `version.json indique branch="${branch}" — le site déployé n'est pas issu de main.\n` +
      `  → Pour un déploiement de production, merger la PR sur main et relancer deploy-pages.yml.`,
    );
    return;
  }

  logOk(
    `version.json validé — branch=${branch}, commit=${commit}` +
    (builtAt ? `, builtAt=${builtAt}` : '') +
    (runId ? `, runId=${runId}` : ''),
  );
}

async function verifyFirebaseBundle(siteUrl, html) {
  const bundlePath = extractMainBundlePath(html);
  if (!bundlePath) {
    fail('Impossible de trouver le bundle JS principal (index-*.js type="module") dans le HTML déployé.');
  }

  const url = joinSiteUrl(siteUrl, bundlePath);
  const { response, body } = await fetchText(url);
  if (!response.ok) {
    fail(`Bundle JS principal introuvable : ${bundlePath} (HTTP ${response.status}).`);
  }

  let config = extractFirebaseConfigFromBundle(body);
  let configBody = body;
  let configBundlePath = bundlePath;

  // Firebase is lazy-loaded in a dedicated app chunk (firebase-*.js, ~1 kB) so
  // the 485 kB Firebase SDK does not block first paint.  The main entry bundle
  // only holds a Rollup-generated string reference to that chunk and will never
  // contain the firebaseConfig object itself.  When apiKey is absent from the
  // main bundle, look for the firebase app chunk reference embedded in the main
  // bundle's dynamic-import map and fetch it before declaring the config absent.
  if (!config.apiKey) {
    // Match any path whose last segment starts with "firebase-" (e.g. "assets/firebase-ABC.js").
    // The leading [^"]+\/ ensures we require a path separator before "firebase-", which
    // excludes "vendor-firebase-*.js" whose last segment starts with "vendor-", not "firebase-".
    const chunkMatch = body.match(/"([^"]+\/firebase-[^"]+\.js)"/);
    if (chunkMatch) {
      const firebaseChunkUrl = joinSiteUrl(siteUrl, `/${chunkMatch[1]}`);
      const firebaseRes = await fetchText(firebaseChunkUrl);
      if (firebaseRes.response.ok) {
        config = extractFirebaseConfigFromBundle(firebaseRes.body);
        configBody = firebaseRes.body;
        configBundlePath = `/${chunkMatch[1]}`;
      } else {
        logWarn(`Firebase app chunk trouvé dans le bundle principal (${chunkMatch[1]}) mais inaccessible (HTTP ${firebaseRes.response.status}) — impossible de vérifier la config Firebase.`);
      }
    }
  }

  // Fail early with a clear message if the apiKey field could not be extracted at all
  // (e.g. the bundle format changed or tree-shaking removed the Firebase config).
  if (!config.apiKey) {
    fail(
      `Impossible d'extraire l'apiKey Firebase depuis le bundle ${bundlePath.split('/').pop()}.\n` +
      `  → Le bundle ne contient peut-être pas de configuration Firebase valide.`,
    );
  }

  // Hard-fail immediately if the extracted apiKey is the historically-wrong API key.
  // This key was embedded in the live production bundle due to character transpositions
  // vs the key registered in GCP (project a-ki-pri-sa-ye, confirmed 2026-03-15).
  // We check the *extracted* apiKey value (from the Firebase config object in the bundle)
  // rather than searching the raw bundle text, because the wrong key string may also appear
  // in the bundle as part of detection code (e.g. firebase.ts wrongApiKeyDetected guard)
  // and a raw-text search would produce false positives in that case.
  const WRONG_API_KEY = 'AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY';
  if (config.apiKey === WRONG_API_KEY) {
    const bundleFile = configBundlePath.split('/').pop();
    fail(
      `CLEF API FIREBASE INCORRECTE détectée dans le bundle ${bundleFile}.\n` +
      `  Clef erronée : "${WRONG_API_KEY}"\n` +
      `  La clef correcte est : "${EXPECTED_FIREBASE_CONFIG.apiKey}"\n` +
      `  → Vérifiez que le secret VITE_FIREBASE_API_KEY est bien configuré dans GitHub Actions.`,
    );
  }
  const mismatches = [];
  for (const [key, expected] of Object.entries(EXPECTED_FIREBASE_CONFIG)) {
    if (config[key] !== expected) {
      mismatches.push(`  ${key}: attendu "${expected}", trouvé "${config[key] ?? 'absent'}"`);
    }
  }

  if (mismatches.length > 0) {
    fail(
      `Config Firebase incorrecte dans le bundle ${configBundlePath.split('/').pop()} :\n${mismatches.join('\n')}`,
    );
  }

  const bundleFile = configBundlePath.split('/').pop();
  const correctKeyCount = countOccurrences(configBody, EXPECTED_FIREBASE_CONFIG.apiKey);
  logOk(
    `Firebase config vérifiée dans le bundle (${bundleFile}) :` +
    ` clé correcte: ${correctKeyCount} occurrence(s),` +
    ` projectId=${config.projectId}, appId=${config.appId}, measurementId=${config.measurementId}`,
  );
}

async function main() {
  const siteUrl = normalizeBaseUrl(process.argv[2] || DEFAULT_URL);

  console.log('🔍 AUDIT DÉPLOIEMENT DU SITE');
  console.log('============================');
  console.log(`Site: ${siteUrl}`);
  console.log('');

  const { html, headers, cloudflareAccess } = await verifyHomepage(siteUrl);

  if (cloudflareAccess) {
    console.log('');
    console.log('============================');
    logWarn('Pour auditer ce déploiement, configurez un service token Cloudflare Access en CI.');
    return;
  }

  const assetPaths = await verifyAssets(siteUrl, html);
  await verifyServiceWorker(siteUrl, assetPaths);
  await verifyNoBundleRegression(siteUrl, html, assetPaths);
  await verifyVersionJson(siteUrl);
  await verifyFirebaseBundle(siteUrl, html);
  await verifySitemap(siteUrl);
  await verifyRoutes(siteUrl);
  await verifyApi(siteUrl);
  verifyHeaders(headers, siteUrl, html);

  console.log('');
  console.log('============================');
  logOk('Validation complète réussie.');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error('');
    console.error(`❌ VALIDATION ÉCHOUÉE: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
