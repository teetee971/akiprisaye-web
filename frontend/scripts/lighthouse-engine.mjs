#!/usr/bin/env node
/**
 * lighthouse-engine.mjs
 *
 * Moteur de décision Lighthouse — source unique de vérité pour :
 *   - seuils par métrique (warnDrop, failDrop, absoluteMin, weight)
 *   - Quality Score global pondéré
 *   - règles de budget
 *   - logique de verdict (PASS / WARN / FAIL / NO_BASELINE)
 *   - codes de raison structurés
 *   - diagnostics déterministes
 *   - calcul de tendance
 *
 * Ce module est importé par :
 *   lighthouse-guard.mjs       — écriture scores + comparaison baseline
 *   lighthouse-pr-comment.mjs  — commentaire PR idempotent
 *   lighthouse-summary.mjs     — résumé GitHub Actions
 *
 * Aucun effet de bord, aucune dépendance externe, entièrement testable.
 *
 * @see docs/lighthouse-governance.md pour la documentation complète.
 */

// ─── Configuration par métrique ───────────────────────────────────────────────

/**
 * Configuration complète par métrique.
 *
 * warnDrop    : baisse (pts) déclenchant WARN (inclusif). 0 = tout négatif warn.
 * failDrop    : baisse (pts) déclenchant FAIL (inclusif).
 * absoluteMin : score minimal absolu (null = pas de seuil absolu pour cette métrique).
 * weight      : poids dans le Quality Score global (la somme doit être 1.0).
 *
 * Exemple :
 *   performance failDrop=5 → baisse > 5 pts = FAIL, 1-5 pts = WARN.
 */
export const METRIC_CONFIG = {
  performance: {
    warnDrop: 1,
    failDrop: 5,
    absoluteMin: 80,
    weight: 0.40,
    label: 'Performance',
  },
  accessibility: {
    warnDrop: 1,
    failDrop: 2,
    absoluteMin: 90,
    weight: 0.30,
    label: 'Accessibilité',
  },
  bestPractices: {
    warnDrop: 1,
    failDrop: 3,
    absoluteMin: null,
    weight: 0.20,
    label: 'Best Practices',
  },
  seo: {
    warnDrop: 1,
    failDrop: 3,
    absoluteMin: 80,
    weight: 0.10,
    label: 'SEO',
  },
};

// ─── Quality Score ─────────────────────────────────────────────────────────────

/**
 * Seuils du Quality Score global pondéré.
 *   >= pass → PASS (potentiel)
 *   >= warn → WARN (potentiel)
 *   <  warn → FAIL
 */
export const QUALITY_SCORE_THRESHOLDS = { pass: 90, warn: 75 };

// ─── Budgets ───────────────────────────────────────────────────────────────────

/**
 * Règles de budget Lighthouse.
 *
 * level :
 *   'warn'  → dépassement produit WARN dans le verdict final (non bloquant)
 *   'error' → dépassement produit FAIL dans le verdict final (bloquant)
 *   'off'   → ignoré
 *
 * Les valeurs de budget correspondent aux settings dans lighthouserc.json.
 * Toute modification ici doit être répercutée dans lighthouserc.json et documentée.
 */
export const BUDGET_RULES = {
  script: {
    budget: 350,
    unit: 'KB',
    level: 'warn',
    label: 'JS total',
    lhResourceType: 'script',
  },
  stylesheet: {
    budget: 80,
    unit: 'KB',
    level: 'warn',
    label: 'CSS total',
    lhResourceType: 'stylesheet',
  },
  image: {
    budget: 500,
    unit: 'KB',
    level: 'warn',
    label: 'Images',
    lhResourceType: 'image',
  },
  total: {
    budget: 1200,
    unit: 'KB',
    level: 'warn',
    label: 'Total réseau',
    lhResourceType: 'total',
  },
  scriptCount: {
    budget: 15,
    unit: 'count',
    level: 'warn',
    label: 'Nb scripts',
    lhResourceType: 'script',
    countMode: true,
  },
  thirdParty: {
    budget: 5,
    unit: 'count',
    level: 'warn',
    label: 'Tiers',
    lhResourceType: 'third-party',
    countMode: true,
  },
};

// ─── Constantes de verdict ─────────────────────────────────────────────────────

