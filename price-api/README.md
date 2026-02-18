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
