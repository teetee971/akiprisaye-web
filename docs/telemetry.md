# Local Telemetry (no backend)

Cette télémétrie est **strictement locale** :
- aucun envoi réseau,
- aucune analytics tierce,
- aucun backend,
- export manuel uniquement.

## Activation

Par défaut, la télémétrie est **désactivée**.

Activer via la variable d'environnement build/runtime frontend :
- `VITE_TELEMETRY_DEBUG=1`

## Données capturées

Événements (schéma strict):
- `search_start`
- `search_result`
- `cache_hit`
- `cache_miss`
- `cache_stale_used`
- `provider_run`
- `error`

Champs stockés:
- `ts`, `kind`, `territory`, `mode`
- `queryLen`, `eanLen`
- `durationMs`, `status`
- `sourcesUsed`, `warningsCount`
- `meta` (optionnel, max 5 clés)

## Vie privée

- Pas de PII.
- Pas de query brute.
- Pas d'EAN complet.
- Corrélation éventuelle via hash court non réversible (FNV-1a 32-bit).

## Stockage

- Priorité: IndexedDB
- Fallback: localStorage
- Capacité: 300 événements max (FIFO)

## UI Diagnostics

En mode debug uniquement (`/diagnostics`):
- 50 derniers événements,
- export JSON,
- vider l'historique,
- synthèse (cache hit rate, médiane durée, statuts).

## Limites

- Données locales au navigateur courant (non synchronisées entre appareils).
- Effaçables par l'utilisateur (clear storage).
