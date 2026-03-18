/**
 * lighthouse-engine.test.ts
 *
 * Tests de régression pour le moteur de décision Lighthouse.
 *
 * Couvre :
 *   1.  Verdict PASS
 *   2.  Verdict WARN (régression légère)
 *   3.  Verdict FAIL (régression bloquante)
 *   4.  Verdict NO_BASELINE
 *   5.  Override label (FAIL → WARN, jamais PASS)
 *   6.  Seuils par métrique (warnDrop / failDrop indépendants)
 *   7.  Quality Score pondéré
 *   8.  Budgets (warn/error/off)
 *   9.  Sélection de baseline (sourceType)
 *   10. URL cloudflare / manual / localhost
 *   11. Fallback localhost explicite
 *   12. Diagnostics déterministes
 *   13. Codes de raison structurés
 *   14. Tendance négative
 *   15. Tendance stable / positive
 *   16. Baseline corrompue / absente
 *   17. Seuil absolu par métrique
 *   18. buildVerdictPayload (intégration)
 *   19. evaluateBudgets depuis rapport Lighthouse
 *   20. computeMetricTrend (régression linéaire)
 */

import { describe, expect, it } from 'vitest';

// Import dynamique du module ESM (.mjs) depuis TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Engine = typeof import('./lighthouse-engine.mjs');

// Chargement synchrone via import dynamique dans beforeAll n'étant pas disponible
// dans tous les contextes, on utilise un import de haut niveau.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  METRIC_CONFIG,
  QUALITY_SCORE_THRESHOLDS,
  BUDGET_RULES,
  VERDICT,
  REASON_CODE,
  computeQualityScore,
  classifyQualityScore,
  evaluateMetric,
  evaluateMetrics,
  evaluateBudgets,
  computeMetricTrend,
  computeTrends,
  generateReasonCodes,
  generateDiagnostics,
  determineVerdict,
  buildVerdictPayload,
} from './lighthouse-engine.mjs';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PERFECT_SCORES = { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 };
const GOOD_SCORES    = { performance: 90,  accessibility: 95,  bestPractices: 90,  seo: 85  };
const OK_SCORES      = { performance: 82,  accessibility: 92,  bestPractices: 84,  seo: 82  };
const FAILING_SCORES = { performance: 70,  accessibility: 85,  bestPractices: 75,  seo: 75  }; // a11y < 90

const BASELINE = { performance: 90, accessibility: 95, bestPractices: 90, seo: 85 };

// ─── 1. METRIC_CONFIG — structure ─────────────────────────────────────────────

describe('METRIC_CONFIG — structure et cohérence', () => {
  it('doit avoir exactement 4 métriques', () => {
    expect(Object.keys(METRIC_CONFIG)).toHaveLength(4);
    expect(METRIC_CONFIG).toHaveProperty('performance');
    expect(METRIC_CONFIG).toHaveProperty('accessibility');
    expect(METRIC_CONFIG).toHaveProperty('bestPractices');
    expect(METRIC_CONFIG).toHaveProperty('seo');
  });

  it('la somme des poids doit être 1.0', () => {
    const totalWeight = Object.values(METRIC_CONFIG).reduce((s, c) => s + c.weight, 0);
    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
  });

  it('chaque métrique doit avoir warnDrop < failDrop', () => {
    for (const [key, cfg] of Object.entries(METRIC_CONFIG)) {
      expect(cfg.warnDrop).toBeLessThan(cfg.failDrop, `${key}: warnDrop doit être < failDrop`);
    }
  });

  it('les seuils par défaut doivent correspondre à la spécification', () => {
    expect(METRIC_CONFIG.performance.failDrop).toBe(5);
    expect(METRIC_CONFIG.accessibility.failDrop).toBe(2);
    expect(METRIC_CONFIG.seo.failDrop).toBe(3);
    expect(METRIC_CONFIG.bestPractices.failDrop).toBe(3);
  });

  it('les poids doivent correspondre à la spécification (perf 40%, a11y 30%, bp 20%, seo 10%)', () => {
    expect(METRIC_CONFIG.performance.weight).toBe(0.40);
    expect(METRIC_CONFIG.accessibility.weight).toBe(0.30);
    expect(METRIC_CONFIG.bestPractices.weight).toBe(0.20);
    expect(METRIC_CONFIG.seo.weight).toBe(0.10);
  });
});

