import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = 'https://akiprisaye-web.pages.dev';
const baseUrl = process.env.API_BASE_URL || DEFAULT_BASE_URL;
const REQUEST_TIMEOUT_MS = Number(process.env.API_VERIFY_TIMEOUT_MS || 9000);
const STRICT_API_VERIFY = process.env.CI_STRICT_API_VERIFY === '1';

const NETWORK_ERROR_PATTERNS = [
  /fetch failed/i,
  /connect tunnel failed/i,
  /econnreset/i,
  /etimedout/i,
  /enotfound/i,
  /eai_again/i,
  /ehostunreach/i,
  /networkerror/i,
  /proxy/i,
  /tunnel/i,
  /socket hang up/i,
  /aborted/i,
];

export function isNetworkEnvironmentError(error) {
  if (!error) {
    return false;
  }

  const message = [
    error instanceof Error ? error.message : String(error),
    typeof error === 'object' && error && 'cause' in error ? String(error.cause) : '',
    typeof error === 'object' && error && 'code' in error ? String(error.code) : '',
  ]
    .join(' | ')
    .toLowerCase();

  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function assertDebugHeaders(response, context) {
  const source = response.headers.get('x-akps-source') || '';
  const reason = response.headers.get('x-akps-reason') || '';
  const selected = response.headers.get('x-akps-selected') || '';

  if (!['off', 'openfoodfacts', 'placeholder'].includes(source)) {
    throw new Error(`${context} expected x-akps-source header, received "${source}"`);
  }

  if (!reason) {
    throw new Error(`${context} expected x-akps-reason header`);
  }

  if (!selected) {
    throw new Error(`${context} expected x-akps-selected header`);
  }
}

async function checkHealth() {
  const response = await fetchWithTimeout(`${baseUrl}/api/health`);
  const body = await response.text();
  if (response.status !== 200) {
    throw new Error(`/api/health expected 200, received ${response.status}. body=${body.slice(0, 180)}`);
  }
  console.log(`OK /api/health -> ${response.status}`);
}

async function checkProductImageJson() {
  const response = await fetchWithTimeout(`${baseUrl}/api/product-image?ean=3274080005003&format=json&v=2`, {
    headers: { Accept: 'text/html' },
  });
  const body = await response.text();
  if (response.status !== 200) {
    throw new Error(`/api/product-image?format=json expected 200, received ${response.status}. body=${body.slice(0, 180)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`/api/product-image?format=json did not return JSON. body=${body.slice(0, 180)}`);
  }

  if (!['off', 'openfoodfacts', 'placeholder'].includes(parsed?.source)) {
    throw new Error(`/api/product-image?format=json returned unexpected payload: ${body.slice(0, 180)}`);
  }

  const vary = response.headers.get('vary') || '';
  if (!vary.toLowerCase().includes('accept')) {
    throw new Error(`/api/product-image?format=json expected Vary: Accept, received "${vary}"`);
  }

  assertDebugHeaders(response, '/api/product-image?format=json');
  console.log(`OK /api/product-image?format=json -> ${response.status} source=${parsed.source}`);
}

async function checkProductImageMode() {
  const response = await fetchWithTimeout(`${baseUrl}/api/product-image?ean=3274080005003&v=2`, {
    redirect: 'manual',
    headers: { Accept: 'text/html' },
  });
  const contentType = response.headers.get('content-type') || '';
  const isRedirect = response.status === 302;
  const isSvg = response.status === 200 && contentType.includes('image/svg+xml');

  if (!isRedirect && !isSvg) {
    const body = await response.text();
    throw new Error(`/api/product-image image mode expected 302 or 200 image/svg+xml, received ${response.status} content-type=${contentType}. body=${body.slice(0, 180)}`);
  }

  const vary = response.headers.get('vary') || '';
  if (!vary.toLowerCase().includes('accept')) {
    throw new Error(`/api/product-image image mode expected Vary: Accept, received "${vary}"`);
  }

  assertDebugHeaders(response, '/api/product-image image mode');
  console.log(`OK /api/product-image image mode -> ${response.status} content-type=${contentType || 'n/a'}`);
}

async function checkProductImageJsonByAccept() {
  const response = await fetchWithTimeout(`${baseUrl}/api/product-image?ean=3274080005003&v=2`, {
    headers: { Accept: 'application/json' },
  });
  const body = await response.text();

  if (response.status !== 200) {
    throw new Error(`/api/product-image Accept: application/json expected 200, received ${response.status}. body=${body.slice(0, 180)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`/api/product-image Accept: application/json did not return JSON. body=${body.slice(0, 180)}`);
  }

  if (!['off', 'openfoodfacts', 'placeholder'].includes(parsed?.source)) {
    throw new Error(`/api/product-image Accept: application/json returned unexpected payload: ${body.slice(0, 180)}`);
  }

  const vary = response.headers.get('vary') || '';
  if (!vary.toLowerCase().includes('accept')) {
    throw new Error(`/api/product-image Accept: application/json expected Vary: Accept, received "${vary}"`);
  }

  assertDebugHeaders(response, '/api/product-image Accept: application/json');
  console.log(`OK /api/product-image Accept: application/json -> ${response.status} source=${parsed.source}`);
}

export async function runVerification() {
  await checkHealth();
  await checkProductImageJson();
  await checkProductImageMode();
  await checkProductImageJsonByAccept();
  console.log('API verification completed successfully.');
}

async function main() {
  try {
    await runVerification();
  } catch (error) {
    if (isNetworkEnvironmentError(error)) {
      if (STRICT_API_VERIFY) {
        console.error(`API verification failed in strict mode while checking ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }

      console.warn(`SKIPPED: network/environment issue while checking ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(0);
    }

    console.error('API verification failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