/** Valeurs possibles du champ verdict. */
export const VERDICT = Object.freeze({
  PASS:        'PASS',
  WARN:        'WARN',
  FAIL:        'FAIL',
  NO_BASELINE: 'NO_BASELINE',
});

// ─── Codes de raison ───────────────────────────────────────────────────────────

/**
 * Codes de raison structurés pour expliquer chaque verdict.
 * Chaque code doit être documenté dans docs/lighthouse-governance.md.
 */
export const REASON_CODE = Object.freeze({
  METRIC_REGRESSION_FAIL:  'METRIC_REGRESSION_FAIL',   // baisse > failDrop
  METRIC_REGRESSION_WARN:  'METRIC_REGRESSION_WARN',   // 0 < baisse <= failDrop
  ABSOLUTE_SCORE_FAIL:     'ABSOLUTE_SCORE_FAIL',       // score < absoluteMin
  QUALITY_SCORE_FAIL:      'QUALITY_SCORE_FAIL',        // qualityScore < warn threshold
  QUALITY_SCORE_WARN:      'QUALITY_SCORE_WARN',        // warn <= qualityScore < pass threshold
  BUDGET_EXCEEDED_WARN:    'BUDGET_EXCEEDED_WARN',      // budget level:warn dépassé
  BUDGET_EXCEEDED_FAIL:    'BUDGET_EXCEEDED_FAIL',      // budget level:error dépassé
  NO_BASELINE_AVAILABLE:   'NO_BASELINE_AVAILABLE',     // aucune baseline trouvée
  BASELINE_CORRUPT:        'BASELINE_CORRUPT',          // baseline présente mais invalide
  BASELINE_CROSS_CONTEXT:  'BASELINE_CROSS_CONTEXT',    // comparaison localhost vs CDN
  FALLBACK_LOCALHOST:      'FALLBACK_LOCALHOST',         // audit localhost (URL réelle attendue)
  OVERRIDE_ACTIVE:         'OVERRIDE_ACTIVE',            // label ci:override-lighthouse actif
  TECHNICAL_ERROR:         'TECHNICAL_ERROR',            // erreur technique inattendue
  TREND_NEGATIVE:          'TREND_NEGATIVE',             // tendance négative sur N runs
});

// ─── Quality Score ─────────────────────────────────────────────────────────────

/**
 * Calcule le Quality Score global pondéré sur 100.
 *
 * Formule : somme(score_i * weight_i) / somme(weight_i des métriques présentes)
 * Normalise si toutes les métriques ne sont pas présentes.
 *
 * @param {Object} scores - { performance, accessibility, bestPractices, seo }
 * @returns {number} Score arrondi à l'entier.
 */
export function computeQualityScore(scores) {
  if (!scores || typeof scores !== 'object') return 0;
  let total = 0;
  let weightSum = 0;
  for (const [key, cfg] of Object.entries(METRIC_CONFIG)) {
    const score = scores[key];
    if (typeof score === 'number' && !Number.isNaN(score)) {
      total += score * cfg.weight;
      weightSum += cfg.weight;
    }
  }
  if (weightSum === 0) return 0;
  return Math.round(total / weightSum);
}

/**
 * Classifie le Quality Score selon les seuils.
 *
 * @param {number} qs
 * @returns {'PASS'|'WARN'|'FAIL'}
 */
export function classifyQualityScore(qs) {
  if (qs >= QUALITY_SCORE_THRESHOLDS.pass) return VERDICT.PASS;
  if (qs >= QUALITY_SCORE_THRESHOLDS.warn) return VERDICT.WARN;
  return VERDICT.FAIL;
}

// ─── Évaluation par métrique ───────────────────────────────────────────────────

/**
 * Évalue une métrique individuelle par rapport à la baseline.
 *
 * Règles de verdict pour une métrique :
 *   1. NO_BASELINE si baseline absente
 *   2. FAIL si delta <= -failDrop  (régression bloquante)
 *   3. WARN si delta < 0           (légère régression)
 *   4. FAIL si score < absoluteMin (score absolu insuffisant)
 *   5. PASS sinon
 *
 * @param {string} key                     - Clé de METRIC_CONFIG
 * @param {number} current                 - Score actuel (0-100)
 * @param {number|null} baseline           - Score baseline (null = absent)
 * @param {Object} [overrideThresholds]    - { [key]: { failDrop, warnDrop } }
 * @returns {Object} Résultat d'évaluation complet
 */
