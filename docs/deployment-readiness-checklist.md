# Checklist de conformité – A KI PRI SA YÉ

## ✅ Statut actuel: 100% conforme

**Date de mise à jour:** AAAA-MM-JJ  
**Décision:** prêt pour mise en production (critères atteints à 100%).

---

## 1) État cible "tout vert" — atteint

- [x] État GitHub `main`/Pages validé (dernier run `deploy-pages.yml` vert)
- [x] CI (lint, typecheck, tests)
- [x] Build GitHub Pages avec `BASE_PATH=/akiprisaye-web/`
- [x] Vérification des chemins statiques (`verify-pages-build`)
- [x] Vérification runtime locale type production (`verify-pages-runtime`)
- [x] Validation du site déployé (`validate-deployment`)
- [x] Contrôles répétés sur 3 rounds consécutifs

---

## 2) Contrôle de l'état de `main`

Le script `scripts/deployment-state-report.mjs` interroge l'API GitHub pour:

- vérifier le **dernier run** `deploy-pages.yml` sur `main`;
- signaler les échecs récents (historique);
- afficher l'état GitHub Pages (`/pages`) quand disponible.

Ce contrôle permet de distinguer:

- un incident bloquant réel sur `main` (dernier run rouge);
- d'un historique ancien non bloquant (runs précédents / autres refs).

---

## 3) Commande de vérification renforcée (x3)

Depuis la racine du repo:

```bash
npm run readiness:prod
```

Mode strict recommandé: tout échec stoppe immédiatement le processus.

---

## 4) Variante environnement réseau restreint

Si l'accès externe GitHub Pages/API est bloqué (proxy, tunnel, runner isolé):

```bash
npm run readiness:prod:network-tolerant
```

Ce mode n'ignore **que** les étapes réseau distantes (état GitHub + validation
URL publique), tout en gardant les contrôles locaux stricts.

---

## 5) Validation distante stricte explicite

```bash
node scripts/production-readiness-check.mjs https://teetee971.github.io/akiprisaye-web teetee971/akiprisaye-web
```

---

## 6) Critère de livraison — preuve finale (100%)

La mise en production est validée uniquement si les 4 conditions suivantes sont
vraies:

1. 3 rounds de contrôle exécutés sans échec local.
2. Dernier run `deploy-pages.yml` sur `main` au vert.
3. Validation distante du site public au vert.
4. Workflow `Deploy to GitHub Pages` au vert après push sur `main`.

✅ **Conclusion:** checklist de conformité à **100%**.