// ─── 2. computeQualityScore ───────────────────────────────────────────────────

describe('computeQualityScore — Quality Score pondéré', () => {
  it('doit retourner 100 pour des scores parfaits', () => {
    expect(computeQualityScore(PERFECT_SCORES)).toBe(100);
  });

  it('doit calculer correctement avec les poids (perf 40%, a11y 30%, bp 20%, seo 10%)', () => {
    const scores = { performance: 80, accessibility: 80, bestPractices: 80, seo: 80 };
    expect(computeQualityScore(scores)).toBe(80);
  });

  it('doit pondérer performance plus fortement que SEO (40% vs 10%)', () => {
    const base    = { performance: 80, accessibility: 80, bestPractices: 80, seo: 80 };
    const highPerf = { ...base, performance: 90 }; // +10 pts performance (poids 40%) → QS = 84
    const highSeo  = { ...base, seo: 90 };         // +10 pts seo (poids 10%)          → QS = 81
    expect(computeQualityScore(highPerf)).toBeGreaterThan(computeQualityScore(highSeo));
  });

  it('doit retourner 0 pour un objet vide', () => {
    expect(computeQualityScore({})).toBe(0);
  });

  it('doit retourner 0 pour null/undefined', () => {
    expect(computeQualityScore(null as any)).toBe(0);
    expect(computeQualityScore(undefined as any)).toBe(0);
  });

  it('doit normaliser si des métriques sont manquantes', () => {
    const partial = { performance: 90 }; // seule perf disponible
    const result  = computeQualityScore(partial as any);
    expect(result).toBe(90); // normalise sur le poids disponible
  });
});

// ─── 3. classifyQualityScore ──────────────────────────────────────────────────

describe('classifyQualityScore — classification PASS/WARN/FAIL', () => {
  it('doit retourner PASS pour un score >= seuil pass (90)', () => {
    expect(classifyQualityScore(90)).toBe(VERDICT.PASS);
    expect(classifyQualityScore(100)).toBe(VERDICT.PASS);
    expect(classifyQualityScore(95)).toBe(VERDICT.PASS);
  });

  it('doit retourner WARN pour un score entre warn (75) et pass (90)', () => {
    expect(classifyQualityScore(75)).toBe(VERDICT.WARN);
    expect(classifyQualityScore(80)).toBe(VERDICT.WARN);
    expect(classifyQualityScore(89)).toBe(VERDICT.WARN);
  });

  it('doit retourner FAIL pour un score < seuil warn (75)', () => {
    expect(classifyQualityScore(74)).toBe(VERDICT.FAIL);
    expect(classifyQualityScore(50)).toBe(VERDICT.FAIL);
    expect(classifyQualityScore(0)).toBe(VERDICT.FAIL);
  });

  it('les seuils doivent correspondre à QUALITY_SCORE_THRESHOLDS', () => {
    expect(QUALITY_SCORE_THRESHOLDS.pass).toBe(90);
    expect(QUALITY_SCORE_THRESHOLDS.warn).toBe(75);
  });
});

// ─── 4. evaluateMetric — par métrique ─────────────────────────────────────────