export function evaluateMetric(key, current, baseline, overrideThresholds = {}) {
  const cfg = METRIC_CONFIG[key];
  if (!cfg) throw new Error(`evaluateMetric: clé inconnue "${key}"`);

  const failDrop    = overrideThresholds[key]?.failDrop ?? cfg.failDrop;
  const warnDrop    = overrideThresholds[key]?.warnDrop ?? cfg.warnDrop;
  const absoluteMin = cfg.absoluteMin;
  const absoluteOk  = absoluteMin === null ? true : current >= absoluteMin;

  if (baseline === null || baseline === undefined) {
    return {
      key,
      label:        cfg.label,
      current,
      baseline:     null,
      delta:        null,
      failDrop,
      warnDrop,
      absoluteMin,
      absoluteOk,
      verdict:      VERDICT.NO_BASELINE,
      reasonCode:   REASON_CODE.NO_BASELINE_AVAILABLE,
    };
  }

  const delta = current - baseline;
  let verdict, reasonCode;

  if (delta <= -failDrop) {
    verdict    = VERDICT.FAIL;
    reasonCode = REASON_CODE.METRIC_REGRESSION_FAIL;
  } else if (delta < 0) {
    verdict    = VERDICT.WARN;
    reasonCode = REASON_CODE.METRIC_REGRESSION_WARN;
  } else {
    verdict    = VERDICT.PASS;
    reasonCode = null;
  }

  // Le seuil absolu peut upgrader un WARN ou PASS en FAIL (mais ne dégrade pas FAIL→FAIL)
  if (!absoluteOk && verdict !== VERDICT.FAIL) {
    verdict    = VERDICT.FAIL;
    reasonCode = REASON_CODE.ABSOLUTE_SCORE_FAIL;
  }

  return {
    key,
    label: cfg.label,
    current,
    baseline,
    delta,
    failDrop,
    warnDrop,
    absoluteMin,
    absoluteOk,
    verdict,
    reasonCode,
  };
}

/**
 * Évalue toutes les métriques définies dans METRIC_CONFIG.
 *
 * @param {Object} current                - Scores actuels
 * @param {Object|null} baseline          - Scores baseline (null = absent)
 * @param {Object} [overrideThresholds]   - Seuils surchargés
 * @returns {Object[]} Tableau des résultats par métrique
 */
export function evaluateMetrics(current, baseline, overrideThresholds = {}) {
  return Object.keys(METRIC_CONFIG).map(key =>
    evaluateMetric(
      key,
      current?.[key] ?? 0,
      baseline?.[key] ?? null,
      overrideThresholds,
    ),
  );
}

// ─── Évaluation des budgets ────────────────────────────────────────────────────

/**
 * Extrait les résultats de budget depuis un rapport Lighthouse JSON complet.
 *
 * Si lhReport est null ou malformé, retourne un tableau vide
 * (les budgets sont inconnus, jamais bloquants).
 *
 * @param {Object|null} lhReport - Rapport Lighthouse complet
 * @returns {Object[]} Résultats de budget
 */
export function evaluateBudgets(lhReport) {
  if (!lhReport) return [];

  const results = [];

  try {
    const items = lhReport.audits?.['resource-summary']?.details?.items ?? [];

    for (const [key, rule] of Object.entries(BUDGET_RULES)) {
      if (rule.level === 'off') continue;

      const item = items.find(i => i.resourceType === rule.lhResourceType);
      if (!item) continue;

      const actual = rule.countMode
        ? (item.requestCount ?? 0)
        : Math.round((item.transferSize ?? 0) / 1024);

      const exceeded = actual > rule.budget;

      results.push({
        key,
        label:      rule.label,
        actual,
        budget:     rule.budget,
        unit:       rule.unit,
        level:      rule.level,
        exceeded,
        reasonCode: exceeded
          ? (rule.level === 'error'
            ? REASON_CODE.BUDGET_EXCEEDED_FAIL
            : REASON_CODE.BUDGET_EXCEEDED_WARN)
          : null,
      });
    }
  } catch {
    // Rapport malformé → budgets inconnus (jamais bloquant)
  }

  return results;
}

