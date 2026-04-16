import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet } from './flight-offers.ts';

function makeRequest(query) {
  return new Request(`https://example.com/api/flight-offers?${query}`);
}

test('returns 400 for invalid IATA codes', async () => {
  const request = makeRequest('origin=PT&destination=ORY&departureDate=2026-06-15');
  const response = await onRequestGet({ request, env: {} });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /codes IATA/i);
});

test('returns 400 when returnDate is before departureDate', async () => {
  const request = makeRequest('origin=PTP&destination=ORY&departureDate=2026-06-15&returnDate=2026-06-10');
  const response = await onRequestGet({ request, env: {} });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /postérieure/i);
});

test('returns mapped offers and includes raw only when includeRaw=true', async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    const value = String(url);

    if (value.includes('/v1/security/oauth2/token')) {
      return new Response(JSON.stringify({ access_token: 'token-123', expires_in: 1800 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (value.includes('/v2/shopping/flight-offers')) {
      return new Response(JSON.stringify({
        data: [
          {
            id: '42',
            price: { total: '199.99', base: '150.00', currency: 'EUR' },
            validatingAirlineCodes: ['TX'],
            numberOfBookableSeats: 3,
            itineraries: [
              {
                duration: 'PT8H',
                segments: [
                  {
                    departure: { iataCode: 'PTP', at: '2026-06-15T08:00:00' },
                    arrival: { iataCode: 'ORY', at: '2026-06-15T16:00:00' },
                  },
                ],
              },
            ],
          },
        ],
        dictionaries: { carriers: { TX: 'Air Caraïbes' } },
        meta: { count: 1 },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('{}', { status: 404 });
  };

  const env = {
    AMADEUS_CLIENT_ID: 'id',
    AMADEUS_CLIENT_SECRET: 'secret',
    AMADEUS_HOST: 'https://test.api.amadeus.com',
  };

  const responseCompact = await onRequestGet({
    request: makeRequest('origin=PTP&destination=ORY&departureDate=2026-06-15&adults=1'),
    env,
  });
  assert.equal(responseCompact.status, 200);
  const compactBody = await responseCompact.json();

  assert.equal(compactBody.count, 1);
  assert.equal(compactBody.offers[0].id, '42');
  assert.equal(compactBody.offers[0].stops, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(compactBody.offers[0], 'raw'), false);

  const responseRaw = await onRequestGet({
    request: makeRequest('origin=PTP&destination=ORY&departureDate=2026-06-15&includeRaw=true'),
    env,
  });
  assert.equal(responseRaw.status, 200);
  const rawBody = await responseRaw.json();
  assert.equal(rawBody.includeRaw, true);
  assert.equal(rawBody.offers[0].raw.id, '42');
});
