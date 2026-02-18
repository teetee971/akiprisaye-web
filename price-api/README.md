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

### Admin (Bearer requis)

Header requis : `Authorization: Bearer <PRICE_ADMIN_TOKEN>`

- `GET /v1/admin/import/template`
- `POST /v1/admin/products`
- `POST /v1/admin/observations`
- `POST /v1/admin/seed`
- `POST /v1/admin/import/csv`

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

## CSV Import – Official Production Format v1

Le format CSV d'import est verrouillé et strictement validé.

### Colonnes obligatoires (ordre strict)

```csv
ean,product_name,brand,territory,retailer,store_name,price_eur,observed_at,currency
```

### Contraintes

- `ean` : regex stricte `^[0-9]{8,14}$`
- `product_name` : chaîne non vide
- `brand` : chaîne non vide
- `territory` : `fr` | `gp` | `mq`
- `retailer` : chaîne normalisée (`trim` + collapse des espaces + mapping canonique)
- `store_name` : chaîne non vide
- `price_eur` : décimal strict `> 0` avec max 2 décimales
- `observed_at` : ISO 8601 UTC strict (suffixe `Z`)
- `currency` : doit être exactement `EUR`

Validation stricte du header :

- Colonne manquante -> `400`
- Colonne supplémentaire -> `400`
- Ordre incorrect -> `400`

### Exemple valide

```csv
ean,product_name,brand,territory,retailer,store_name,price_eur,observed_at,currency
3560070894222,Sirop Cerise 75cl,Carrefour,gp,Carrefour,Carrefour Jarry,4.10,2026-02-17T18:35:00Z,EUR
```

### Télécharger le template officiel

```bash
curl -sS "http://127.0.0.1:8787/v1/admin/import/template" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -o price_import_template_v1.csv
```

### Upload CSV

```bash
curl -sS -X POST "http://127.0.0.1:8787/v1/admin/import/csv" \
  -H "Authorization: Bearer $PRICE_ADMIN_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @price_import_template_v1.csv
```

### Statuts d'import

- `success` : 0 erreur
- `partial` : au moins 1 ligne rejetée
- `failed` : 0 ligne valide

Le worker :

- insère systématiquement les observations en centimes
- recalcule les agrégats après chaque insertion
- normalise les retailers (`E.Leclerc`, `Carrefour`, `Super U`, `Intermarché`)