// ─── Tendance / historique ─────────────────────────────────────────────────────

/**
 * Calcule la tendance d'une série de valeurs par régression linéaire.
 *
 * @param {number[]} values - Valeurs du plus ancien au plus récent
 * @returns {{ trend: 'up'|'down'|'stable', slope: number, isNegative: boolean }}
 */
export function computeMetricTrend(values) {
  if (!values || values.length < 2) {
    return { trend: 'stable', slope: 0, isNegative: false };
  }

  const n    = values.length;
  const sumX = values.reduce((s, _, i) => s + i, 0);
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumXY = values.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = values.reduce((s, _, i) => s + i * i, 0);

  const denom = (n * sumX2 - sumX * sumX);
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;

  const trend = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable';
  return { trend, slope: Math.round(slope * 100) / 100, isNegative: slope < -0.5 };
}

/**
 * Calcule les tendances pour toutes les métriques.
 *
 * @param {Object[]|null} history - Snapshots historiques
 * @returns {{ trends: Object, hasNegativeTrend: boolean }|null}
 */
export function computeTrends(history) {
  if (!history || history.length < 2) return null;

  const trends = {};
  for (const key of Object.keys(METRIC_CONFIG)) {
    const values = history
      .map(h => h[key])
      .filter(v => typeof v === 'number' && !Number.isNaN(v));
    trends[key] = computeMetricTrend(values);
  }

  const hasNegativeTrend = Object.values(trends).some(t => t.isNegative);
  return { trends, hasNegativeTrend };
}

// ─── Codes de raison ───────────────────────────────────────────────────────────

/**
 * Génère la liste des codes de raison expliquant le verdict.
 *
 * @param {Object} opts
 * @param {Object[]} opts.metricResults
 * @param {number}  opts.qualityScore
 * @param {string}  opts.qualityVerdict
 * @param {Object[]} opts.budgetResults
 * @param {Object}  opts.urlInfo
 * @param {boolean} opts.hasOverride
 * @param {Object|null} opts.trendInfo
 * @returns {Object[]} Codes de raison
 */
export function generateReasonCodes(opts = {}) {
  const {
    metricResults  = [],
    qualityScore,
    qualityVerdict,
    budgetResults  = [],
    urlInfo        = {},
    hasOverride    = false,
    trendInfo      = null,
  } = opts;

  const codes = [];

  for (const r of metricResults) {
    if (r.reasonCode) {
      codes.push({
        code:   r.reasonCode,
        metric: r.key,
        detail: `${r.label}: ${r.current}${r.baseline !== null ? ` (baseline: ${r.baseline}, delta: ${r.delta >= 0 ? '+' : ''}${r.delta})` : ' (pas de baseline)'}`,
      });
    }
  }

  if (qualityVerdict === VERDICT.FAIL) {
    codes.push({ code: REASON_CODE.QUALITY_SCORE_FAIL, detail: `Quality Score: ${qualityScore} (seuil FAIL: <${QUALITY_SCORE_THRESHOLDS.warn})` });
  } else if (qualityVerdict === VERDICT.WARN) {
    codes.push({ code: REASON_CODE.QUALITY_SCORE_WARN, detail: `Quality Score: ${qualityScore} (seuil WARN: <${QUALITY_SCORE_THRESHOLDS.pass})` });
  }

  for (const b of budgetResults) {
    if (b.reasonCode) {
      codes.push({
        code:   b.reasonCode,
        budget: b.key,
        detail: `${b.label}: ${b.actual} ${b.unit} (budget: ${b.budget} ${b.unit}, +${b.actual - b.budget} ${b.unit})`,
      });
    }
  }

  if (urlInfo.wasFallback) {
    codes.push({ code: REASON_CODE.FALLBACK_LOCALHOST, detail: 'Audit réalisé sur localhost (fallback — CDN non disponible)' });
  }
  if (urlInfo.crossContext) {
    codes.push({ code: REASON_CODE.BASELINE_CROSS_CONTEXT, detail: 'Comparaison cross-context: audit localhost vs baseline CDN (résultat dégradé)' });
  }
  if (hasOverride) {
    codes.push({ code: REASON_CODE.OVERRIDE_ACTIVE, detail: "Label 'ci:override-lighthouse' actif — FAIL converti en WARN" });
  }
  if (trendInfo?.hasNegativeTrend) {
    codes.push({ code: REASON_CODE.TREND_NEGATIVE, detail: 'Tendance négative détectée sur plusieurs runs consécutifs' });
  }

  return codes;
}

