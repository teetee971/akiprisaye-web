import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost } from './scan-price.js';

function makeRequestWithImage({ type = 'image/png', bytes = [1, 2, 3, 4] } = {}) {
  const formData = new FormData();
  const file = new File([new Uint8Array(bytes)], 'photo.png', { type });
  formData.append('image', file);
  return new Request('https://example.com/api/scan-price', { method: 'POST', body: formData });
}

test('returns 500 when GEMINI_API_KEY is missing', async () => {
  const request = makeRequestWithImage();
  const response = await onRequestPost({ request, env: {} });

  assert.equal(response.status, 500);
  const body = await response.json();
  assert.match(body.error, /GEMINI_API_KEY/);
});

test('returns 415 for unsupported image type', async () => {
  const request = makeRequestWithImage({ type: 'application/pdf' });
  const response = await onRequestPost({ request, env: { GEMINI_API_KEY: 'x' } });

  assert.equal(response.status, 415);
  const body = await response.json();
  assert.match(body.error, /Type de fichier non supporté/);
});

test('returns parsed json payload when Gemini response is valid', async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => new Response(JSON.stringify({
    candidates: [
      {
        content: {
          parts: [
            { text: '{"campaign":{"name":"Test"},"stores_applicable":[],"products":[]}' },
          ],
        },
      },
    ],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const request = makeRequestWithImage();
  const response = await onRequestPost({ request, env: { GEMINI_API_KEY: 'x' } });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.json.campaign.name, 'Test');
});

test('retries transient Gemini error (503) then succeeds', async (t) => {
  const originalFetch = global.fetch;
  let callCount = 0;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    callCount += 1;

    if (callCount === 1) {
      return new Response(JSON.stringify({ error: { message: 'temporary outage' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              { text: '{"campaign":{"name":"Recovered"},"stores_applicable":[],"products":[]}' },
            ],
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const request = makeRequestWithImage();
  const response = await onRequestPost({ request, env: { GEMINI_API_KEY: 'x' } });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(callCount, 2);
  assert.equal(body.json.campaign.name, 'Recovered');
});

test('returns 500 after repeated network failures', async (t) => {
  const originalFetch = global.fetch;
  let callCount = 0;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    callCount += 1;
    throw new Error('network down');
  };

  const request = makeRequestWithImage();
  const response = await onRequestPost({ request, env: { GEMINI_API_KEY: 'x' } });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(callCount, 3);
  assert.match(body.message, /network down/);
});
