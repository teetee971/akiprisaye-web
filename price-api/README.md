# price-api (Cloudflare Worker + D1)

Micro-service TypeScript pour centraliser les prix (`GET` public) et administrer les données (`POST` admin protégé par token).

## Fonctionnalités

- Source unique des prix pour les territoires `gp`, `mq`, `fr`.
- Agrégats stockés par `(ean, territory, retailer, currency, unit)` : `last/min/max/median/count`.
- Historique des observations avec `source`, `confidence`, `metadata_json` (extensible pour flux autorisés/back-office).
- Endpoints `GET` cacheables (Cloudflare cache + ETag).
- Endpoints `POST /v1/admin/*` protégés par `PRICE_ADMIN_TOKEN` + rate limit D1.
- Architecture de connecteurs autorisés (`src/connectors/*`) pour ingestion asynchrone via jobs.
- Traçabilité complète des runs dans D1 (`sources`, `fetch_jobs`, `fetch_job_items`).

## Setup

```bash
cd price-api
npm i
```

Créer la base D1 (remplacer le nom si besoin) :

```bash
npx wrangler d1 create price-db
```

Mettre à jour `wrangler.toml` avec le `database_id` retourné, puis appliquer les migrations :

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

### Admin

Header requis : `Authorization: Bearer <PRICE_ADMIN_TOKEN>`

#### POST

- `POST /v1/admin/products`
- `POST /v1/admin/observations`
- `POST /v1/admin/seed`
- `POST /v1/admin/fetch/run`
  - Body: `{ "territory": "fr|gp|mq", "sourceId"?: "backoffice", "limit"?: 25 }`
  - Crée un `fetch_job`, exécute le run immédiatement (MVP synchrone), écrit les `fetch_job_items`, insère les observations valides, puis recalcule les agrégats.

#### GET

- `GET /v1/admin/fetch/jobs?territory=&sourceId=&limit=`
  - Retourne la liste des jobs récents avec compteurs `ok/no_data/error/invalid`.

## Cron & scheduled jobs

`wrangler.toml` configure un cron toutes les 6h:

```toml
[triggers]
crons = ["0 */6 * * *"]
```

Le handler `scheduled()` exécute un job par territoire (`fr`, `gp`, `mq`) via un connecteur activé (fallback `backoffice`) en utilisant `ctx.waitUntil()`.

## Ajouter un connecteur autorisé

1. Créer un fichier dans `src/connectors/` qui implémente l’interface `Connector`.
2. Ajouter le connecteur à `src/connectors/registry.ts`.
3. Déclarer/mettre à jour la source dans `sources` (via `ensureDefaultSources` ou admin outillé).
4. Implémenter `fetchPrices({ territory, eans })` en respectant les contraintes de sécurité (aucun secret dans les logs, payload brut limité et tracé via `raw_payload_json`).

## Exemples cURL

```bash
curl -s "http://127.0.0.1:8787/v1/prices?ean=3560070894222&territory=gp"
```

```bash
curl -s "http://127.0.0.1:8787/v1/products/3560070894222"
```

```bash
curl -s -X POST "http://127.0.0.1:8787/v1/admin/fetch/run" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"territory":"fr","sourceId":"backoffice","limit":25}'
```

```bash
curl -s "http://127.0.0.1:8787/v1/admin/fetch/jobs?territory=fr&limit=20" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN"
```

## Seed

`POST /v1/admin/seed` insère le produit EAN `3560070894222` et des prix **placeholder** (`source=admin_seed`) pour démonstration.
Ces valeurs ne sont pas des prix réels et doivent être remplacées via back-office / sources autorisées.
