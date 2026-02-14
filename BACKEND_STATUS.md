# Statut du dossier `backend/`

## État actuel
Le dossier `backend/` est conservé à titre de **prototype non déployé**.

La production web est déployée sur **Cloudflare Pages** avec:
- build frontend (`frontend/dist`)
- API serverless via **Pages Functions** (`frontend/functions/api/*`)

## Règle opérationnelle
- **Prod**: utiliser des chemins relatifs `/api/*` (Pages Functions)
- **Dev local**: fallback backend local possible selon configuration frontend

## Pourquoi le dossier est conservé
- Historique technique et base de travail potentielle pour une extraction API dédiée.
- Référence d'architecture pour endpoints complexes non encore migrés.

## Important
Aucune étape CI/CD de déploiement production ne publie actuellement `backend/`.