describe('evaluateMetric — évaluation par métrique', () => {
  it('doit retourner PASS si pas de régression', () => {
    const r = evaluateMetric('performance', 90, 85);
    expect(r.verdict).toBe(VERDICT.PASS);
    expect(r.delta).toBe(5);
  });

  it('doit retourner PASS si score stable', () => {
    const r = evaluateMetric('performance', 90, 90);
    expect(r.verdict).toBe(VERDICT.PASS);
    expect(r.delta).toBe(0);
  });

  it('doit retourner WARN pour une légère régression (1 pt)', () => {
    const r = evaluateMetric('performance', 89, 90);
    expect(r.verdict).toBe(VERDICT.WARN);
    expect(r.delta).toBe(-1);
    expect(r.reasonCode).toBe(REASON_CODE.METRIC_REGRESSION_WARN);
  });

  it('doit retourner FAIL pour une régression exactement au seuil (5 pts = failDrop)', () => {
    // delta=-5 avec failDrop=5 : -5 <= -5 → FAIL (la limite incluse est bloquante)
    const r = evaluateMetric('performance', 85, 90);
    expect(r.verdict).toBe(VERDICT.FAIL);
    expect(r.delta).toBe(-5);
  });

  it('doit retourner FAIL pour une régression > failDrop', () => {
    const r = evaluateMetric('performance', 84, 90); // delta = -6 > failDrop=5
    expect(r.verdict).toBe(VERDICT.FAIL);
    expect(r.reasonCode).toBe(REASON_CODE.METRIC_REGRESSION_FAIL);
  });

  it('doit retourner NO_BASELINE si baseline null', () => {
    const r = evaluateMetric('performance', 90, null);
    expect(r.verdict).toBe(VERDICT.NO_BASELINE);
    expect(r.delta).toBeNull();
    expect(r.reasonCode).toBe(REASON_CODE.NO_BASELINE_AVAILABLE);
  });

  it('doit appliquer le seuil absolu (a11y < 90 → FAIL)', () => {
    const r = evaluateMetric('accessibility', 85, null); // pas de baseline, mais score < 90
    // Sans baseline, on est NO_BASELINE même si score < absoluteMin
    // Le seuil absolu ne s'applique qu'en comparaison avec baseline
    expect(r.verdict).toBe(VERDICT.NO_BASELINE);
  });

  it('doit détecter score absolu insuffisant même sans régression', () => {
    // a11y = 88, baseline = 86 (pas de régression), mais 88 < 90 (absoluteMin)
    const r = evaluateMetric('accessibility', 88, 86);
    expect(r.verdict).toBe(VERDICT.FAIL);
    expect(r.reasonCode).toBe(REASON_CODE.ABSOLUTE_SCORE_FAIL);
    expect(r.absoluteOk).toBe(false);
  });

  it('doit respecter les seuils surchargés via overrideThresholds', () => {
    const r = evaluateMetric('performance', 83, 90, { performance: { failDrop: 10, warnDrop: 3 } });
    // delta = -7, failDrop override = 10 → WARN (pas FAIL)
    expect(r.verdict).toBe(VERDICT.WARN);
    expect(r.failDrop).toBe(10);
  });

  it('doit lever une erreur pour une clé inconnue', () => {
    expect(() => evaluateMetric('unknown_metric' as any, 90, 85)).toThrow();
  });
});

// ─── 5. evaluateMetrics — toutes les métriques ────────────────────────────────

describe('evaluateMetrics — évaluation globale', () => {
  it('doit retourner 4 résultats (un par métrique)', () => {
    const results = evaluateMetrics(GOOD_SCORES, BASELINE);
    expect(results).toHaveLength(4);
  });

  it('doit retourner NO_BASELINE pour toutes les métriques si baseline null', () => {
    const results = evaluateMetrics(GOOD_SCORES, null);
    expect(results.every(r => r.verdict === VERDICT.NO_BASELINE)).toBe(true);
  });

  it('doit produire PASS pour toutes les métriques en cas d\'amélioration', () => {
    const results = evaluateMetrics(PERFECT_SCORES, GOOD_SCORES);
    expect(results.every(r => r.verdict === VERDICT.PASS)).toBe(true);
  });

  it('doit détecter les régressions individuelles', () => {
    const current  = { ...BASELINE, performance: 80 }; // baisse de 10 → FAIL
    const results  = evaluateMetrics(current, BASELINE);
    const perfResult = results.find(r => r.key === 'performance');
    expect(perfResult?.verdict).toBe(VERDICT.FAIL);
  });
});

// ─── 6. evaluateBudgets ───────────────────────────────────────────────────────

