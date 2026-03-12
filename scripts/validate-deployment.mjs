import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'https://akiprisaye-web.pages.dev';
const CRITICAL_ROUTES = ['/', '/comparateur', '/scanner', '/observatoire', '/alertes'];
const OPTIONAL_SECURITY_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'strict-transport-security',
  'content-security-policy',
];
const SERVICE_WORKER_FILENAME = 'service-worker.js';
const INTERNAL_ASSET_EXTENSIONS = ['js', 'css', 'png', 'svg', 'webmanifest'];
const MAX_ERROR_BODY_LENGTH = 180;
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

export function hasReactShell(html) {
  return /<div[^>]+id=["']root["']/i.test(html);
}

export function containsLegacyFallback(html) {
  return /Le site est en ligne/i.test(html);
}

export function extractServiceWorkerVersion(source) {
  const match = source.match(/akiprisaye-smart-cache-v(\d+)/i);
  return match ? Number(match[1]) : null;
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

function joinSiteUrl(baseUrl, path) {
  return new URL(path, `${normalizeBaseUrl(baseUrl)}/`).toString();
}

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.text();
  return { response, body };
}

async function fetchStatus(url) {
  const response = await fetch(url, { cache: 'no-store' });
  return response;
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
  for (const route of CRITICAL_ROUTES) {
    const response = await fetchStatus(joinSiteUrl(siteUrl, route));
    if (!response.ok) {
      fail(`La route critique ${route} a répondu ${response.status}.`);
    }
  }

  logOk(`${CRITICAL_ROUTES.length} routes critiques répondent correctement.`);
}

async function verifyApi(siteUrl) {
  const { response, body } = await fetchText(joinSiteUrl(siteUrl, '/api/health'));
  if (!response.ok) {
    fail(`/api/health a répondu ${response.status}: ${body.slice(0, MAX_ERROR_BODY_LENGTH)}`);
  }

  logOk('/api/health répond 200.');
}

function verifyHeaders(headers) {
  const cacheControl = headers.get('cache-control') || '';
  if (!/(?:no-store|max-age=0)/i.test(cacheControl)) {
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

async function main() {
  const siteUrl = normalizeBaseUrl(process.argv[2] || DEFAULT_URL);

  console.log('🔍 AUDIT DÉPLOIEMENT DU SITE');
  console.log('============================');
  console.log(`Site: ${siteUrl}`);
  console.log('');

  const { html, headers } = await verifyHomepage(siteUrl);
  const assetPaths = await verifyAssets(siteUrl, html);
  await verifyServiceWorker(siteUrl, assetPaths);
  await verifyRoutes(siteUrl);
  await verifyApi(siteUrl);
  verifyHeaders(headers);

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
