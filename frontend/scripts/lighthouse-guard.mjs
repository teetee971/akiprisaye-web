#!/usr/bin/env node
/**
 * lighthouse-guard.mjs
 *
 * Quality guard Lighthouse CI — écriture des scores et comparaison baseline.
 *
 * Modes :
 *   --write   Lit .lighthouseci/*.report.json → écrit .lighthouseci/lighthouse-scores.json
 *             avec les métadonnées de baseline (sha, branch, runId, sourceType, qualityScore…)
 *   --compare Télécharge l'artifact baseline du dernier run main réussi via l'API GitHub,
 *             compare avec les scores actuels selon le moteur de décision (lighthouse-engine.mjs),
 *             produit un verdict PASS / WARN / FAIL / NO_BASELINE avec codes de raison,
 *             écrit /tmp/lh-verdict.json pour le commentaire PR et le résumé.
 *
 * Seuils de régression par métrique (défauts — surchargeable via env vars) :
 *   performance   : baisse ≥ 5 pts → FAIL  (1-4 pts → WARN)
 *   accessibility : baisse ≥ 2 pts → FAIL  (1 pt → WARN)
 *   seo           : baisse ≥ 3 pts → FAIL  (1-2 pts → WARN)
 *   best-practices: baisse ≥ 3 pts → FAIL  (1-2 pts → WARN)
 *
 * Variables d'environnement :
 *   GITHUB_TOKEN               — token GitHub (requis pour --compare)
 *   GITHUB_REPOSITORY          — "owner/repo" (automatique en GitHub Actions)
 *   GITHUB_SHA                 — SHA du commit (automatique)
 *   GITHUB_REF_NAME            — branche (automatique)
 *   GITHUB_RUN_ID              — ID du run (automatique)
 *   GITHUB_WORKFLOW            — nom du workflow (automatique)
 *   THRESHOLD_PERFORMANCE      — seuil max baisse Performance   (défaut : 5)
 *   THRESHOLD_ACCESSIBILITY    — seuil max baisse Accessibilité (défaut : 2)
 *   THRESHOLD_SEO              — seuil max baisse SEO           (défaut : 3)
 *   THRESHOLD_BEST_PRACTICES   — seuil max baisse Best Practices(défaut : 3)
 *   LH_ARTIFACT_NAME           — nom de l'artifact baseline     (défaut : lighthouse-scores)
 *   LH_HISTORY_PATH            — chemin historique local        (défaut : /tmp/lh-history.json)
 *   LHCI_DIR                   — répertoire des rapports        (défaut : .lighthouseci)
 *   LH_SOURCE_TYPE             — 'localhost' | 'cloudflare' | 'manual' (défaut : localhost)
 *   LH_AUDITED_URL             — URL réellement auditée
 *   LH_WAS_FALLBACK            — '1' si audit localhost utilisé comme fallback CDN
 *   LH_OVERRIDE_LABEL          — 'true' si label ci:override-lighthouse présent sur la PR
 *
 * Usage :
 *   node scripts/lighthouse-guard.mjs --write
 *   node scripts/lighthouse-guard.mjs --compare
 */

import fs           from 'fs';
import path         from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import {
  METRIC_CONFIG,
  computeQualityScore,
  buildVerdictPayload,
  VERDICT,
} from './lighthouse-engine.mjs';

import { loadHistory, appendToHistory, saveHistory, createSnapshot } from './lighthouse-history.mjs';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const mode          = process.argv[2] || '--write';
const dir           = path.resolve(process.cwd(), process.env.LHCI_DIR || '.lighthouseci');
const scoresFile    = path.join(dir, 'lighthouse-scores.json');
const ARTIFACT_NAME = process.env.LH_ARTIFACT_NAME || 'lighthouse-scores';
const BASELINE_OUT  = '/tmp/lh-baseline.json';
const VERDICT_OUT   = '/tmp/lh-verdict.json';
const HISTORY_PATH  = process.env.LH_HISTORY_PATH || '/tmp/lh-history.json';