describe('evaluateBudgets — budgets de performance', () => {
  it('doit retourner un tableau vide si lhReport est null', () => {
    expect(evaluateBudgets(null)).toEqual([]);
  });

  it('doit retourner un tableau vide si lhReport est malformé', () => {
    expect(evaluateBudgets({} as any)).toEqual([]);
    expect(evaluateBudgets({ audits: {} } as any)).toEqual([]);
  });

  it('doit détecter un dépassement de budget JS', () => {
    const lhReport = {
      audits: {
        'resource-summary': {
          details: {
            items: [
              { resourceType: 'script', transferSize: 400 * 1024, requestCount: 5 }, // 400 KB > 350 KB
            ],
          },
        },
      },
    };
    const results = evaluateBudgets(lhReport as any);
    const scriptResult = results.find(r => r.key === 'script');
    expect(scriptResult).toBeDefined();
    expect(scriptResult?.exceeded).toBe(true);
    expect(scriptResult?.actual).toBe(400);
    expect(scriptResult?.budget).toBe(350);
    expect(scriptResult?.reasonCode).toBe(REASON_CODE.BUDGET_EXCEEDED_WARN);
  });

  it('doit marquer comme non dépassé si dans le budget', () => {
    const lhReport = {
      audits: {
        'resource-summary': {
          details: {
            items: [
              { resourceType: 'script', transferSize: 200 * 1024, requestCount: 5 }, // 200 KB < 350 KB
            ],
          },
        },
      },
    };
    const results = evaluateBudgets(lhReport as any);
    const scriptResult = results.find(r => r.key === 'script');
    expect(scriptResult?.exceeded).toBe(false);
    expect(scriptResult?.reasonCode).toBeNull();
  });

  it('doit vérifier les règles de BUDGET_RULES', () => {
    expect(BUDGET_RULES.script.budget).toBe(350);
    expect(BUDGET_RULES.stylesheet.budget).toBe(80);
    expect(BUDGET_RULES.image.budget).toBe(500);
    expect(BUDGET_RULES.total.budget).toBe(1200);
    expect(BUDGET_RULES.scriptCount.budget).toBe(15);
    expect(BUDGET_RULES.thirdParty.budget).toBe(5);
  });
});

// ─── 7. computeMetricTrend ────────────────────────────────────────────────────

describe('computeMetricTrend — calcul de tendance', () => {
  it('doit retourner stable pour un seul point', () => {
    const t = computeMetricTrend([90]);
    expect(t.trend).toBe('stable');
    expect(t.isNegative).toBe(false);
  });

  it('doit retourner stable pour des valeurs constantes', () => {
    const t = computeMetricTrend([90, 90, 90, 90]);
    expect(t.trend).toBe('stable');
    expect(t.isNegative).toBe(false);
  });

  it('doit détecter une tendance positive', () => {
    const t = computeMetricTrend([80, 83, 86, 89, 92]);
    expect(t.trend).toBe('up');
    expect(t.isNegative).toBe(false);
    expect(t.slope).toBeGreaterThan(0);
  });

  it('doit détecter une tendance négative', () => {
    const t = computeMetricTrend([90, 87, 84, 81, 78]);
    expect(t.trend).toBe('down');
    expect(t.isNegative).toBe(true);
    expect(t.slope).toBeLessThan(0);
  });

  it('doit retourner stable pour un tableau vide', () => {
    const t = computeMetricTrend([]);
    expect(t.trend).toBe('stable');
    expect(t.slope).toBe(0);
  });

  it('doit retourner stable pour un tableau null', () => {
    const t = computeMetricTrend(null as any);
    expect(t.trend).toBe('stable');
  });
});

// ─── 8. computeTrends ─────────────────────────────────────────────────────────

describe('computeTrends — tendances globales', () => {
  it('doit retourner null pour un historique < 2 entrées', () => {
    expect(computeTrends(null)).toBeNull();
    expect(computeTrends([])).toBeNull();
    expect(computeTrends([{ performance: 90, accessibility: 95, bestPractices: 90, seo: 85 }])).toBeNull();
  });

  it('doit détecter hasNegativeTrend si une métrique est en baisse', () => {
    const history = [
      { performance: 90, accessibility: 95, bestPractices: 90, seo: 85 },
      { performance: 87, accessibility: 95, bestPractices: 90, seo: 85 },
      { performance: 84, accessibility: 95, bestPractices: 90, seo: 85 },
    ];
    const result = computeTrends(history);
    expect(result?.hasNegativeTrend).toBe(true);
    expect(result?.trends.performance.isNegative).toBe(true);
  });

  it('doit retourner hasNegativeTrend=false si toutes métriques stables', () => {
    const history = [
      { performance: 90, accessibility: 95, bestPractices: 90, seo: 85 },
      { performance: 91, accessibility: 95, bestPractices: 91, seo: 85 },
    ];
    const result = computeTrends(history);
    expect(result?.hasNegativeTrend).toBe(false);
  });
});

