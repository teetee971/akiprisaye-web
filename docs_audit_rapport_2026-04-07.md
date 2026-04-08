# Rapport d’audit UX de bout en bout (vue utilisateur)

**Projet :** akiprisaye-web  
**Date d’audit :** 7 avril 2026  
**Approche :** parcours utilisateur + contrôles automatisés (build, lint, tests, smoke, sécurité npm)

## 1) Résumé exécutif

L’application se **compile** et le code passe le **lint**, ce qui confirme une base technique globalement saine.  
En revanche, des signaux de **régression UX/fonctionnelle** apparaissent sur la page d’accueil :

- 3 tests unitaires UX échouent sur le parcours Home.
- Un contrôle attendu (bouton “voir toute la page d’accueil”) n’est plus accessible au test utilisateur.
- Le comportement de soumission de recherche Home ne correspond plus à la route attendue (`/recherche-produits`).
- L’audit sécurité npm remonte une vulnérabilité transitive **modérée**.

## 2) Méthodologie “comme un utilisateur”

### Vérifications exécutées

1. Installation dépendances front : `npm ci --include=dev`.
2. Build production : `npm run build`.
3. Linting : `npm run lint`.
4. Tests front : `npm run test`.
5. Smoke test preview local : `node scripts/smoke-preview.mjs`.
6. Audit sécurité dépendances runtime : `npm run audit`.

### Limites de l’audit

- Les tests E2E Playwright réels n’ont pas pu être lancés car le téléchargement Chromium a été bloqué (HTTP 403 sur CDN Playwright).  
- Le smoke test a donc validé le rendu initial et les routes HTTP, mais sans navigation browser complète automatisée.

## 3) Résultats détaillés

## ✅ Points OK

- **Build production OK** : génération du bundle et postbuild exécutés.
- **Lint OK** : pas d’erreurs ESLint remontées.
- **Smoke preview OK** : `/`, `/login`, `/comparateur` accessibles sans crash runtime détecté sur contrôle HTTP/HTML.

## ⚠️ Points de vigilance

### A. Régression UX Home (tests en échec)

3 échecs dans `src/test/home.page.test.tsx` :

- Le test ne retrouve pas un bouton accessible nommé `voir toute la page d’accueil`.
- Le scénario d’extension de la homepage échoue pour la même raison.
- La soumission de recherche Home n’appelle plus la navigation attendue vers `/recherche-produits?q=...`.

**Impact utilisateur potentiel :**
- Contrôle de bascule de vue Home inaccessible ou masqué (risque accessibilité/ergonomie).
- Incohérence de parcours de recherche depuis l’entrée principale (friction conversion).

### B. Sécurité dépendances

`npm audit --omit=dev --audit-level=high` remonte :

- 1 vulnérabilité **modérée** (transitive) : `brace-expansion` via `glob`/`readdir-glob`.

**Impact :** risque limité à ce stade (pas “high”), mais dette sécurité à corriger.

## 4) Évaluation par axe

- **Parcours utilisateur principal (Home → Recherche)** : **Moyen** (régressions tests).
- **Robustesse build & qualité statique** : **Bon**.
- **Sécurité dépendances runtime** : **Moyen** (1 vulnérabilité modérée).
- **Couverture UX browser réelle** : **Partielle** (limite environnement Playwright).

## 5) Plan d’action recommandé (priorisé)

## P1 — Corriger la régression Home

- Vérifier le composant Home pour restaurer l’accessibilité réelle du bouton “voir toute la page d’accueil” (visibilité, aria, focus, libellé).
- Aligner le comportement de soumission recherche avec la route produit attendue (ou mettre à jour explicitement le contrat test si changement voulu).

## P2 — Stabiliser la chaîne d’audit UX

- Ajouter un job CI fallback qui exécute au minimum le smoke test quand Playwright/browser indisponible.
- Prévoir un mirror ou stratégie offline pour binaire Chromium afin d’éviter le blocage CDN.

## P3 — Hygiène sécurité

- Exécuter `npm audit fix` puis retester.
- Si blocage de version, figer une résolution (`overrides`) documentée jusqu’au correctif amont.

## 6) Verdict global

Le site est **techniquement livrable** côté build/lint/smoke, mais le parcours Home présente des signes de **régression fonctionnelle/accessibilité** à traiter avant validation UX complète.

**Statut recommandé :** Go conditionnel après correction des points P1.

---

## 7) Mise à jour corrective (7 avril 2026)

Suite aux correctifs appliqués sur la page Home :

- Le contrôle “voir toute la page d’accueil” est de nouveau accessible aux tests utilisateur.
- La soumission de recherche Home redirige de nouveau vers `/recherche-produits`.
- La suite de tests frontend repasse au vert (hors test ignoré existant).

**Nouveau statut recommandé :** Go ✅ (sur le périmètre Home audité).