// ─── Diagnostics déterministes ─────────────────────────────────────────────────

/**
 * Génère des diagnostics actionnables à partir des résultats d'évaluation.
 *
 * Chaque diagnostic est :
 *   - sec (pas de marketing)
 *   - exact (chiffres inclus)
 *   - actionnable (la cause est nommée)
 *
 * @param {Object} opts
 * @returns {string[]} Liste de diagnostics
 */
export function generateDiagnostics(opts = {}) {
  const {
    metricResults  = [],
    budgetResults  = [],
    urlInfo        = {},
    baseline       = null,
    trendInfo      = null,
  } = opts;

  const diags = [];

  for (const r of metricResults) {
    if (r.verdict === VERDICT.FAIL) {
      if (r.reasonCode === REASON_CODE.METRIC_REGRESSION_FAIL) {
        diags.push(`${r.label}: régression de ${Math.abs(r.delta)} points (seuil bloquant: -${r.failDrop})`);
      } else if (r.reasonCode === REASON_CODE.ABSOLUTE_SCORE_FAIL) {
        diags.push(`${r.label}: score insuffisant (${r.current}/100, minimum requis: ${r.absoluteMin})`);
      }
    } else if (r.verdict === VERDICT.WARN && r.delta !== null && r.delta < 0) {
      diags.push(`${r.label}: légère baisse de ${Math.abs(r.delta)} point(s) (sous le seuil bloquant)`);
    }
  }

  for (const b of budgetResults) {
    if (b.exceeded) {
      const over = b.actual - b.budget;
      diags.push(`${b.label}: ${b.actual} ${b.unit} (budget: ${b.budget} ${b.unit}, dépassement: +${over} ${b.unit})`);
    }
  }

  if (urlInfo.wasFallback) {
    diags.push('Audit sur localhost:4173 (fallback — URL CDN non disponible)');
  }
  if (urlInfo.crossContext) {
    diags.push('Comparaison cross-context: PR auditée en localhost, baseline issue du CDN');
  }
  if (!baseline) {
    diags.push('Aucune baseline disponible — comparaison de régression impossible pour ce run');
  }

  if (trendInfo?.hasNegativeTrend) {
    const negativeMetrics = Object.entries(trendInfo.trends)
      .filter(([, t]) => t.isNegative)
      .map(([k]) => METRIC_CONFIG[k]?.label ?? k);
    if (negativeMetrics.length > 0) {
      diags.push(`Tendance négative détectée: ${negativeMetrics.join(', ')}`);
    }
  }

  return diags;
}

// ─── Verdict global ────────────────────────────────────────────────────────────

/**
 * Détermine le verdict global à partir de tous les résultats d'évaluation.
 *
 * Règles de priorité (ordre strict, documenté) :
 *   1. NO_BASELINE si baseline absente et contexte tolérant
 *   2. FAIL si métrique critique échoue OU qualityScore < warn threshold OU budget level:error dépassé
 *      → si override actif : FAIL est converti en WARN (jamais en PASS)
 *   3. WARN si métrique en WARN, OU qualityScore en WARN, OU budget level:warn dépassé,
 *            OU fallback localhost, OU comparaison cross-context, OU tendance négative
 *   4. PASS sinon
 *
 * Le verdict par métrique ne masque JAMAIS le verdict final :
 *   un FAIL métrique = FAIL global (sauf override explicite et journalisé).
 *
 * @param {Object} opts
 * @returns {'PASS'|'WARN'|'FAIL'|'NO_BASELINE'}
 */