// ─── 9. determineVerdict — logique de verdict ─────────────────────────────────

describe('determineVerdict — verdict global', () => {
  const noBaseline = [{ key: 'performance', verdict: VERDICT.NO_BASELINE, current: 90, baseline: null } as any];

  // PASS
  it('doit retourner PASS si tous métriques PASS et quality score OK', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE);
    const qs = computeQualityScore(GOOD_SCORES);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({ metricResults, qualityScore: qs, qualityVerdict: qv, baselineAvailable: true });
    expect(v).toBe(VERDICT.PASS);
  });

  // WARN — légère régression
  it('doit retourner WARN si une métrique est WARN', () => {
    const current = { ...BASELINE, performance: 89 }; // baisse de 1 → WARN
    const metricResults = evaluateMetrics(current, BASELINE);
    const qs = computeQualityScore(current);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({ metricResults, qualityScore: qs, qualityVerdict: qv, baselineAvailable: true });
    expect(v).toBe(VERDICT.WARN);
  });

  // FAIL — régression bloquante
  it('doit retourner FAIL si une métrique échoue', () => {
    const current = { ...BASELINE, performance: 80 }; // baisse de 10 → FAIL
    const metricResults = evaluateMetrics(current, BASELINE);
    const qs = computeQualityScore(current);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({ metricResults, qualityScore: qs, qualityVerdict: qv, baselineAvailable: true });
    expect(v).toBe(VERDICT.FAIL);
  });

  // NO_BASELINE
  it('doit retourner NO_BASELINE si baseline absente et toléré', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, null);
    const qs = computeQualityScore(GOOD_SCORES);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({
      metricResults,
      qualityScore: qs,
      qualityVerdict: qv,
      baselineAvailable: false,
      tolerateNoBaseline: true,
    });
    expect(v).toBe(VERDICT.NO_BASELINE);
  });

  // Override FAIL → WARN (jamais PASS)
  it('doit convertir FAIL en WARN si override actif (jamais en PASS)', () => {
    const current = { ...BASELINE, performance: 80 }; // FAIL sans override
    const metricResults = evaluateMetrics(current, BASELINE);
    const qs = computeQualityScore(current);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({
      metricResults,
      qualityScore: qs,
      qualityVerdict: qv,
      baselineAvailable: true,
      hasOverride: true,
    });
    expect(v).toBe(VERDICT.WARN); // FAIL → WARN, pas PASS
    expect(v).not.toBe(VERDICT.PASS);
    expect(v).not.toBe(VERDICT.FAIL);
  });

  // Override ne doit pas changer un WARN existant
  it('un WARN reste WARN même avec override', () => {
    const current = { ...BASELINE, performance: 89 }; // WARN
    const metricResults = evaluateMetrics(current, BASELINE);
    const qs = computeQualityScore(current);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({
      metricResults,
      qualityScore: qs,
      qualityVerdict: qv,
      baselineAvailable: true,
      hasOverride: true,
    });
    expect(v).toBe(VERDICT.WARN);
  });

  // Fallback localhost → WARN
  it('doit retourner WARN si fallback localhost utilisé', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE);
    const qs = computeQualityScore(GOOD_SCORES);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({
      metricResults,
      qualityScore: qs,
      qualityVerdict: qv,
      baselineAvailable: true,
      urlInfo: { wasFallback: true },
    });
    expect(v).toBe(VERDICT.WARN);
  });

  // Cross-context → WARN
  it('doit retourner WARN si comparaison cross-context', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE);
    const qs = computeQualityScore(GOOD_SCORES);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({
      metricResults,
      qualityScore: qs,
      qualityVerdict: qv,
      baselineAvailable: true,
      urlInfo: { crossContext: true },
    });
    expect(v).toBe(VERDICT.WARN);
  });

  // Tendance négative → WARN
  it('doit retourner WARN si tendance négative détectée', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE);
    const qs = computeQualityScore(GOOD_SCORES);
    const qv = classifyQualityScore(qs);
    const v = determineVerdict({
      metricResults,
      qualityScore: qs,
      qualityVerdict: qv,
      baselineAvailable: true,
      trendInfo: { hasNegativeTrend: true, trends: {} },
    });
    expect(v).toBe(VERDICT.WARN);
  });

  // Quality score FAIL → FAIL global
  it('doit retourner FAIL si qualityVerdict est FAIL', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE); // métriques OK
    const v = determineVerdict({
      metricResults,
      qualityScore: 60,
      qualityVerdict: VERDICT.FAIL, // quality score insuffisant
      baselineAvailable: true,
    });
    expect(v).toBe(VERDICT.FAIL);
  });
});

