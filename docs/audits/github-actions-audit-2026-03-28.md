# Audit complet GitHub Actions — `teetee971/akiprisaye-web`

_Date de l'audit : 28 mars 2026 (UTC)._  
_Périmètre : page Actions du dépôt + audit statique des workflows versionnés._

## 1) Méthodologie

- Analyse de l'historique récent des runs via l'API GitHub Actions (`/actions/runs`, `/actions/runs/{id}/jobs`).
- Revue statique de tous les workflows dans `.github/workflows/*.yml`.
- Contrôle de points clés : sécurité des déclencheurs, permissions, robustesse d'exécution, observabilité, gouvernance.

## 2) Vue d'ensemble (exécution)

- **39 workflows** détectés dans le dépôt.
- Sur les **100 runs les plus récents** :
  - **70 succès**
  - **16 échecs**
  - **9 skipped**
  - **5 cancelled**
- Échec récent notable : `CI #3622` (événement `pull_request`) avec jobs en échec : `Lint`, `Test`, `Build`, `Verify Pages build`, `Lighthouse CI`.
- Plusieurs workflows automatisés (`workflow_run`) apparaissent en cascade, ce qui augmente le bruit opérationnel (runs déclenchés même lorsque le parent n'est pas stable).

## 3) Vue d'ensemble (configuration)

- Déclencheurs observés dans les workflows :
  - `workflow_dispatch` (20)
  - `schedule` (9)
  - `push` (7)
  - `pull_request` (2)
  - `pull_request_target` (1)
- Le workflow `Auto-merge on CI pass` est déclenché en `pull_request_target` avec `contents: write` + `pull-requests: write`.
- Les actions tierces/officielles sont majoritairement référencées par tag de version (`@vX`) et pas par SHA immuable.
- La majorité des jobs n'impose pas de `timeout-minutes` explicite.

## 4) Constats prioritaires

## 4.1 Fiabilité CI insuffisante (PR bloquantes)

**Constat :** des jobs essentiels du workflow `CI` échouent régulièrement sur PR récentes (lint, tests, build).

**Risque :** ralentissement du flux de merge, coûts runners inutiles, fatigue d'alerting.

**Actions recommandées :**
1. Introduire un objectif de stabilité (SLO) : p.ex. 95% de runs CI verts sur 7 jours.
2. Identifier les causes racines des 10 derniers échecs CI (catégories : test flaky, dette lint, env build).
3. Mettre en quarantaine temporaire les tests instables avec ticket + SLA de réactivation.

## 4.2 Risque de sécurité supply-chain des actions

**Constat :** utilisation quasi généralisée de références d'actions par tags (`@v6`, `@v7`, `@v8`, etc.) au lieu de SHA.

**Risque :** un tag peut évoluer; cela réduit l'immutabilité de la chaîne CI/CD.

**Actions recommandées :**
1. Geler les actions critiques par SHA (checkout, setup-node, github-script, upload-artifact, cache).
2. Garder Dependabot (ou équivalent) pour la mise à jour automatique des SHAs.
3. Documenter une politique interne "allowed actions".

## 4.3 `pull_request_target` + permissions d'écriture

**Constat :** auto-merge exécuté en contexte `pull_request_target` avec droits d'écriture.

**Risque :** même avec garde-fous sur l'acteur bot, cette combinaison est sensible et nécessite une hygiène stricte.

**Actions recommandées :**
1. Conserver une allow-list stricte d'acteurs (déjà en place) et la tester régulièrement.
2. Ajouter des conditions de merge supplémentaires : checks obligatoires explicitement listés + branche base `main`.
3. Activer l'option de validation branch protection la plus stricte (required checks + linear history si pertinent).

## 4.4 Timeouts manquants

**Constat :** la plupart des jobs n'ont pas de `timeout-minutes`.

**Risque :** jobs pendants, consommation runner prolongée, files d'attente.

**Actions recommandées :**
1. Définir un timeout par type de job (ex. 10 min lint/test rapides, 20-30 min build/lighthouse).
2. Ajouter `timeout-minutes` au niveau job sur les workflows critiques en priorité.

## 4.5 Complexité / explosion du nombre de workflows

**Constat :** grand volume de workflows (39) avec nombreux pipelines IA/SEO/growth/scraping.

**Risque :** maintenance difficile, couplages implicites, coûts et incidents plus difficiles à diagnostiquer.

**Actions recommandées :**
1. Cartographier les workflows par domaine (CI, déploiement, data, growth, IA).
2. Fusionner les workflows redondants et factoriser via `workflow_call`.
3. Ajouter convention de nommage + ownership clair par fichier workflow.

## 5) Plan d'action recommandé (30 jours)

### Semaine 1
- Stabilisation CI : triage des 10 derniers échecs + correction des causes récurrentes.
- Ajout de `timeout-minutes` sur les workflows critiques (`CI`, `deploy`, `security`).

### Semaine 2
- Migration progressive des actions vers pinning SHA pour les workflows les plus sensibles.
- Vérification stricte des permissions minimales par workflow.

### Semaine 3
- Rationalisation : regrouper workflows proches via `workflow_call`.
- Mise en place d'un tableau de bord minimal : taux de succès 7/30 jours, MTTR échecs CI.

### Semaine 4
- Durcissement auto-merge et revue des protections de branche.
- Revue de sécurité CI/CD (checklist + simulation d'incident action compromise).

## 6) Quick wins (impact élevé, effort faible)

1. Ajouter `timeout-minutes` sur tous les jobs `CI`.
2. Geler au moins `actions/checkout` et `actions/setup-node` par SHA sur workflows critiques.
3. Créer un workflow de synthèse hebdomadaire (succès/échecs/cancelled) publié en artifact Markdown.
4. Introduire une règle de "required checks" strictement alignée avec les jobs réellement stables.

## 7) Conclusion

La plateforme Actions est **fonctionnelle mais instable** sur le flux PR, avec une **surface de risque CI/CD modérée** (pinning, complexité, `pull_request_target` en écriture). La priorité doit être : **stabilité CI**, **immutabilité des actions**, puis **rationalisation** du parc de workflows.
