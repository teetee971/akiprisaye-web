# Couverture des endpoints `/api/*` consommés par le frontend

## Méthode d'inventaire
Commandes utilisées:
- `rg -n "fetch\(|axios\.|/api/" frontend/src frontend/public -g '!**/node_modules/**'`
- vérification des handlers existants dans `frontend/functions/api/*`

## Endpoints détectés (runtime frontend)

### Endpoints couverts par Pages Functions (`frontend/functions/api/*`)
- `GET /api/health` → `frontend/functions/api/health.ts`
- `GET /api/product` → `frontend/functions/api/product.ts`
- `GET /api/local-price` → `frontend/functions/api/local-price.ts`
- `GET /api/web-price` → `frontend/functions/api/web-price.ts`
- `GET /api/price-search` → `frontend/functions/api/price-search.ts`
- `GET /api/map/nearby` → `frontend/functions/api/map/nearby.ts` ✅ ajouté
- `GET /api/map/route` → `frontend/functions/api/map/route.ts` ✅ ajouté

### Endpoints encore non couverts dans `frontend/functions/api/*`
- `/api/prices` (GET/POST)
- `/api/prices/history/:productId`
- `/api/prices/history/:productId/aggregated`
- `/api/products/search`
- `/api/products/:productId/updates`
- `/api/products/updates/pending`
- `/api/products/updates/:updateId/approve`
- `/api/products/updates/:updateId/reject`
- `/api/gamification/*`
- `/api/scan/:ean`
- `/api/upload-ticket`

## Décision d'architecture
- Le frontend doit privilégier les endpoints relatifs `/api/*` en production (Cloudflare Pages + Functions).
- Les références backend Node local (`localhost:3001`) sont désormais limitées au développement uniquement (via résolution d'URL centralisée).
