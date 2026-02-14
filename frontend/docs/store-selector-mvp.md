# StoreSelector MVP

## Objectif
Rendre l’application **magasin-aware** avec un choix persistant : magasin + mode de service.

## Périmètre livré
- `StoreChip` dans le header pour afficher la sélection courante.
- `StoreSelectorModal` mobile-friendly avec:
  - recherche texte (ville/code postal),
  - géolocalisation optionnelle,
  - tri par distance si position disponible,
  - sélection du mode (`magasin`, `drive`, `livraison`) avec options indisponibles désactivées.
- Persistance locale via `akps_store_selection_v1`.
- Contexte global React pour éviter les relectures répétées de `localStorage`.
- Injection de `territory`, `storeId`, `serviceMode` dans les paramètres de recherche prix.

## Données
- Source actuelle: `src/modules/store/stores.mock.ts` (MVP GP).
- Extension future: brancher un provider API/KV/Firestore derrière une interface store-provider.

## Robustesse UX
- Si géolocalisation refusée: pas de crash, message court + fallback recherche texte.
- Si aucun magasin sélectionné: bannière de rappel dans le comparateur pour améliorer la précision.

## Verification
La revue de risque avant merge confirme que les services n'importent pas `StoreSelectionContext`, que les accès `window/localStorage` sont protégés pour SSR/build, que les query params sont normalisés via `URLSearchParams` (avec validation du mode), que `/api/observations` parse les entrées en mode sûr sans casser l'existant, et que l'UX reste non bloquante sans sélection magasin.