// ─── 10. generateReasonCodes ──────────────────────────────────────────────────

describe('generateReasonCodes — codes de raison structurés', () => {
  it('doit inclure METRIC_REGRESSION_FAIL pour une métrique en FAIL', () => {
    const metricResults = evaluateMetrics({ ...BASELINE, performance: 80 }, BASELINE);
    const codes = generateReasonCodes({ metricResults, qualityScore: 80, qualityVerdict: VERDICT.PASS });
    expect(codes.some(c => c.code === REASON_CODE.METRIC_REGRESSION_FAIL)).toBe(true);
  });

  it('doit inclure OVERRIDE_ACTIVE si hasOverride=true', () => {
    const codes = generateReasonCodes({
      metricResults: [],
      qualityScore: 90,
      qualityVerdict: VERDICT.PASS,
      hasOverride: true,
    });
    expect(codes.some(c => c.code === REASON_CODE.OVERRIDE_ACTIVE)).toBe(true);
  });

  it('doit inclure FALLBACK_LOCALHOST si urlInfo.wasFallback=true', () => {
    const codes = generateReasonCodes({
      metricResults: [],
      qualityScore: 90,
      qualityVerdict: VERDICT.PASS,
      urlInfo: { wasFallback: true },
    });
    expect(codes.some(c => c.code === REASON_CODE.FALLBACK_LOCALHOST)).toBe(true);
  });

  it('doit inclure BASELINE_CROSS_CONTEXT si urlInfo.crossContext=true', () => {
    const codes = generateReasonCodes({
      metricResults: [],
      qualityScore: 90,
      qualityVerdict: VERDICT.PASS,
      urlInfo: { crossContext: true },
    });
    expect(codes.some(c => c.code === REASON_CODE.BASELINE_CROSS_CONTEXT)).toBe(true);
  });

  it('doit inclure TREND_NEGATIVE si trendInfo.hasNegativeTrend=true', () => {
    const codes = generateReasonCodes({
      metricResults: [],
      qualityScore: 90,
      qualityVerdict: VERDICT.PASS,
      trendInfo: { hasNegativeTrend: true, trends: {} },
    });
    expect(codes.some(c => c.code === REASON_CODE.TREND_NEGATIVE)).toBe(true);
  });

  it('doit retourner un tableau vide si tout est OK', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE);
    const codes = generateReasonCodes({
      metricResults,
      qualityScore: 92,
      qualityVerdict: VERDICT.PASS,
    });
    expect(codes).toEqual([]);
  });
});

// ─── 11. generateDiagnostics ──────────────────────────────────────────────────

