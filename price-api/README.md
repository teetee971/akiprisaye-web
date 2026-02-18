# price-api

Micro-service Cloudflare Workers + D1 pour centraliser les prix Akiprisaye.

## Setup

```bash
cd price-api
npm install
```

Configurer les secrets/env :

```bash
npx wrangler secret put ADMIN_API_KEY
# optionnel
# npx wrangler secret put ALLOWED_ORIGINS
```

## Base de données D1

1. Créer la DB D1 puis renseigner `database_id` dans `wrangler.toml`.
2. Appliquer les migrations :

```bash
npm run db:migrate:local
npm run db:migrate:prod
```

## Développement

```bash
npm run dev
```

## Déploiement

```bash
npm run deploy
```

## Exemples curl

```bash
curl "http://127.0.0.1:8787/v1/health"

curl "http://127.0.0.1:8787/v1/prices?ean=3274080005003&territory=gp&retailers=carrefour,leclerc"

curl -X POST "http://127.0.0.1:8787/v1/prices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{
    "ean":"3274080005003",
    "territory":"gp",
    "retailer":"carrefour",
    "price":1.99,
    "currency":"EUR",
    "unit":"kg",
    "perUnit":1.99,
    "observedAt":"2026-02-17T10:00:00.000Z",
    "source":"manual"
  }'
```
