import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'https://teetee971.github.io/akiprisaye-web';

// Reference Firebase config for project a-ki-pri-sa-ye.
// Source of truth: GCP Console (project number 187272078809, ID a-ki-pri-sa-ye)
// confirmed 2026-03-15, cross-checked against live bundle assets/index-DHqr0YlO.js.
const EXPECTED_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY',
  projectId: 'a-ki-pri-sa-ye',
  messagingSenderId: '187272078809',
  appId: '1:187272078809:web:110a9e34493ef4506e5c8',
  measurementId: 'G-NFHCZTLPDM',
};
const CRITICAL_ROUTES = ['/', '/comparateur', '/scanner', '/observatoire', '/alertes'];
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

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const body = await response.text();
  return { response, body };
}

async function fetchStatus(url) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  return response;
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

  if (!response.ok) {
    fail(`La page d'accueil a répondu ${response.status} au lieu de 200.`);
  }

  if (!hasReactShell(body)) {
    fail('La page d’accueil ne contient pas de conteneur React `#root`.');
  }

  if (containsLegacyFallback(body)) {
    fail("Le fallback legacy 'Le site est en ligne' est encore présent dans le HTML.");
  }

  logOk("Page d'accueil accessible avec un shell React.");
  return { html: body, headers: response.headers };
}

async function verifyAssets(siteUrl, html) {
  const assetPaths = extractInternalAssetPaths(html, siteUrl);
  if (assetPaths.length === 0) {
    fail('Aucun asset interne exploitable n’a été détecté dans le HTML déployé.');
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
    fail('Le Service Worker est servi mais sa version de cache n’a pas pu être détectée.');
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

async function verifyApi(siteUrl) {
  if (isGitHubPagesSite(siteUrl) || isCloudflarePagesSite(siteUrl)) {
    logOk('/api ignoré (hébergement statique – pas d’endpoints /api servis).');
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

function verifyHeaders(headers, siteUrl) {
  const cacheControl = headers.get('cache-control') || '';
  if (!hasAcceptableHtmlCacheControl(cacheControl, siteUrl)) {
    fail(`Cache-Control HTML inattendu: "${cacheControl || 'absent'}".`);
  }

  logOk(`Headers HTML cohérents (${cacheControl}).`);

  for (const header of OPTIONAL_SECURITY_HEADERS) {
    if (headers.get(header)) {
      logOk(`Header ${header} présent.`);
    } else {
      logWarn(`Header ${header} manquant.`);
    }
  }
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

  // Hard-fail immediately if this specific historically-wrong API key is present
  // in the bundle.  This key was embedded in the live production bundle due to
  // character transpositions vs the key registered in GCP (project a-ki-pri-sa-ye,
  // confirmed 2026-03-15).  The positive check below (EXPECTED_FIREBASE_CONFIG)
  // catches any wrong key in general; this additional guard provides an explicit,
  // human-readable error pointing directly to the VITE_FIREBASE_API_KEY secret.
  const WRONG_API_KEY = 'AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY';
  if (body.includes(WRONG_API_KEY)) {
    const bundleFile = bundlePath.split('/').pop();
    fail(
      `CLEF API FIREBASE INCORRECTE détectée dans le bundle ${bundleFile}.\n` +
      `  Clef erronée : "${WRONG_API_KEY}"\n` +
      `  La clef correcte est : "${EXPECTED_FIREBASE_CONFIG.apiKey}"\n` +
      `  → Vérifiez que le secret VITE_FIREBASE_API_KEY est bien configuré dans GitHub Actions.`,
    );
  }

  const config = extractFirebaseConfigFromBundle(body);
  const mismatches = [];
  for (const [key, expected] of Object.entries(EXPECTED_FIREBASE_CONFIG)) {
    if (config[key] !== expected) {
      mismatches.push(`  ${key}: attendu "${expected}", trouvé "${config[key] ?? 'absent'}"`);
    }
  }

  if (mismatches.length > 0) {
    fail(
      `Config Firebase incorrecte dans le bundle ${bundlePath.split('/').pop()} :\n${mismatches.join('\n')}`,
    );
  }

  const bundleFile = bundlePath.split('/').pop();
  logOk(
    `Firebase config vérifiée dans le bundle (${bundleFile}) :` +
    ` projectId=${config.projectId}, appId=${config.appId}, measurementId=${config.measurementId}`,
  );
}

async function main() {
  const siteUrl = normalizeBaseUrl(process.argv[2] || DEFAULT_URL);

  console.log('🔍 AUDIT DÉPLOIEMENT DU SITE');
  console.log('============================');
  console.log(`Site: ${siteUrl}`);
  console.log('');

  const { html, headers } = await verifyHomepage(siteUrl);
  const assetPaths = await verifyAssets(siteUrl, html);
  await verifyServiceWorker(siteUrl, assetPaths);
  await verifyFirebaseBundle(siteUrl, html);
  await verifySitemap(siteUrl);
  await verifyRoutes(siteUrl);
  await verifyApi(siteUrl);
  verifyHeaders(headers, siteUrl);

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
