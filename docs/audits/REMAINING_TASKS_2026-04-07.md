# Reste à faire — 2026-04-07

## Statut rapide

- ✅ `verify:modules`: les modules backend, price-api, functions et frontend sont validés localement.
- ⚠️ `audit:head`: toujours bloqué depuis cet environnement (URL HEAD injoignable).

## Ce qu'il reste à faire

1. **Exécuter l’audit HEAD depuis un runner réseau autorisé**
   - Commande: `npm run audit:head`
   - Environnement requis: accès sortant vers Cloudflare Pages (et token Cloudflare Access si activé).

2. **Brancher `audit:head` dans la CI**
   - Ajouter une job dédiée (post-deploy ou nightly)
   - Publier le rapport en artifact CI

3. **Optionnel recommandé: budget qualité web**
   - Ajouter un audit Lighthouse authentifié en CI (LCP/CLS/INP/TBT)
   - Définir des seuils bloquants pour prévenir les régressions
