const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:8788';

async function checkHealth() {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.text();
  if (response.status !== 200) {
    throw new Error(`/api/health expected 200, received ${response.status}. body=${body.slice(0, 180)}`);
  }
  console.log(`OK /api/health -> ${response.status}`);
}

async function checkProductImageJson() {
  const response = await fetch(`${baseUrl}/api/product-image?ean=3274080005003&format=json&v=2`);
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

  if (!['off', 'placeholder', 'none'].includes(parsed?.source)) {
    throw new Error(`/api/product-image?format=json returned unexpected payload: ${body.slice(0, 180)}`);
  }

  console.log(`OK /api/product-image?format=json -> ${response.status} source=${parsed.source}`);
}

async function checkProductImageMode() {
  const response = await fetch(`${baseUrl}/api/product-image?ean=3274080005003&v=2`, { redirect: 'manual' });
  const contentType = response.headers.get('content-type') || '';
  const isRedirect = response.status === 302;
  const isSvg = response.status === 200 && contentType.includes('image/svg+xml');

  if (!isRedirect && !isSvg) {
    const body = await response.text();
    throw new Error(`/api/product-image image mode expected 302 or 200 image/svg+xml, received ${response.status} content-type=${contentType}. body=${body.slice(0, 180)}`);
  }

  console.log(`OK /api/product-image image mode -> ${response.status} content-type=${contentType || 'n/a'}`);
}

async function run() {
  await checkHealth();
  await checkProductImageJson();
  await checkProductImageMode();
  console.log('API verification completed successfully.');
}

run().catch((error) => {
  console.error('API verification failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
