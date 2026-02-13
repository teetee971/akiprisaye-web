# Provider layer (intégration progressive)

Cette couche introduit une architecture provider minimale et sûre dans `frontend/src/providers/`.

## Arborescence

- `frontend/src/providers/types.ts`
  - Contrats internes: `PriceProvider`, `ProviderResult`, statuts provider.
- `frontend/src/providers/normalize.ts`
  - Normalisation centralisée des `PriceObservation` (prix, unité, texte).
- `frontend/src/providers/seedProvider.ts`
  - Fallback obligatoire vers `seedProducts` (EAN ou recherche nom), filtrage territoire.
- `frontend/src/providers/index.ts`
  - Orchestration des providers live/stub + fallback automatique seed si aucun prix live.

## Feature flags (via `import.meta.env`)

- `VITE_PRICE_PROVIDER_OPEN_FOOD_FACTS` (défaut: `true`)
- `VITE_PRICE_PROVIDER_OPEN_PRICES` (défaut: `false`)
- `VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT` (défaut: non défini, requis pour activer l'appel live)
- `VITE_PRICE_PROVIDER_DATA_GOUV` (défaut: `false`)

Valeurs truthy acceptées: `1`, `true`, `on`, `yes`.

## Comportement de fallback

1. Les providers activés sont exécutés.
2. Si aucun provider ne retourne d'observation prix exploitable, le `seedProvider` est utilisé automatiquement.
3. En cas d’erreur provider, le flux continue (pas de blocage UI) et la recherche reste servie via seed.

## État actuel

- `open_food_facts`: enrichissement métadonnées produit (non bloquant).
- `open_prices`: provider live via endpoint configurable (timeout 5s, parsing défensif, filtre territoire si disponible).
- `data_gouv`: stub contrôlé par flag.
- `seedProducts`: fallback de sécurité (obligatoire).

## Brancher une future API

1. Ajouter un provider conforme à `PriceProvider` dans `frontend/src/providers/`.
2. Normaliser les observations via `normalizePriceObservation`.
3. L’enregistrer dans `index.ts` et le protéger par un feature flag `import.meta.env`.
4. Conserver le fallback seed en dernier filet de sécurité.