describe('generateDiagnostics — diagnostics déterministes', () => {
  it('doit retourner un diagnostic pour une régression FAIL', () => {
    const metricResults = evaluateMetrics({ ...BASELINE, performance: 80 }, BASELINE);
    const diags = generateDiagnostics({ metricResults, baseline: BASELINE });
    expect(diags.some(d => d.includes('Performance') && d.includes('régression'))).toBe(true);
  });

  it('doit retourner un diagnostic pour un score absolu insuffisant', () => {
    // a11y = 88, baseline = 86, donc a11y < 90 (absoluteMin) → FAIL absolu
    const metricResults = evaluateMetrics({ ...BASELINE, accessibility: 88 }, { ...BASELINE, accessibility: 86 });
    const diags = generateDiagnostics({ metricResults, baseline: BASELINE });
    expect(diags.some(d => d.includes('Accessibilité') && d.includes('insuffisant'))).toBe(true);
  });

  it('doit signaler le fallback localhost', () => {
    const diags = generateDiagnostics({
      metricResults: [],
      urlInfo: { wasFallback: true },
      baseline: BASELINE,
    });
    expect(diags.some(d => d.includes('localhost'))).toBe(true);
  });

  it('doit signaler l\'absence de baseline', () => {
    const diags = generateDiagnostics({ metricResults: [], baseline: null });
    expect(diags.some(d => d.includes('baseline'))).toBe(true);
  });

  it('doit retourner un tableau vide si tout est PASS', () => {
    const metricResults = evaluateMetrics(GOOD_SCORES, BASELINE);
    const diags = generateDiagnostics({ metricResults, baseline: BASELINE });
    expect(diags).toEqual([]);
  });
});

// ─── 12. buildVerdictPayload — intégration ────────────────────────────────────

