# Serverless Operations (Cloudflare Pages Functions)

## Debug local

1. Depuis `frontend/`, lancer l'app (`npm run dev`) pour vérifier le frontend.
2. En environnement Pages, vérifier les logs Functions avec le `requestId` (issu de `cf-ray`).
3. Rejouer les appels API avec les mêmes query params pour reproduire un comportement cache/rate-limit.

## Conventions headers

- `Content-Type: application/json; charset=utf-8` sur toutes les réponses JSON.
- `Cache-Control` via helper `setCacheHeaders` (`no-store|short|medium`).
- `Allow` renseigné sur `405 METHOD_NOT_ALLOWED`.
- `Retry-After` renseigné sur `429 RATE_LIMITED`.
- CORS:
  - `Access-Control-Allow-Origin` seulement si origin autorisée,
  - `Vary: Origin` systématique,
  - preflight `OPTIONS` avec `Access-Control-Allow-Methods/Headers`.

## Ajouter un nouvel endpoint

1. Créer `frontend/functions/api/<endpoint>.ts`.
2. Appliquer les helpers de `frontend/functions/_lib/`:
   - `handleOptions`, `methodGuard`, `parseQuery`/`parseJson`,
   - `jsonResponse`, `errorResponse`, `setCacheHeaders`,
   - `softRateLimit`, `getRequestId`, `logInfo/logWarn/logError`.
3. Valider les inputs avec `validate.ts` (ou ajouter un validateur pur et testé).
4. Maintenir la stabilité des payloads de succès (pas de breaking change).

## Checklist sécurité

- [ ] Aucun secret hardcodé.
- [ ] Validation stricte des query/body params.
- [ ] Méthodes HTTP limitées explicitement.
- [ ] Réponses d'erreur sans fuite de données sensibles.
- [ ] Cache désactivé (`no-store`) pour endpoints sensibles.
- [ ] Rate limiting best-effort activé si endpoint exposé publiquement.
- [ ] Logs sans payload brut utilisateur / tokens.
