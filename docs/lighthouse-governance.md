# Lighthouse CI — Gouvernance qualité

> Architecture, comportement et règles de décision du système Lighthouse CI de `akiprisaye-web`.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des scripts](#architecture-des-scripts)
3. [Moteur de décision](#moteur-de-décision)
4. [Baseline — Fonctionnement](#baseline--fonctionnement)
5. [Verdict — Logique complète](#verdict--logique-complète)
6. [Quality Score global](#quality-score-global)
7. [Seuils par métrique](#seuils-par-métrique)
8. [Budgets de performance](#budgets-de-performance)
9. [Politique d'URL auditée](#politique-durl-auditée)
10. [Override label](#override-label)
11. [Comportement sur PR](#comportement-sur-pr)
12. [Comportement sur main](#comportement-sur-main)
13. [Comportement sur déploiement réel](#comportement-sur-déploiement-réel)
14. [Codes de raison](#codes-de-raison)
15. [Diagnostics déterministes](#diagnostics-déterministes)
16. [Historique et tendance](#historique-et-tendance)
17. [Comment diagnostiquer un FAIL](#comment-diagnostiquer-un-fail)
18. [Comment durcir WARN → FAIL](#comment-durcir-warn--fail)
19. [Limites connues](#limites-connues)

---

## Vue d'ensemble

Le système Lighthouse CI est une **porte de qualité de gouvernance produit** :

- **Strict** : seuils documentés, comportement déterministe
- **Stable** : pas de faux positifs, fallbacks explicites
- **Explicable** : codes de raison structurés, diagnostics actionnables
- **Testable** : moteur pur (sans effets de bord), couvert par 79 tests unitaires
- **Factorisé** : toute logique métier centralisée dans `lighthouse-engine.mjs`
- **Maintenable** : une seule source de vérité pour les seuils

---

## Architecture des scripts

```
frontend/scripts/
├── lighthouse-engine.mjs        ← Source unique de vérité : seuils, verdicts, Quality Score
├── lighthouse-history.mjs       ← Gestion de l'historique compact (tendance)
├── lighthouse-guard.mjs         ← --write (scores) et --compare (quality gate)
├── lighthouse-pr-comment.mjs    ← Commentaire PR idempotent (niveau outil de décision)
├── lighthouse-summary.mjs       ← Résumé exécutif GITHUB_STEP_SUMMARY + logs
├── prepare-lighthouse-config.mjs ← Politique d'URL et génération config @lhci/cli
└── lighthouse-engine.test.ts    ← 79 tests unitaires du moteur de décision
```

### Responsabilités

| Script | Responsabilité |
|--------|----------------|
| `lighthouse-engine.mjs` | Toute la logique métier : seuils, Quality Score, budgets, verdicts, diagnostics |
| `lighthouse-history.mjs` | Gestion de l'historique JSON compact (N derniers runs) |
| `lighthouse-guard.mjs --write` | Extrait les scores des rapports `.report.json`, écrit `lighthouse-scores.json` |
| `lighthouse-guard.mjs --compare` | Télécharge la baseline GitHub, appelle le moteur, produit `/tmp/lh-verdict.json` |
| `lighthouse-pr-comment.mjs` | Lit `/tmp/lh-verdict.json`, poste/met à jour le commentaire PR (idempotent) |
| `lighthouse-summary.mjs` | Lit `/tmp/lh-verdict.json` et les rapports, écrit le résumé dans `$GITHUB_STEP_SUMMARY` |
| `prepare-lighthouse-config.mjs` | Applique la politique d'URL, génère `/tmp/lhcirc.json`, exporte `LH_*` env vars |

---

## Moteur de décision

**`lighthouse-engine.mjs`** est le cœur du système. Il exporte :

```javascript
// Constantes
METRIC_CONFIG           // seuils, poids, absoluteMin par métrique
QUALITY_SCORE_THRESHOLDS // seuils du Quality Score
BUDGET_RULES            // règles de budget (budget, unit, level, label)
VERDICT                 // { PASS, WARN, FAIL, NO_BASELINE }
REASON_CODE             // codes de raison structurés

// Fonctions pures (sans effets de bord)
computeQualityScore(scores)          // Quality Score pondéré sur 100
classifyQualityScore(qs)             // 'PASS' | 'WARN' | 'FAIL'
evaluateMetric(key, current, baseline) // résultat par métrique
evaluateMetrics(current, baseline)     // tableau de résultats
evaluateBudgets(lhReport)             // résultats budget depuis rapport Lighthouse
computeMetricTrend(values)            // tendance (régression linéaire)
computeTrends(history)                // tendances globales
generateReasonCodes(opts)             // liste de codes de raison
generateDiagnostics(opts)             // liste de diagnostics actionnables
determineVerdict(opts)                // verdict global selon règles de priorité
buildVerdictPayload(opts)             // payload complet (point d'entrée principal)
```

**Propriété clé** : le moteur est un module pur sans effets de bord. Il peut être importé et testé en isolation.

---

## Baseline — Fonctionnement

### Structure d'un fichier baseline (`lighthouse-scores.json`)

```json
{
  "url":           "http://localhost:4173/",
  "performance":   87,
  "accessibility": 93,
  "seo":           82,
  "bestPractices": 90,
  "timestamp":     "2026-03-18T01:30:00.000Z",
  "sha":           "a1b2c3d4...",
  "branch":        "main",
  "runId":         "123456789",
  "workflow":      "CI",
  "sourceType":    "localhost",
  "qualityScore":  90
}
```

### Artefacts GitHub Actions

| Artefact | Source | Durée | Usage |
|----------|--------|-------|-------|
| `lighthouse-scores` | `ci.yml` (localhost) | 90 jours | Baseline pour les PR |
| `lighthouse-scores-cloudflare` | `deploy-cloudflare-pages.yml` (CDN) | 90 jours | Baseline CDN réelle |
| `lighthouse-reports` | `ci.yml` | 30 jours | Rapports complets JSON + HTML |
| `lighthouse-cloudflare-reports` | `deploy-cloudflare-pages.yml` | 30 jours | Rapports complets CDN |

### Sélection de la baseline sur PR

Le guard télécharge l'artifact `lighthouse-scores` (localhost) du dernier run main réussi.

**Règle de sélection** :
1. Cherche l'artifact `lighthouse-scores` (non expiré, branche `main`)
2. Si absent → verdict `NO_BASELINE` (toléré, WARN)
3. Si présent mais incomplet/corrompu → `NO_BASELINE` (toléré)
4. Si `sourceType` baseline ≠ `sourceType` PR → comparaison cross-context (WARN)

**Ne jamais inventer une baseline.** Si la baseline est absente, l'état est `NO_BASELINE`, jamais un PASS implicite.

---

## Verdict — Logique complète

```
Règles de priorité (ordre strict) :

1. NO_BASELINE  si baseline absente ET tolerateNoBaseline=true
                → état visible, jamais silencieux

2. FAIL         si UNE condition FAIL est vraie :
                  - métrique: delta <= -failDrop (régression bloquante)
                  - métrique: score < absoluteMin
                  - qualityScore < QUALITY_SCORE_THRESHOLDS.warn (75)
                  - budget level:error dépassé
                → si override actif : FAIL → WARN (jamais PASS)

3. WARN         si UNE condition WARN est vraie (et aucun FAIL) :
                  - métrique: delta < 0 (légère régression)
                  - qualityScore < QUALITY_SCORE_THRESHOLDS.pass (90)
                  - budget level:warn dépassé
                  - urlInfo.wasFallback = true
                  - urlInfo.crossContext = true
                  - trendInfo.hasNegativeTrend = true
                  - baseline absente et non-toléré

4. PASS         si aucune des conditions FAIL/WARN
```

### Transitions FAIL/WARN/PASS/NO_BASELINE

| Condition | Sans override | Avec override |
|-----------|--------------|---------------|
| Régression bloquante | FAIL ❌ | WARN ⚠️ (journalisé) |
| Légère régression | WARN ⚠️ | WARN ⚠️ |
| Fallback localhost | WARN ⚠️ | WARN ⚠️ |
| Tendance négative | WARN ⚠️ | WARN ⚠️ |
| Pas de baseline (PR) | WARN ⚠️ | WARN ⚠️ |
| Pas de baseline (main bootstrap) | NO_BASELINE ℹ️ | NO_BASELINE ℹ️ |
| Tout OK | PASS ✅ | PASS ✅ |

---

## Quality Score global

```
Quality Score = somme(score_i × weight_i) / somme(weight_i_présents)

Poids :
  performance   : 40%
  accessibility : 30%
  bestPractices : 20%
  seo           : 10%

Seuils :
  >= 90 → PASS (potentiel)
  >= 75 → WARN (potentiel)
  <  75 → FAIL (bloquant si aucune métrique n'est en FAIL)

Important : le Quality Score ne masque JAMAIS un FAIL critique par métrique.
Si une métrique individuelle est en FAIL, le verdict global final est FAIL,
même si le Quality Score est >= 90.
```

---

## Seuils par métrique

Définis dans `METRIC_CONFIG` de `lighthouse-engine.mjs` :

| Métrique | warnDrop | failDrop | absoluteMin | Poids |
|---------|----------|----------|-------------|-------|
| performance | 1 pt | **5 pts** | 80 | 40% |
| accessibility | 1 pt | **2 pts** | 90 | 30% |
| bestPractices | 1 pt | **3 pts** | — | 20% |
| seo | 1 pt | **3 pts** | 80 | 10% |

**Lecture** : `failDrop=5` pour performance signifie :
- Baisse de 1-4 pts → **WARN**
- Baisse de ≥ 5 pts → **FAIL**

**Surcharge via env vars** (pour tests ou ajustements temporaires) :
```
THRESHOLD_PERFORMANCE=10     # override failDrop à 10 pour ce run
THRESHOLD_ACCESSIBILITY=5    # override failDrop à 5
THRESHOLD_SEO=5
THRESHOLD_BEST_PRACTICES=5
```

---

## Budgets de performance

Définis dans `BUDGET_RULES` de `lighthouse-engine.mjs` :

| Ressource | Budget | Unité | Level |
|-----------|--------|-------|-------|
| JS total | 350 | KB | warn |
| CSS total | 80 | KB | warn |
| Images | 500 | KB | warn |
| Total réseau | 1200 | KB | warn |
| Nb scripts | 15 | count | warn |
| Tiers | 5 | count | warn |

**Level** :
- `warn` → dépassement = WARN dans le verdict (non bloquant)
- `error` → dépassement = FAIL dans le verdict (bloquant)
- `off` → ignoré

Pour passer un budget de `warn` à `error` (bloquant), modifier `level` dans `BUDGET_RULES` et documenter la décision.

---

## Politique d'URL auditée

`prepare-lighthouse-config.mjs` applique la politique suivante :

```
Priorité :
  1. LHCI_URL défini ET valide → URL Cloudflare ou manuelle
  2. Sinon → localhost:4173 (fallback)

Métadonnées enregistrées :
  LH_AUDITED_URL  : URL réellement auditée
  LH_SOURCE_TYPE  : 'cloudflare' | 'manual' | 'localhost'
  LH_WAS_FALLBACK : '1' si localhost utilisé à la place de CDN
```

**Détection Cloudflare** : si l'URL contient `pages.dev` ou `cloudflare.com`, `sourceType = 'cloudflare'`.

**Fallback avec LHCI_EXPECT_CDN=1** :
Si `LHCI_EXPECT_CDN=1` et que l'URL Cloudflare n'est pas disponible, le fallback localhost est utilisé ET `LH_WAS_FALLBACK=1` est exporté → le verdict sera WARN pour signaler ce contexte dégradé.

---

## Override label

Label GitHub : **`ci:override-lighthouse`**

### Comportement

- Détecté dans le step `Check override label` du job `lighthouse` (ci.yml)
- Si actif : **FAIL → WARN** (uniquement, jamais PASS)
- Toujours journalisé :
  - Dans les logs CI
  - Dans `/tmp/lh-verdict.json` (`hasOverride: true`)
  - Dans le commentaire PR
  - Dans `$GITHUB_STEP_SUMMARY`
  - Dans les codes de raison (`REASON_CODE.OVERRIDE_ACTIVE`)

### Utilisation

```
1. Ajouter le label 'ci:override-lighthouse' à la PR
2. Un FAIL Lighthouse sera converti en WARN (CI passe)
3. Retirer le label une fois la dette technique résolue
```

**Règle impérative** : l'override ne produit JAMAIS un PASS implicite. Un FAIL converti en WARN reste visible partout.

---

## Comportement sur PR

1. **Build** → artefact local disponible
2. **prepare-lighthouse-config.mjs** → détermine l'URL (localhost par défaut sur PR)
3. **Run LHCI** → génère les rapports `.report.json`
4. **lighthouse-guard.mjs --write** → extrait les scores, écrit `lighthouse-scores.json`
5. **Check override label** → détecte `ci:override-lighthouse`
6. **lighthouse-guard.mjs --compare** → télécharge la baseline main, appelle le moteur, produit le verdict
   - Si FAIL (sans override) → **exit 1, merge bloqué**
   - Si FAIL (avec override) → WARN, merge autorisé mais override journalisé
   - Si WARN → exit 0, merge autorisé
   - Si NO_BASELINE → WARN, exit 0, merge autorisé
7. **lighthouse-pr-comment.mjs** → poste/met à jour le commentaire PR (jamais bloquant)
8. **lighthouse-summary.mjs** → écrit le résumé dans `$GITHUB_STEP_SUMMARY`
9. **Upload artifacts** → `lighthouse-reports` (30j) + `lighthouse-scores` (90j)

---

## Comportement sur main

1. Idem PR sauf step --compare qui n'est **pas exécuté** (pas de comparaison sur main)
2. Le `lighthouse-scores.json` produit devient la **nouvelle baseline** pour les prochaines PR
3. L'artefact `lighthouse-scores` (90 jours) est uploadé avec les métadonnées complètes

---

## Comportement sur déploiement réel

Déclenché par `deploy-cloudflare-pages.yml` après validation de déploiement :

1. **LHCI_URL** = URL preview Cloudflare réelle
2. **prepare-lighthouse-config.mjs** → `sourceType = 'cloudflare'`, pas de serveur local
3. **lighthouse-guard.mjs --write** → scores avec `sourceType: 'cloudflare'`
4. Artefacts dédiés : `lighthouse-cloudflare-reports` + `lighthouse-scores-cloudflare`
5. Pas de --compare (pas de régression guard sur Cloudflare) — la baseline CDN est tracée séparément

---

## Codes de raison

Chaque verdict inclut une liste de `reasonCodes` structurés :

| Code | Signification |
|------|--------------|
| `METRIC_REGRESSION_FAIL` | Baisse ≥ failDrop pour une métrique (delta <= -failDrop) |
| `METRIC_REGRESSION_WARN` | Baisse légère pour une métrique |
| `ABSOLUTE_SCORE_FAIL` | Score < absoluteMin (indépendant de la baseline) |
| `QUALITY_SCORE_FAIL` | Quality Score < 75 |
| `QUALITY_SCORE_WARN` | Quality Score entre 75 et 90 |
| `BUDGET_EXCEEDED_WARN` | Budget level:warn dépassé |
| `BUDGET_EXCEEDED_FAIL` | Budget level:error dépassé |
| `NO_BASELINE_AVAILABLE` | Aucune baseline exploitable |
| `BASELINE_CORRUPT` | Baseline présente mais invalide |
| `BASELINE_CROSS_CONTEXT` | Comparaison localhost vs CDN |
| `FALLBACK_LOCALHOST` | Localhost utilisé à la place de CDN |
| `OVERRIDE_ACTIVE` | Label `ci:override-lighthouse` actif |
| `TECHNICAL_ERROR` | Erreur technique inattendue |
| `TREND_NEGATIVE` | Tendance négative sur plusieurs runs |

---

## Diagnostics déterministes

Le moteur produit des diagnostics actionnables, secs et précis :

```
Performance: régression de 8 points (seuil bloquant: -5)
Accessibilité: score insuffisant (87/100, minimum requis: 90)
JS total: 420 KB (budget: 350 KB, dépassement: +70 KB)
Audit sur localhost:4173 (fallback — URL CDN non disponible)
Comparaison cross-context: PR auditée en localhost, baseline issue du CDN
Tendance négative détectée: Performance, Accessibilité
```

Pas de formulation vague. Pas de marketing. Du diagnostic exact.

---

## Historique et tendance

`lighthouse-history.mjs` maintient un historique compact (max 10 entrées).

### Structure d'un snapshot

```json
{
  "sha": "a1b2c3d4",
  "branch": "main",
  "runId": "123456789",
  "workflow": "CI",
  "auditedUrl": "http://localhost:4173/",
  "sourceType": "localhost",
  "timestamp": "2026-03-18T01:30:00.000Z",
  "performance": 87,
  "accessibility": 93,
  "seo": 82,
  "bestPractices": 90,
  "qualityScore": 90
}
```

### Calcul de tendance

Régression linéaire (moindres carrés) sur les N dernières valeurs :
- Pente > 0.5 → `trend: 'up'`
- Pente < -0.5 → `trend: 'down'`, `isNegative: true`
- Sinon → `trend: 'stable'`

Si `hasNegativeTrend = true`, le verdict est au minimum WARN.

---

## Comment diagnostiquer un FAIL

1. **Lire le verdict JSON** : `/tmp/lh-verdict.json` (disponible dans les logs CI)
2. **Lire les `reasonCodes`** : identifient précisément la cause
3. **Lire les `diagnostics`** : description actionnable
4. **Vérifier les métriques** : champ `metrics` avec `verdict`, `current`, `baseline`, `delta`
5. **Vérifier les budgets** : champ `budgets` avec `actual`, `budget`, `exceeded`
6. **Consulter le rapport complet** : artifact `lighthouse-reports` → fichier `.html`

### Exemple de diagnostic complet

```json
{
  "verdict": "FAIL",
  "reasonCodes": [
    { "code": "METRIC_REGRESSION_FAIL", "metric": "performance", "detail": "Performance: 79 (baseline: 90, delta: -11)" }
  ],
  "qualityScore": 83,
  "diagnostics": [
    "Performance: régression de 11 points (seuil bloquant: -5)"
  ]
}
```

**Action** : identifier ce qui a alourdi le bundle JS, causé un long render, etc. (voir rapport HTML).

---

## Comment durcir WARN → FAIL

Pour transformer une condition WARN en FAIL, deux options :

### Option 1 : Réduire `warnDrop` dans `METRIC_CONFIG`

```javascript
// lighthouse-engine.mjs
performance: { warnDrop: 0, failDrop: 3, ... } // toute baisse → FAIL
```

### Option 2 : Passer un budget de `warn` à `error`

```javascript
// lighthouse-engine.mjs
script: { budget: 350, unit: 'KB', level: 'error', ... } // dépassement bloquant
```

### Option 3 : Abaisser le seuil du Quality Score

```javascript
// lighthouse-engine.mjs
export const QUALITY_SCORE_THRESHOLDS = { pass: 90, warn: 80 }; // 80-89 → WARN, <80 → FAIL
```

**Règle** : toute modification des seuils doit être documentée dans ce fichier.

---

## Limites connues

1. **Variabilité Lighthouse** : les scores Lighthouse peuvent varier de 1-3 points selon la charge machine. Le seuil `warnDrop: 1` peut produire des WARN sur des runs instables. Augmenter `warnDrop` si trop de bruit.

2. **Tendance basée sur localhost uniquement** : l'historique de tendance mélange localhost et CDN si les deux sources sont utilisées. Filtrer par `sourceType` si nécessaire.

3. **Baseline cross-context** : si la baseline CDN (`lighthouse-scores-cloudflare`) est plus pertinente pour une PR, il faudrait une logique de sélection par `LH_ARTIFACT_NAME` configurée dans le workflow.

4. **Historique non persisté inter-PR** : l'historique est stocké en `/tmp/` et ne survit pas entre jobs. Pour une tendance fiable, uploader et télécharger l'artefact `lighthouse-history` dans le workflow (à implémenter si besoin).

5. **unzip requis** : le téléchargement de la baseline utilise `execSync('unzip')` — disponible sur `ubuntu-latest` mais à vérifier si le runner change.