export function determineVerdict(opts = {}) {
  const {
    metricResults      = [],
    qualityScore,
    qualityVerdict,
    budgetResults      = [],
    baselineAvailable  = true,
    tolerateNoBaseline = false,
    urlInfo            = {},
    hasOverride        = false,
    trendInfo          = null,
  } = opts;

  // Cas NO_BASELINE : état visible, jamais silencieux
  if (!baselineAvailable && tolerateNoBaseline) {
    return VERDICT.NO_BASELINE;
  }

  // FAIL conditions (priorité absolue)
  const hasCriticalFail = metricResults.some(r => r.verdict === VERDICT.FAIL);
  const hasBudgetFail   = budgetResults.some(b => b.exceeded && b.level === 'error');
  const hasQualityFail  = qualityVerdict === VERDICT.FAIL;

  if (hasCriticalFail || hasQualityFail || hasBudgetFail) {
    // Override : FAIL → WARN uniquement (jamais PASS, jamais silencieux)
    if (hasOverride) return VERDICT.WARN;
    return VERDICT.FAIL;
  }

  // WARN conditions
  const hasMetricWarn   = metricResults.some(r => r.verdict === VERDICT.WARN);
  const hasBudgetWarn   = budgetResults.some(b => b.exceeded && b.level === 'warn');
  const hasQualityWarn  = qualityVerdict === VERDICT.WARN;
  const hasFallback     = urlInfo.wasFallback === true;
  const hasCrossContext = urlInfo.crossContext === true;
  const hasTrendWarn    = trendInfo?.hasNegativeTrend === true;
  const noBaselineWarn  = !baselineAvailable && !tolerateNoBaseline;

  if (hasMetricWarn || hasBudgetWarn || hasQualityWarn || hasFallback || hasCrossContext || hasTrendWarn || noBaselineWarn) {
    return VERDICT.WARN;
  }

  return VERDICT.PASS;
}

// ─── Payload complet ───────────────────────────────────────────────────────────

/**
 * Point d'entrée principal du moteur.
 * Construit le payload de verdict complet à partir de toutes les entrées.
 *
 * @param {Object} opts
 * @param {Object} opts.current               - Scores actuels { performance, accessibility, bestPractices, seo }
 * @param {Object|null} opts.baseline         - Scores baseline (null si absent)
 * @param {Object} [opts.urlInfo]             - { auditedUrl, urlSource, wasFallback, crossContext }
 * @param {Object} [opts.baselineInfo]        - { sha, branch, runId, workflow, sourceType, timestamp }
 * @param {Object} [opts.overrideThresholds]  - Seuils surchargés par env vars
 * @param {boolean} [opts.tolerateNoBaseline] - true sur main (bootstrap), false sur PR
 * @param {boolean} [opts.hasOverride]        - true si label ci:override-lighthouse actif
 * @param {Object|null} [opts.lhReport]       - Rapport Lighthouse complet (pour budgets)
 * @param {Object[]|null} [opts.history]      - Historique pour calcul de tendance
 * @returns {Object} Payload de verdict complet
 */
export function buildVerdictPayload(opts = {}) {
  const {
    current,
    baseline            = null,
    urlInfo             = {},
    baselineInfo        = {},
    overrideThresholds  = {},
    tolerateNoBaseline  = false,
    hasOverride         = false,
    lhReport            = null,
    history             = null,
  } = opts;

  const metricResults = evaluateMetrics(current, baseline, overrideThresholds);
  const qualityScore  = computeQualityScore(current);
  const qualityVerdict = classifyQualityScore(qualityScore);
  const budgetResults = evaluateBudgets(lhReport);
  const trendInfo     = computeTrends(history);

  const baselineAvailable = baseline !== null && baseline !== undefined;

  const verdict = determineVerdict({
    metricResults,
    qualityScore,
    qualityVerdict,
    budgetResults,
    baselineAvailable,
    tolerateNoBaseline,
    urlInfo,
    hasOverride,
    trendInfo,
  });

  const reasonCodes = generateReasonCodes({
    metricResults,
    qualityScore,
    qualityVerdict,
    budgetResults,
    urlInfo,
    hasOverride,
    trendInfo,
  });

  const diagnostics = generateDiagnostics({
    metricResults,
    budgetResults,
    urlInfo,
    baseline,
    trendInfo,
  });

  return {
    verdict,
    reasonCodes,
    qualityScore,
    qualityVerdict,
    metrics:      metricResults,
    budgets:      budgetResults,
    baselineInfo,
    urlInfo,
    trendInfo,
    diagnostics,
    hasOverride,
    timestamp:    new Date().toISOString(),
  };
}