// Verdicts possibles produits par ce script :
//   'PASS'        — aucune régression bloquante
//   'WARN'        — légère régression ou contexte dégradé (non bloquant)
//   'FAIL'        — régression signalée en avertissement (non bloquant — exit 0)
//   'NO_BASELINE' — aucune baseline disponible (visible, jamais silencieux)

// Per-metric regression thresholds (env vars, surchargent les défauts du moteur).
// Ces constantes doivent rester ici pour la surcharge par env var.
const THRESHOLD_PERFORMANCE    = Number(process.env.THRESHOLD_PERFORMANCE    ?? 5);
const THRESHOLD_ACCESSIBILITY  = Number(process.env.THRESHOLD_ACCESSIBILITY  ?? 2);
const THRESHOLD_SEO            = Number(process.env.THRESHOLD_SEO            ?? 3);
const THRESHOLD_BEST_PRACTICES = Number(process.env.THRESHOLD_BEST_PRACTICES ?? 3);

// Surchages transmises au moteur si différentes des défauts.
const overrideThresholds = {
  performance:   { failDrop: THRESHOLD_PERFORMANCE   },
  accessibility: { failDrop: THRESHOLD_ACCESSIBILITY },
  seo:           { failDrop: THRESHOLD_SEO           },
  bestPractices: { failDrop: THRESHOLD_BEST_PRACTICES },
};

// Contexte URL (alimenté par prepare-lighthouse-config.mjs via env vars).
const urlInfo = {
  auditedUrl:  process.env.LH_AUDITED_URL  || 'unknown',
  urlSource:   process.env.LH_SOURCE_TYPE  || 'localhost',
  wasFallback: process.env.LH_WAS_FALLBACK === '1',
  crossContext: false, // déterminé au moment de la comparaison
};

// Override label actif ?
const hasOverride = process.env.LH_OVERRIDE_LABEL === 'true';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readReports() {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(
    f => f.endsWith('.report.json') && f !== 'lighthouse-scores.json',
  );
}

/**
 * Extrait les scores depuis un rapport Lighthouse JSON.
 * Inclut les métadonnées de baseline pour un meilleur suivi.
 */
function extractScores(reportPath) {
  const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const scores = {
    url:           data.finalUrl || data.requestedUrl || urlInfo.auditedUrl || 'unknown',
    performance:   Math.round((data.categories.performance?.score         ?? 0) * 100),
    accessibility: Math.round((data.categories.accessibility?.score       ?? 0) * 100),
    seo:           Math.round((data.categories.seo?.score                 ?? 0) * 100),
    bestPractices: Math.round((data.categories['best-practices']?.score   ?? 0) * 100),
    timestamp:     new Date().toISOString(),
    // Métadonnées de baseline (Phase 4)
    sha:           process.env.GITHUB_SHA        || 'unknown',
    branch:        process.env.GITHUB_REF_NAME   || 'unknown',
    runId:         process.env.GITHUB_RUN_ID     || 'unknown',
    workflow:      process.env.GITHUB_WORKFLOW   || 'unknown',
    sourceType:    urlInfo.urlSource,
    qualityScore:  null, // calculé après
  };
  scores.qualityScore = computeQualityScore(scores);
  return scores;
}

// ─── --write mode ─────────────────────────────────────────────────────────────

function writeScores() {
  const reports = readReports();
  if (!reports.length) {
    console.log('⚠️  Aucun rapport .report.json — skip écriture des scores Lighthouse.');
    process.exit(0);
  }

  const scores = extractScores(path.join(dir, reports[0]));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));

  console.log('✅ Scores Lighthouse enregistrés → ' + scoresFile);
  console.log('   Performance   : ' + scores.performance);
  console.log('   Accessibilité : ' + scores.accessibility);
  console.log('   SEO           : ' + scores.seo);
  console.log('   Best Practices: ' + scores.bestPractices);
  console.log('   Quality Score : ' + scores.qualityScore + '/100');
  console.log('   Source        : ' + scores.sourceType);
  console.log('   URL           : ' + scores.url);

  // Mise à jour de l'historique local (si disponible)
  const history = loadHistory(HISTORY_PATH);
  const snapshot = createSnapshot(scores, {
    sha:        scores.sha,
    branch:     scores.branch,
    runId:      scores.runId,
    workflow:   scores.workflow,
    auditedUrl: scores.url,
    sourceType: scores.sourceType,
    timestamp:  scores.timestamp,
    _engine:    { computeQualityScore },
  });
  saveHistory(appendToHistory(history, snapshot), HISTORY_PATH);
}

