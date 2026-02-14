# Frontend API Endpoint Coverage

## Endpoints Cloudflare Pages Functions

- `GET /api/health` : heartbeat serverless.
- `GET /api/product` : normalisation produit via OpenFoodFacts.
- `GET /api/local-price` : agrégats locaux Firestore + fallback OFF.
- `GET /api/price-search` : recherche prix web via SerpApi.
- `GET /api/web-price` : alias de recherche web compatible frontend existant.

## Standards serverless

Toutes les Functions `/api/*` suivent désormais ces conventions:

- **Réponses JSON standardisées** via `jsonResponse` (`Content-Type` UTF-8, cache explicite).
- **Erreurs uniformes** via `errorResponse`:
  - format `{ ok:false, code, message, requestId, details? }`.
  - codes principaux: `INVALID_INPUT`, `MISSING_PARAM`, `INVALID_JSON`, `METHOD_NOT_ALLOWED`, `RATE_LIMITED`.
- **Request tracing**:
  - `requestId` basé sur `cf-ray` quand disponible, sinon ID court généré.
- **CORS contrôlé**:
  - réflexion conditionnelle de l’origine (same-origin ou `*.pages.dev`),
  - gestion preflight `OPTIONS` uniforme.
- **Rate limiting best-effort en mémoire**:
  - clé par IP (`cf-connecting-ip`), fenêtre 60s, 60 req max par défaut.
  - dépassement: `429`, header `Retry-After`, payload JSON stable.
- **Stratégie cache cohérente**:
  - `no-store` pour endpoints sensibles/erreurs,
  - `short` (`max-age=60`) pour lookup local,
  - `medium` (`max-age=300`) pour lookups web reproductibles.
- **Observabilité**:
  - logs compacts en prod (`requestId`, endpoint, status, duration),
  - logs détaillés en dev sans dump complet de payload utilisateur.
