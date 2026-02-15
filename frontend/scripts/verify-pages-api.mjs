const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:8788';

function assertDebugHeaders(response, context) {
  const source = response.headers.get('x-akps-source') || '';
  const reason = response.headers.get('x-akps-reason') || '';
  const selected = response.headers.get('x-akps-selected') || '';

  if (!['openfoodfacts', 'placeholder'].includes(source)) {
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
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.text();
  if (response.status !== 200) {
    throw new Error(`/api/health expected 200, received ${response.status}. body=${body.slice(0, 180)}`);
  }
  console.log(`OK /api/health -> ${response.status}`);
}

async function checkProductImageJson() {
  const response = await fetch(`${baseUrl}/api/product-image?ean=3274080005003&format=json&v=2`, {
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

  if (!['openfoodfacts', 'placeholder'].includes(parsed?.source)) {
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
  const response = await fetch(`${baseUrl}/api/product-image?ean=3274080005003&v=2`, {
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
  const response = await fetch(`${baseUrl}/api/product-image?ean=3274080005003&v=2`, {
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

  if (!['openfoodfacts', 'placeholder'].includes(parsed?.source)) {
    throw new Error(`/api/product-image Accept: application/json returned unexpected payload: ${body.slice(0, 180)}`);
  }

  const vary = response.headers.get('vary') || '';
  if (!vary.toLowerCase().includes('accept')) {
    throw new Error(`/api/product-image Accept: application/json expected Vary: Accept, received "${vary}"`);
  }

  assertDebugHeaders(response, '/api/product-image Accept: application/json');
  console.log(`OK /api/product-image Accept: application/json -> ${response.status} source=${parsed.source}`);
}

async function run() {
  await checkHealth();
  await checkProductImageJson();
  await checkProductImageMode();
  await checkProductImageJsonByAccept();
  console.log('API verification completed successfully.');
}

run().catch((error) => {
  console.error('API verification failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
