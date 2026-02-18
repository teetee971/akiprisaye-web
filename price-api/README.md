# price-api (Cloudflare Worker + D1)

Micro-service TypeScript pour centraliser les prix (`GET` public) et administrer les données (`POST` admin protégé par token).

## Fonctionnalités

- Source unique des prix pour les territoires `gp`, `mq`, `fr`.
- Agrégats stockés par `(ean, territory, retailer, currency, unit)` : `last/min/max/median/count`.
- Historique des observations avec `source`, `confidence`, `metadata_json` (extensible pour flux autorisés/back-office).
- Endpoints `GET` cacheables (Cloudflare cache + ETag).
- Endpoints `POST /v1/admin/*` protégés par `PRICE_ADMIN_TOKEN` + rate limit D1.

## Setup

```bash
cd price-api
npm i
```

Créer la base D1 (remplacer le nom si besoin) :

```bash
npx wrangler d1 create price-db
```

Mettre à jour `wrangler.toml` avec le `database_id` retourné, puis appliquer la migration :

```bash
npx wrangler d1 migrations apply PRICE_DB --local
npx wrangler d1 migrations apply PRICE_DB --remote
```

Configurer le secret admin :

```bash
npx wrangler secret put PRICE_ADMIN_TOKEN
```

Configurer CORS en production via `ALLOWED_ORIGINS` (origines Cloudflare Pages exactes, séparées par virgule).

Lancer en dev :

```bash
npm run dev
```

## Endpoints

### Public (GET)

- `GET /v1/prices?ean=...&territory=gp&retailer=carrefour`
- `GET /v1/prices?ean=...&territory=gp`
- `GET /v1/products/:ean`

### Admin (POST)

Header requis : `Authorization: Bearer <PRICE_ADMIN_TOKEN>`

- `POST /v1/admin/products`
- `POST /v1/admin/observations`
- `POST /v1/admin/seed`

## Exemples cURL

```bash
curl -s "http://127.0.0.1:8787/v1/prices?ean=3560070894222&territory=gp"
```

```bash
curl -s "http://127.0.0.1:8787/v1/products/3560070894222"
```

```bash
curl -s -X POST "http://127.0.0.1:8787/v1/admin/products" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ean":"3560070894222",
    "productName":"Carrefour Classic’ Sirop de cerise / Cerise-Kers 75 cl",
    "brand":"Carrefour Classic’",
    "quantity":"75 cl"
  }'
```

```bash
curl -s -X POST "http://127.0.0.1:8787/v1/admin/observations" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ean":"3560070894222",
    "territory":"gp",
    "retailer":"carrefour",
    "price":3.49,
    "currency":"EUR",
    "unit":"l",
    "source":"admin",
    "confidence":0.9
  }'
```

```bash
curl -s -X POST "http://127.0.0.1:8787/v1/admin/seed" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN"
```

## Seed

`POST /v1/admin/seed` insère le produit EAN `3560070894222` et des prix **placeholder** (`source=admin_seed`) pour démonstration.
Ces valeurs ne sont pas des prix réels et doivent être remplacées via back-office / sources autorisées.

## Receipt ingest flow (photos ticket/facture/devis)

### Overview
1. `POST /v1/ingest/receipt/init` creates a job and returns short-lived signed PUT URLs for private R2 uploads.
2. Client uploads images directly to R2 (`receipt-ingest/{jobId}/{imageId}.jpg`) without Worker transit.
3. `POST /v1/ingest/receipt/complete` validates uploaded objects and triggers async OCR pipeline (`ctx.waitUntil`).
4. Worker runs extractor (provider configurable with `OCR_PROVIDER`) then mandatory PII redaction and normalization.
5. Worker stores sanitized receipt lines/totals in D1 (`receipt_jobs`, `receipt_images`, `receipt_items`).
6. Frontend polls `GET /v1/ingest/receipt/jobs/:jobId` and displays only sanitized result.
7. `POST /v1/ingest/receipt/jobs/:jobId/confirm` writes confirmed observations into `price_observations` (`source=receipt_user`).

### Endpoints

#### Init
```bash
curl -X POST "$PRICE_API_BASE/v1/ingest/receipt/init" \
  -H "Authorization: Bearer $RECEIPT_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"territory":"gp","sourceType":"receipt","imagesCount":3}'
```

#### Complete
```bash
curl -X POST "$PRICE_API_BASE/v1/ingest/receipt/complete" \
  -H "Authorization: Bearer $RECEIPT_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"<id>","images":[{"imageId":"<img>","sha256":"<hex64>","width":1080,"height":1920}]}'
```

#### Poll
```bash
curl -H "Authorization: Bearer $RECEIPT_USER_TOKEN" \
  "$PRICE_API_BASE/v1/ingest/receipt/jobs/<jobId>"
```

#### Confirm
```bash
curl -X POST "$PRICE_API_BASE/v1/ingest/receipt/jobs/<jobId>/confirm" \
  -H "Authorization: Bearer $RECEIPT_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"lineIndex":0,"productLabel":"Riz long","lineTotal":2.59}]}'
```

### PII redaction rules
- Removes/masks likely personal data before persistence: emails, phone numbers, card/IBAN-like numbers, address hints, loyalty identifiers.
- Keeps only business-safe fields: enseigne/magasin, date, item lines, totals, confidence, proof hashes/R2 keys.
- Redaction report is stored as counters (`pii_redaction_json`) without original values.
- `rawText` from OCR is internal-only and never returned in API responses.
- During confirmation, only lines with a valid EAN (`8-14` digits) are written to `price_observations`; others remain available in receipt job results for user correction.

### Security
- R2 bucket is private and used through signed URLs with short expiry (`expiresInSec=600`).
- Ingest endpoints require Bearer token (`RECEIPT_USER_TOKEN`) and share D1-based rate-limiting.
- CORS remains constrained by `ALLOWED_ORIGINS`.

### Limitations
- OCR provider integration is currently a pluggable stub (`dummy` extractor).
- Configure real providers via Worker secrets/vars (`OCR_PROVIDER`, `OCR_API_KEY`, `OCR_ENDPOINT`).
