# Audit HEAD deployment - 2026-04-07

URL auditée: `https://head.akiprisaye-web.pages.dev/`

## Résultat de l'audit dans cet environnement

- L'URL HEAD n'est pas joignable depuis l'environnement d'exécution courant (`fetch failed` / `ENETUNREACH`).
- En conséquence, aucun score Lighthouse/PageSpeed fiable n'a pu être calculé ici.

## Améliorations recommandées (priorisées)

1. **Automatiser un audit depuis un runner réseau autorisé**
   - Exécuter `npm run audit:head` dans la CI (GitHub Actions/CircleCI) où l'accès sortant vers Cloudflare Pages est autorisé.
   - Publier le résultat en artifact de pipeline.

2. **Ajouter un audit Lighthouse authentifié si Cloudflare Access est activé**
   - Générer un service token Cloudflare Access.
   - Injecter les en-têtes d'accès dans la job d'audit.
   - Produire un budget de performance (LCP, INP, CLS, TBT) avec seuils bloquants.

3. **Créer une baseline de suivi**
   - Conserver un historique hebdomadaire des métriques web-vitals.
   - Déclencher une alerte si régression > 10% sur LCP/TBT.

4. **Compléter les contrôles HTTP côté déploiement**
   - Vérifier systématiquement les en-têtes: `CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
   - Vérifier `cache-control` sur HTML vs assets fingerprintés.

## Commande utilisée

```bash
npm run audit:head
```

Cette commande est désormais disponible au niveau racine et documentée dans le README.