// ─── --compare mode ────────────────────────────────────────────────────────────

async function compareScores() {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY;

  if (!token || !repo) {
    console.log('⚠️  GITHUB_TOKEN ou GITHUB_REPOSITORY non défini — régression guard ignoré.');
    _writeNoBaselineVerdict('NO_GITHUB_TOKEN', true);
    process.exit(0);
  }

  if (!fs.existsSync(scoresFile)) {
    console.log('⚠️  lighthouse-scores.json introuvable — exécuter --write d\'abord.');
    _writeNoBaselineVerdict('NO_SCORES_FILE', true);
    process.exit(0);
  }

  const current = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));

  // Mise à jour du contexte URL depuis les scores si disponible
  if (current.url && current.url !== 'unknown') urlInfo.auditedUrl = current.url;
  if (current.sourceType) urlInfo.urlSource = current.sourceType;

  const headers = {
    Authorization:          `Bearer ${token}`,
    Accept:                 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  let baseline = null;
  let baselineInfo = {};

  try {
    // Sélection de la meilleure baseline disponible (Phase 4)
    // Priorité : baseline même contexte (localhost) > baseline cross-context (cloudflare)
    const listUrl = `https://api.github.com/repos/${repo}/actions/artifacts?name=${encodeURIComponent(ARTIFACT_NAME)}&per_page=10`;
    const listRes = await fetch(listUrl, { headers });
    if (!listRes.ok) throw new Error(`API list ${listRes.status}: ${await listRes.text()}`);

    const { artifacts } = await listRes.json();
    const artifact = (artifacts || []).find(
      a => !a.expired && a.workflow_run?.head_branch === 'main',
    );

    if (!artifact) {
      console.log(`ℹ️  Aucun artifact "${ARTIFACT_NAME}" sur main — NO_BASELINE (première exécution).`);
      _writeNoBaselineVerdict('NO_ARTIFACT', true);
      process.exit(0);
    }

    console.log(`📦 Baseline trouvée : artifact #${artifact.id} (${artifact.created_at})`);

    // Téléchargement ZIP
    const dlRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/artifacts/${artifact.id}/zip`,
      { headers },
    );
    if (!dlRes.ok) throw new Error(`Download artifact ${dlRes.status}`);

    const zipPath = '/tmp/lh-baseline.zip';
    fs.writeFileSync(zipPath, Buffer.from(await dlRes.arrayBuffer()));

    const json = execSync(`unzip -p ${zipPath} lighthouse-scores.json`, { encoding: 'utf8' });
    baseline = JSON.parse(json);

    // Validation de la baseline
    const requiredKeys = ['performance', 'accessibility', 'seo', 'bestPractices'];
    const isValid = requiredKeys.every(k => typeof baseline[k] === 'number');
    if (!isValid) {
      console.warn('⚠️  Baseline corrompue ou incomplète (champs manquants) — NO_BASELINE.');
      _writeNoBaselineVerdict('BASELINE_CORRUPT', true);
      process.exit(0);
    }

    // Sauvegarde baseline pour le commentaire PR
    fs.writeFileSync(BASELINE_OUT, JSON.stringify(baseline, null, 2));

    baselineInfo = {
      sha:        baseline.sha        || 'unknown',
      branch:     baseline.branch     || 'main',
      runId:      baseline.runId      || String(artifact.workflow_run?.id || ''),
      workflow:   baseline.workflow   || 'unknown',
      sourceType: baseline.sourceType || 'localhost',
      timestamp:  baseline.timestamp  || artifact.created_at,
      auditedUrl: baseline.url        || 'unknown',
    };

    // Détection comparaison cross-context (Phase 4)
    const prSourceType       = urlInfo.urlSource    || 'localhost';
    const baselineSourceType = baselineInfo.sourceType || 'localhost';
    if (prSourceType !== baselineSourceType) {
      urlInfo.crossContext = true;
      console.warn(`⚠️  Comparaison cross-context détectée : PR="${prSourceType}" vs baseline="${baselineSourceType}"`);
      console.warn('   → Le résultat de comparaison est dégradé (contextes différents).');
    }

    console.log(`📊 Baseline URL: ${baseline.url || 'N/A'}, date: ${baseline.timestamp?.slice(0, 10) || 'N/A'}`);
    console.log(`   Baseline Quality Score : ${baseline.qualityScore ?? 'N/A'}`);
  } catch (err) {
    console.error('❌ Erreur technique lors de la récupération de la baseline : ' + err.message);
    console.error('   → Erreur bloquante : artifact inaccessible, JSON illisible ou parse cassé.');
    _writeNoBaselineVerdict('FETCH_ERROR', false);
    process.exit(1);
  }

  // ── Moteur de décision (Phase 1) ──────────────────────────────────────────

  const history = loadHistory(HISTORY_PATH);
  const payload = buildVerdictPayload({
    current,
    baseline,
    urlInfo,
    baselineInfo,
    overrideThresholds,
    tolerateNoBaseline: false,
    hasOverride,
    lhReport: null, // rapport complet non disponible ici (budgets gérés via lighthouserc)
    history: history.length >= 2 ? history : null,
  });

  const { verdict, metrics, qualityScore, qualityVerdict, reasonCodes, diagnostics, trendInfo } = payload;

  // ── Affichage console ─────────────────────────────────────────────────────

  const sep = '─'.repeat(70);
  console.log('\n📊 Lighthouse Quality Guard — comparaison baseline\n');
  console.log('  ' + sep);
  console.log('  Métrique          FAIL  WARN  Baseline  Actuel  Delta   Verdict');
  console.log('  ' + sep);

  for (const r of metrics) {
    const sign    = r.delta !== null ? (r.delta >= 0 ? '+' : '') : '';
    const deltaStr = r.delta !== null ? `${sign}${r.delta}` : 'N/A';
    const baseStr  = r.baseline !== null ? String(r.baseline) : 'N/A';
    const icon = r.verdict === VERDICT.FAIL ? '❌' : r.verdict === VERDICT.WARN ? '⚠️ ' : r.verdict === VERDICT.NO_BASELINE ? 'ℹ️ ' : '✅';
    console.log(
      `  ${icon} ${r.label.padEnd(16)}  -${String(r.failDrop).padEnd(4)} -${String(r.warnDrop).padEnd(4)} ${baseStr.padStart(8)}  ${String(r.current).padStart(6)}  ${deltaStr.padStart(5)}   ${r.verdict}`,
    );
  }

  console.log('  ' + sep);
  console.log(`\n  Quality Score  : ${qualityScore}/100 (${qualityVerdict})`);
  if (urlInfo.crossContext) console.log('  ⚠️  Comparaison cross-context (résultat dégradé)');
  if (urlInfo.wasFallback)  console.log('  ⚠️  Fallback localhost utilisé');
  if (hasOverride)          console.log('  ⚠️  Override label actif — FAIL converti en WARN');
  if (trendInfo?.hasNegativeTrend) console.log('  ⚠️  Tendance négative détectée');

  const verdictIcon = verdict === VERDICT.FAIL ? '❌' : verdict === VERDICT.WARN ? '⚠️ ' : verdict === VERDICT.NO_BASELINE ? 'ℹ️ ' : '✅';
  console.log(`\n${verdictIcon} Verdict global : ${verdict}\n`);

  if (diagnostics.length > 0) {
    console.log('  Causes :');
    for (const d of diagnostics) console.log(`   — ${d}`);
    console.log('');
  }

  // ── Écriture /tmp/lh-verdict.json (Phase 1) ───────────────────────────────

  // Le payload complet est écrit pour lighthouse-pr-comment.mjs et lighthouse-summary.mjs.
  // Inclut également les champs legacy pour la rétrocompatibilité.
  const verdictOut = {
    ...payload,
    // Champs legacy (rétrocompatibilité avec commentaire PR existant)
    thresholds: {
      performance:   THRESHOLD_PERFORMANCE,
      accessibility: THRESHOLD_ACCESSIBILITY,
      seo:           THRESHOLD_SEO,
      bestPractices: THRESHOLD_BEST_PRACTICES,
    },
    baseline,
    current,
    results: metrics.map(r => ({
      key:       r.key,
      label:     r.label,
      prev:      r.baseline,
      curr:      r.current,
      delta:     r.delta,
      threshold: r.failDrop,
      verdict:   r.verdict,
    })),
  };
  fs.writeFileSync(VERDICT_OUT, JSON.stringify(verdictOut, null, 2));

  // ── GitHub Actions step summary ───────────────────────────────────────────

  _writeSummary(payload, baseline);

  // ── Exit code ─────────────────────────────────────────────────────────────

  if (verdict === VERDICT.FAIL) {
    console.warn('\n⚠️  Régression Lighthouse détectée — avertissement (voir /tmp/lh-verdict.json).');
    console.warn('   → CI non bloquée : le suivi des régressions reste actif, aucun merge bloqué.');
  }

  console.log(`\n${verdictIcon} Seuils: perf -${THRESHOLD_PERFORMANCE}, a11y -${THRESHOLD_ACCESSIBILITY}, seo -${THRESHOLD_SEO}, bp -${THRESHOLD_BEST_PRACTICES}.`);

  // Mode --compare toujours non bloquant : exit 0 quel que soit le verdict.
  // Seule une vraie erreur technique (catch global) peut sortir en erreur.
  process.exit(0);
}

// ─── Helpers internes ──────────────────────────────────────────────────────────

/**
 * Écrit un verdict NO_BASELINE dans /tmp/lh-verdict.json.
 * Cet état est toujours visible (jamais silencieux).
 */
function _writeNoBaselineVerdict(reason, tolerateNoBaseline) {
  const current = fs.existsSync(scoresFile)
    ? (() => { try { return JSON.parse(fs.readFileSync(scoresFile, 'utf8')); } catch { return {}; } })()
    : {};
  const qualityScore = computeQualityScore(current);

  const verdictOut = {
    verdict:           VERDICT.NO_BASELINE,
    reasonCodes:       [{ code: 'NO_BASELINE_AVAILABLE', detail: reason }],
    qualityScore,
    qualityVerdict:    null,
    metrics:           [],
    budgets:           [],
    baselineInfo:      {},
    urlInfo,
    trendInfo:         null,
    diagnostics:       ['Aucune baseline disponible — comparaison impossible pour ce run'],
    hasOverride,
    timestamp:         new Date().toISOString(),
    // Legacy
    thresholds:        { performance: THRESHOLD_PERFORMANCE, accessibility: THRESHOLD_ACCESSIBILITY, seo: THRESHOLD_SEO, bestPractices: THRESHOLD_BEST_PRACTICES },
    baseline:          null,
    current,
    results:           [],
  };
  try {
    fs.writeFileSync(VERDICT_OUT, JSON.stringify(verdictOut, null, 2));
    console.log(`ℹ️  Verdict NO_BASELINE écrit dans ${VERDICT_OUT} (raison: ${reason}).`);
  } catch { /* non bloquant */ }
}

/**
 * Écrit le résumé Markdown dans $GITHUB_STEP_SUMMARY.
 */
function _writeSummary(payload, baseline) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const { verdict, qualityScore, metrics, reasonCodes, diagnostics, trendInfo, urlInfo: ui } = payload;
  const verdictIcon = verdict === VERDICT.FAIL ? '❌' : verdict === VERDICT.WARN ? '⚠️' : verdict === VERDICT.NO_BASELINE ? 'ℹ️' : '✅';
  const verdictBadge = verdict === VERDICT.FAIL ? '**❌ FAIL**' : verdict === VERDICT.WARN ? '**⚠️ WARN**' : verdict === VERDICT.NO_BASELINE ? '**ℹ️ NO_BASELINE**' : '**✅ PASS**';

  const lines = [
    `## ${verdictIcon} Lighthouse Quality Guard — ${verdict}`,
    '',
    `| | |`,
    `|---|---|`,
    `| **Verdict** | ${verdictBadge} |`,
    `| **Quality Score** | **${qualityScore}/100** |`,
    `| **URL auditée** | \`${ui.auditedUrl || 'N/A'}\` |`,
    `| **Source URL** | \`${ui.urlSource || 'N/A'}\` |`,
    baseline ? `| **Baseline** | \`${baseline.url || 'N/A'}\` (${baseline.timestamp?.slice(0, 10) || 'N/A'}) |` : '| **Baseline** | _Non disponible_ |',
    hasOverride ? `| **Override** | ⚠️ Label \`ci:override-lighthouse\` actif |` : '',
    '',
    '### Métriques',
    '',
    '| Métrique | PR | Baseline | Delta | Seuil FAIL | Seuil WARN | Verdict |',
    '|---|---|---|---|---|---|---|',
  ];

  for (const r of metrics) {
    const sign      = r.delta !== null ? (r.delta >= 0 ? '+' : '') : '';
    const deltaStr  = r.delta !== null ? `${sign}${r.delta}` : '—';
    const baseStr   = r.baseline !== null ? String(r.baseline) : '—';
    const vIcon     = r.verdict === VERDICT.FAIL ? '❌ FAIL' : r.verdict === VERDICT.WARN ? '⚠️ WARN' : r.verdict === VERDICT.NO_BASELINE ? 'ℹ️' : '✅ PASS';
    lines.push(`| **${r.label}** | ${r.current} | ${baseStr} | ${deltaStr} | -${r.failDrop} | -${r.warnDrop} | ${vIcon} |`);
  }

  if (trendInfo?.trends) {
    lines.push('', '### Tendance');
    for (const [key, t] of Object.entries(trendInfo.trends)) {
      const cfg = METRIC_CONFIG[key];
      const tIcon = t.trend === 'up' ? '📈' : t.trend === 'down' ? '📉' : '➡️';
      lines.push(`- **${cfg?.label ?? key}** : ${tIcon} ${t.trend} (pente: ${t.slope})`);
    }
  }

  if (diagnostics.length > 0) {
    lines.push('', '### Causes détectées', '');
    for (const d of diagnostics) lines.push(`- ${d}`);
  }

  lines.push('', `> 📦 Rapports complets : artefact \`lighthouse-reports\` du job CI.`);
  if (hasOverride) lines.push('', `> ⚠️ **Override actif** : label \`ci:override-lighthouse\` présent — un FAIL a été converti en WARN. Cet état est journalisé.`);

  try {
    fs.appendFileSync(summaryFile, lines.filter(l => l !== null && l !== undefined).join('\n') + '\n');
  } catch { /* non bloquant */ }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (mode === '--write') {
  writeScores();
} else if (mode === '--compare') {
  compareScores().catch(err => {
    console.error('❌ Erreur technique inattendue dans le quality guard :', err.message);
    // Erreur technique inattendue = état connu, journalisé, non silencieux, BLOQUANT.
    _writeNoBaselineVerdict('UNEXPECTED_ERROR', false);
    process.exit(1);
  });
} else {
  console.error('Usage : node lighthouse-guard.mjs --write | --compare');
  process.exit(1);
}
