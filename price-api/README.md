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

## CSV Import – Production ingestion flow

### Endpoint sécurisé

- `POST /v1/admin/import/csv`
- Auth obligatoire: `Authorization: Bearer <PRICE_ADMIN_TOKEN>`
- Rate limit admin D1 identique aux autres endpoints admin
- Formats supportés:
  - `multipart/form-data` avec champ `file` (ou `csv`) + champ `territory`
  - `text/csv` avec query `?territory=gp` et optionnel header `x-filename`

Le Worker:
1. stocke le CSV brut dans R2 (`PRICE_IMPORTS`) via clé `imports/{jobId}/{filename}`;
2. crée un `import_job` en base;
3. démarre le traitement asynchrone avec `ctx.waitUntil()`.

### Suivi des imports

- `GET /v1/admin/import/jobs`
- `GET /v1/admin/import/jobs/:id`

Ces endpoints admin renvoient `Cache-Control: no-store`.

### Format CSV attendu

Colonnes obligatoires:

`ean,territory,retailer,storeLabel,price_cents,currency,observedAt`

Colonnes optionnelles:

`unit,quantity,promoLabel,sourceRef,confidence`

Exemple:

```csv
ean,territory,retailer,storeLabel,price_cents,currency,observedAt,unit,quantity,promoLabel,sourceRef,confidence
3560070894222,gp,carrefour,Carrefour Destreland,349,EUR,2026-02-18T12:00:00Z,l,75 cl,PROMO MARS,flyer-gp-20260218,0.92
3560070894222,mq,leclerc,Leclerc Dillon,375,EUR,2026-02-18T12:30:00Z,l,75 cl,,ticket-123,0.88
```

### Curl upload

Multipart:

```bash
curl -X POST "http://127.0.0.1:8787/v1/admin/import/csv" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -F "territory=gp" \
  -F "file=@./prices.csv;type=text/csv"
```

Raw CSV:

```bash
curl -X POST "http://127.0.0.1:8787/v1/admin/import/csv?territory=gp" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -H "Content-Type: text/csv" \
  -H "x-filename: prices-gp.csv" \
  --data-binary @./prices.csv
```

### Wrangler: D1 + R2

Créer/configurer bucket R2:

```bash
npx wrangler r2 bucket create price-imports
```

Appliquer les migrations D1:

```bash
npx wrangler d1 migrations apply PRICE_DB --local
npx wrangler d1 migrations apply PRICE_DB --remote
```

La migration `0003_imports.sql` ajoute:

- `import_jobs`
- `import_rows`
- index `idx_import_job_status`, `idx_import_rows_job`, `idx_import_rows_ean`
