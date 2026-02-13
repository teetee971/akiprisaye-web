# Provider layer (intégration progressive)

Cette couche introduit une architecture provider minimale et sûre dans `frontend/src/providers/`.

## Arborescence

- `frontend/src/providers/types.ts`
  - Contrats internes: `PriceProvider`, `ProviderResult`, statuts provider.
- `frontend/src/providers/normalize.ts`
  - Normalisation centralisée des `PriceObservation` (prix, unité, texte).
- `frontend/src/providers/seedProvider.ts`
  - Fallback obligatoire vers `seedProducts` (EAN ou recherche nom), filtrage territoire.
- `frontend/src/providers/openPricesProvider.ts`
  - Provider live Open Prices (feature-flag, timeout, parsing défensif, fallback propre).
- `frontend/src/providers/index.ts`
  - Orchestration des providers live/stub + fallback automatique seed si aucun prix live.

## Feature flags (via `import.meta.env`)

- `VITE_PRICE_PROVIDER_OPEN_FOOD_FACTS` (défaut: `true`)
- `VITE_PRICE_PROVIDER_OPEN_PRICES` (défaut: `false`)
- `VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT` (défaut: vide => provider `UNAVAILABLE`)
- `VITE_PRICE_PROVIDER_DATA_GOUV` (défaut: `false`)

Valeurs truthy acceptées: `1`, `true`, `on`, `yes`.

## Comportement de fallback

1. Les providers activés sont exécutés.
2. Si aucun provider ne retourne d'observation prix exploitable, le `seedProvider` est utilisé automatiquement.
3. En cas d’erreur provider, le flux continue (pas de blocage UI) et la recherche reste servie via seed.

## État actuel

- `open_food_facts`: enrichissement métadonnées produit (non bloquant).
- `open_prices`:
  - mode live activable par flag,
  - `timeout`/`abort` à 5s,
  - parsing strict et défensif,
  - si endpoint non configuré ou erreur HTTP/réseau/parsing: `UNAVAILABLE` + warning explicite.
- `data_gouv`: stub contrôlé par flag.
- `seedProducts`: fallback de sécurité (obligatoire).

## Limites connues (open_prices live)

- Aucun endpoint public stable n'est supposé par défaut.
- Sans `VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT`, le provider reste volontairement `UNAVAILABLE`.
- Le filtrage territoire est appliqué côté client; les observations hors territoire sont ignorées.

## Brancher une future API

1. Conserver `openPricesProvider.ts` et brancher l’endpoint réel via `VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT`.
2. Continuer à normaliser les observations via `normalizePriceObservation`.
3. Conserver la gestion de timeout/abort et le parser défensif.
4. Conserver le fallback seed en dernier filet de sécurité.
