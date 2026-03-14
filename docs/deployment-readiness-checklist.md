# Checklist de conformité – A KI PRI SA YÉ

Objectif: obtenir un pipeline **100% vert** avant mise en production, avec une revérification approfondie en **3 rounds successifs**, et comprendre précisément l’état de `main`.

## 1) État cible "tout vert"

- État GitHub `main`/Pages validé (dernier run `deploy-pages.yml` vert) ✅
- CI (lint, typecheck, tests) ✅
- Build GitHub Pages avec `BASE_PATH=/akiprisaye-web/` ✅
- Vérification des chemins statiques (`verify-pages-build`) ✅
- Vérification runtime locale type production (`verify-pages-runtime`) ✅
- Validation du site déployé (`validate-deployment`) ✅
- Répéter les contrôles sur 3 rounds consécutifs ✅

## 2) Comprendre ce qui peut échouer sur la branche principale

Le script `scripts/deployment-state-report.mjs` interroge GitHub API pour:

- vérifier le **dernier run** `deploy-pages.yml` sur `main`,
- signaler les échecs récents (historique),
- afficher l’état GitHub Pages (`/pages`) quand disponible.

Cela permet d’isoler:

- un vrai incident `main` (dernier run rouge),
- d’un historique rouge non bloquant (anciens runs / refs non-main).

## 3) Commandes de contrôle renforcé (x3)

Depuis la racine du repo:

```bash
npm run readiness:prod
```

Mode strict (recommandé): tout échec stoppe immédiatement le processus.

## 4) Environnement réseau restreint (proxy, tunnel, etc.)

Si votre runner bloque l’accès externe GitHub Pages/API:

```bash
npm run readiness:prod:network-tolerant
```

Ce mode n’ignore **que** les étapes réseau distantes (état GitHub + validation URL publique), mais conserve strictement tous les contrôles locaux.

## 5) Validation distante stricte explicite

```bash
node scripts/production-readiness-check.mjs https://teetee971.github.io/akiprisaye-web teetee971/akiprisaye-web
```

## 6) Critère de livraison "preuve finale"

La mise en prod est considérée prête quand:

1. Les 3 rounds sont exécutés sans échec local.
2. Le dernier run `deploy-pages.yml` sur `main` est vert.
3. La validation distante du site public est verte.
4. Le workflow `Deploy to GitHub Pages` est vert après push sur `main`.
