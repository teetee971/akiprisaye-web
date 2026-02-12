# Audit Lighthouse — Quick Wins (mobile + desktop)

## Date et environnement
- **Date (UTC)**: 2026-02-12
- **Application testée**: build `vite` servi via `npm run preview` sur `http://localhost:4173`
- **Pages cibles**: `/`, `/comparateur`, `/observatoire`

## Résultats Lighthouse

> ⚠️ **Audit Lighthouse chiffré indisponible dans cet environnement CI**.
>
> Blocages constatés:
> - `npx lighthouse` ne peut pas lancer Chrome/Chromium (`Unable to connect to Chrome`).
> - tentative alternative PageSpeed API bloquée par quota (`429 RESOURCE_EXHAUSTED`).

### Scores (mobile + desktop)
- `/` : N/A (mobile), N/A (desktop)
- `/comparateur` : N/A (mobile), N/A (desktop)
- `/observatoire` : N/A (mobile), N/A (desktop)

### Principaux problèmes (LCP / CLS / INP)
- **LCP**: non mesurable dans ce runner.
- **CLS**: non mesurable dans ce runner.
- **INP**: non mesurable dans ce runner.

## Opportunités actionnables (no-risk)
- Compléter l’audit dans un runner avec Chrome disponible pour obtenir LCP/CLS/INP réels sur les 3 routes.
- Prioriser les optimisations sur `/comparateur` (chunk JS principal volumineux au build).

## Actions no-risk appliquées
1. **SEO**: title + meta description uniques pour `/`, `/comparateur`, `/observatoire` (et alignement OG/Twitter).
2. **Perf réseau**: `dns-prefetch` + `preconnect` vers `firestore.googleapis.com` et `www.googleapis.com`.
3. **Perf images**: sur le composant image produit, ajout de `decoding="async"` + `fetchPriority` piloté par `loading`.
4. **A11y légère**: `aria-label` explicite sur le logo de retour accueil.

## Commandes exécutées
- `cd frontend && npm ci --prefer-offline`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `cd frontend && npm run preview -- --host 0.0.0.0 --port 4173`
- `cd frontend && npx --yes lighthouse http://localhost:4173/ --chrome-flags='--headless --no-sandbox' --preset=desktop --output=json --output-path=./lighthouse-home-desktop.json`