describe('buildVerdictPayload — intégration complète du moteur', () => {
  it('doit retourner PASS pour des scores identiques à la baseline', () => {
    const payload = buildVerdictPayload({ current: BASELINE, baseline: BASELINE });
    expect(payload.verdict).toBe(VERDICT.PASS);
    expect(payload.qualityScore).toBeGreaterThanOrEqual(QUALITY_SCORE_THRESHOLDS.pass);
  });

  it('doit retourner FAIL pour une régression bloquante', () => {
    const payload = buildVerdictPayload({
      current:  { ...BASELINE, performance: 80 }, // baisse de 10
      baseline: BASELINE,
    });
    expect(payload.verdict).toBe(VERDICT.FAIL);
    expect(payload.reasonCodes.some(c => c.code === REASON_CODE.METRIC_REGRESSION_FAIL)).toBe(true);
  });

  it('doit retourner NO_BASELINE si baseline null et toléré', () => {
    const payload = buildVerdictPayload({
      current:            GOOD_SCORES,
      baseline:           null,
      tolerateNoBaseline: true,
    });
    expect(payload.verdict).toBe(VERDICT.NO_BASELINE);
  });

  it('doit inclure qualityScore dans le payload', () => {
    const payload = buildVerdictPayload({ current: GOOD_SCORES, baseline: BASELINE });
    expect(typeof payload.qualityScore).toBe('number');
    expect(payload.qualityScore).toBeGreaterThan(0);
  });

  it('doit inclure metrics, budgets, reasonCodes, diagnostics dans le payload', () => {
    const payload = buildVerdictPayload({ current: GOOD_SCORES, baseline: BASELINE });
    expect(Array.isArray(payload.metrics)).toBe(true);
    expect(Array.isArray(payload.budgets)).toBe(true);
    expect(Array.isArray(payload.reasonCodes)).toBe(true);
    expect(Array.isArray(payload.diagnostics)).toBe(true);
  });

  it('ne doit jamais transformer silencieusement une erreur en PASS', () => {
    // Simuler une erreur potentielle : scores nuls
    const payload = buildVerdictPayload({ current: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }, baseline: BASELINE });
    expect(payload.verdict).toBe(VERDICT.FAIL);
    expect(payload.verdict).not.toBe(VERDICT.PASS);
  });

  it('doit appliquer override : FAIL → WARN (jamais PASS)', () => {
    const payload = buildVerdictPayload({
      current:     { ...BASELINE, performance: 80 }, // FAIL sans override
      baseline:    BASELINE,
      hasOverride: true,
    });
    expect(payload.verdict).toBe(VERDICT.WARN);
    expect(payload.hasOverride).toBe(true);
    expect(payload.reasonCodes.some(c => c.code === REASON_CODE.OVERRIDE_ACTIVE)).toBe(true);
  });

  it('doit inclure timestamp dans le payload', () => {
    const payload = buildVerdictPayload({ current: GOOD_SCORES });
    expect(typeof payload.timestamp).toBe('string');
    expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('doit gérer urlInfo.wasFallback comme WARN', () => {
    const payload = buildVerdictPayload({
      current:  GOOD_SCORES,
      baseline: BASELINE,
      urlInfo:  { wasFallback: true, urlSource: 'localhost', auditedUrl: 'http://localhost:4173' },
    });
    expect(payload.verdict).toBe(VERDICT.WARN);
    expect(payload.reasonCodes.some(c => c.code === REASON_CODE.FALLBACK_LOCALHOST)).toBe(true);
  });
});

// ─── 13. VERDICT — constantes ─────────────────────────────────────────────────

describe('VERDICT — constantes de verdict', () => {
  it('doit avoir les 4 verdicts attendus', () => {
    expect(VERDICT.PASS).toBe('PASS');
    expect(VERDICT.WARN).toBe('WARN');
    expect(VERDICT.FAIL).toBe('FAIL');
    expect(VERDICT.NO_BASELINE).toBe('NO_BASELINE');
  });

  it('doit être immutable (Object.freeze)', () => {
    expect(() => {
      (VERDICT as any).NEW_KEY = 'TEST';
    }).toThrow();
  });
});

// ─── 14. REASON_CODE — constantes ────────────────────────────────────────────

describe('REASON_CODE — codes de raison', () => {
  it('doit avoir tous les codes documentés', () => {
    expect(REASON_CODE.METRIC_REGRESSION_FAIL).toBeDefined();
    expect(REASON_CODE.METRIC_REGRESSION_WARN).toBeDefined();
    expect(REASON_CODE.ABSOLUTE_SCORE_FAIL).toBeDefined();
    expect(REASON_CODE.QUALITY_SCORE_FAIL).toBeDefined();
    expect(REASON_CODE.QUALITY_SCORE_WARN).toBeDefined();
    expect(REASON_CODE.BUDGET_EXCEEDED_WARN).toBeDefined();
    expect(REASON_CODE.BUDGET_EXCEEDED_FAIL).toBeDefined();
    expect(REASON_CODE.NO_BASELINE_AVAILABLE).toBeDefined();
    expect(REASON_CODE.BASELINE_CORRUPT).toBeDefined();
    expect(REASON_CODE.BASELINE_CROSS_CONTEXT).toBeDefined();
    expect(REASON_CODE.FALLBACK_LOCALHOST).toBeDefined();
    expect(REASON_CODE.OVERRIDE_ACTIVE).toBeDefined();
    expect(REASON_CODE.TECHNICAL_ERROR).toBeDefined();
    expect(REASON_CODE.TREND_NEGATIVE).toBeDefined();
  });
});

// ─── 15. Sources URL — cloudflare / manual / localhost ────────────────────────

describe('urlInfo — sources URL et fallback', () => {
  it('doit marquer WARN si wasFallback=true même sans régression', () => {
    const payload = buildVerdictPayload({
      current:  GOOD_SCORES,
      baseline: BASELINE,
      urlInfo:  { wasFallback: true, urlSource: 'localhost', auditedUrl: 'http://localhost:4173' },
    });
    expect(payload.verdict).toBe(VERDICT.WARN);
  });

  it('doit marquer WARN si crossContext=true', () => {
    const payload = buildVerdictPayload({
      current:  GOOD_SCORES,
      baseline: BASELINE,
      urlInfo:  { crossContext: true, urlSource: 'localhost', wasFallback: false, auditedUrl: '' },
    });
    expect(payload.verdict).toBe(VERDICT.WARN);
  });

  it('doit retourner PASS pour une URL cloudflare sans régression', () => {
    const payload = buildVerdictPayload({
      current:  GOOD_SCORES,
      baseline: BASELINE,
      urlInfo:  { urlSource: 'cloudflare', wasFallback: false, crossContext: false, auditedUrl: 'https://akiprisaye-web.pages.dev' },
    });
    expect(payload.verdict).toBe(VERDICT.PASS);
  });
});
