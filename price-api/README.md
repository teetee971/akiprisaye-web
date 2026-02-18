# akiprisaye-price-api

Cloudflare Worker + D1 API for price observations and aggregates.

## Setup

```bash
cd price-api
npm install
wrangler d1 create akiprisaye_price_db
# copy database_id into wrangler.toml
wrangler secret put ADMIN_API_KEY
```

Optional secret override:

```bash
wrangler secret put ALLOWED_ORIGINS
```

## Migrations

```bash
npm run d1:migrate:local
npm run d1:migrate
```

## Env

- `ADMIN_API_KEY` (secret, required)
- `ALLOWED_ORIGINS` (CSV, defaults to wrangler vars)
- `AGG_WINDOW_DAYS` (default `60`)
- `CACHE_TTL_SECONDS` (default `21600`)
- `POST_RATE_LIMIT_PER_MIN` (default `30`)

## API contract

- `GET /v1/health` → `{ "ok": true, "service": "price-api", "ts": "..." }`
- `GET /v1/prices?ean=3560070894222&territory=gp&retailers=carrefour,leclerc&include=obs`
- `POST /v1/prices` with `Authorization: Bearer <ADMIN_API_KEY>`

Example POST body:

```json
{
  "ean": "3560070894222",
  "territory": "gp",
  "retailer": "carrefour",
  "price": 3.29,
  "currency": "EUR",
  "unit": "l",
  "pricePerUnit": 4.39,
  "observedAt": "2026-02-17T12:00:00.000Z",
  "source": "manual",
  "storeRef": "carrefour-destreland",
  "metadata": { "note": "promo", "photo": "optional" }
}
```

## Notes

- CORS is strict from `ALLOWED_ORIGINS`.
- `OPTIONS` always responds for preflight.
- `POST` requires both valid Origin and admin key.
- `GET` uses Cache API (`caches.default`) and ETag based on aggregate freshness and URL params.
- Territories: `fr`, `gp`, `mq`.
- Retailers: `carrefour`, `leclerc`, `intermarche`, `superu`.
