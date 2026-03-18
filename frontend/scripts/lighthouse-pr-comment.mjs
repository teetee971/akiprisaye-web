#!/usr/bin/env node
/**
 * lighthouse-pr-comment.mjs
 *
 * Commentaire PR Lighthouse — niveau outil de décision.
 *
 * Poste ou met à jour un commentaire idempotent sur la PR avec :
 *   — Bannière verdict (PASS / WARN / FAIL / NO_BASELINE)
 *   — Contexte (URL, source, baseline, SHA)
 *   — Tableau métriques avec delta et seuils explicites
 *   — Quality Score global pondéré
 *   — Budgets (si disponibles)
 *   — Tendance (si historique disponible)
 *   — Diagnostics actionnables
 *   — Mention override si label actif
 *
 * Le commentaire est idempotent : si un commentaire existant contient le
 * COMMENT_MARKER, il est mis à jour plutôt que dupliqué.
 *
 * Ce script ne fait JAMAIS échouer la CI : toute erreur est loguée et ignorée.
 *
 * Variables d'environnement :
 *   GITHUB_TOKEN          — token avec permissions pull-requests:write (requis)
 *   GITHUB_REPOSITORY     — "owner/repo" (automatique en GitHub Actions)
 *   GITHUB_EVENT_PATH     — chemin vers l'event JSON GitHub
 *   PR_NUMBER             — numéro de PR (alternative à GITHUB_EVENT_PATH)
 *   BASELINE_SCORES_PATH  — chemin vers le fichier JSON de scores baseline
 *   VERDICT_PATH          — chemin vers /tmp/lh-verdict.json (produit par --compare)
 *   LHCI_DIR              — répertoire des rapports LHCI (défaut : .lighthouseci)
 *
 * Usage : node scripts/lighthouse-pr-comment.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { METRIC_CONFIG, VERDICT, QUALITY_SCORE_THRESHOLDS } from './lighthouse-engine.mjs';

const __dirname      = path.dirname(fileURLToPath(import.meta.url));
const COMMENT_MARKER = '<!-- lighthouse-ci-bot -->';
const dir            = path.resolve(process.cwd(), process.env.LHCI_DIR || '.lighthouseci');

// Seuils de régression pour l'affichage dans le commentaire.
// Dérivés de METRIC_CONFIG.failDrop (source unique de vérité dans lighthouse-engine.mjs).
// Ne jamais dupliquer ces valeurs : toute modification des seuils doit se faire
// exclusivement dans METRIC_CONFIG — ce tableau sera automatiquement mis à jour.
const THRESHOLDS = Object.fromEntries(
  Object.keys(METRIC_CONFIG).map(k => [k, METRIC_CONFIG[k].failDrop]),
);

// ─── Lecture des données ───────────────────────────────────────────────────────

// Scores actuels (depuis les rapports .report.json)
const reports = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(f => f.endsWith('.report.json') && f !== 'lighthouse-scores.json')
  : [];

if (!reports.length) {
  console.log('ℹ️  Aucun rapport Lighthouse — skip commentaire PR.');
  process.exit(0);
}

const lhData = JSON.parse(fs.readFileSync(path.join(dir, reports[0]), 'utf8'));
const current = {
  url:           lhData.finalUrl || lhData.requestedUrl || 'unknown',
  performance:   Math.round((lhData.categories.performance?.score         ?? 0) * 100),
  accessibility: Math.round((lhData.categories.accessibility?.score       ?? 0) * 100),
  seo:           Math.round((lhData.categories.seo?.score                 ?? 0) * 100),
  bestPractices: Math.round((lhData.categories['best-practices']?.score   ?? 0) * 100),
};

// Verdict complet depuis lighthouse-guard --compare (source de vérité)
let verdictData = null;
const verdictPath = process.env.VERDICT_PATH || '/tmp/lh-verdict.json';
if (fs.existsSync(verdictPath)) {
  try { verdictData = JSON.parse(fs.readFileSync(verdictPath, 'utf8')); } catch { /* ignoré */ }
}

// Baseline (fallback si verdict absent)
let baseline = verdictData?.baseline ?? null;
const baselinePath = process.env.BASELINE_SCORES_PATH || '/tmp/lh-baseline.json';
if (!baseline && fs.existsSync(baselinePath)) {
  try { baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); } catch { /* ignoré */ }
}

// ─── Verdict et métriques ──────────────────────────────────────────────────────

// Récupère le verdict depuis le payload moteur, ou recalcule depuis les scores bruts
const overallVerdict = verdictData?.verdict ?? (baseline ? null : VERDICT.NO_BASELINE);
const qualityScore   = verdictData?.qualityScore ?? null;
const hasOverride    = verdictData?.hasOverride ?? false;
const urlInfo        = verdictData?.urlInfo ?? { auditedUrl: current.url, urlSource: 'localhost', wasFallback: false };
const trendInfo      = verdictData?.trendInfo ?? null;
const diagnostics    = verdictData?.diagnostics ?? [];
const baselineInfo   = verdictData?.baselineInfo ?? {};

// Tableau des métriques (avec fallback si moteur absent)
const metricRows = (verdictData?.metrics?.length > 0)
  ? verdictData.metrics
  : Object.keys(METRIC_CONFIG).map(key => {
      const score = current[key];
      const base  = baseline?.[key] ?? null;
      const delta = base !== null ? score - base : null;
      const cfg   = METRIC_CONFIG[key];
      let verdict = VERDICT.NO_BASELINE;
      if (delta !== null) {
        if (delta <= -THRESHOLDS[key])  verdict = VERDICT.FAIL;
        else if (delta < 0)             verdict = VERDICT.WARN;
        else                            verdict = VERDICT.PASS;
      }
      return { key, label: cfg.label, current: score, baseline: base, delta, failDrop: THRESHOLDS[key], warnDrop: 1, absoluteMin: cfg.absoluteMin, verdict };
    });

// ─── Construction du commentaire ──────────────────────────────────────────────

// 1. Bannière verdict
const verdictBanner = (() => {
  switch (overallVerdict) {
    case VERDICT.FAIL:        return '### ❌ FAIL — Régression bloquante détectée';
    case VERDICT.WARN:        return '### ⚠️ WARN — Légère dégradation (non bloquante)';
    case VERDICT.PASS:        return '### ✅ PASS — Aucune régression';
    case VERDICT.NO_BASELINE: return '### ℹ️ NO_BASELINE — Pas de baseline disponible';
    default:                  return '### ❓ Statut inconnu';
  }
})();

// 2. Tableau métriques
const tableRows = metricRows.map(r => {
  const sign    = r.delta !== null ? (r.delta >= 0 ? '+' : '') : '';
  const deltaStr = r.delta !== null ? `\`${sign}${r.delta}\`` : '—';
  const baseStr  = r.baseline !== null ? String(r.baseline) : '—';
  const absStr   = r.absoluteMin !== null ? `≥ ${r.absoluteMin}` : '—';
  const regStr   = `-${r.failDrop} (FAIL), -${r.warnDrop} (WARN)`;
  const vIcon    = r.verdict === VERDICT.FAIL ? '❌ FAIL' : r.verdict === VERDICT.WARN ? '⚠️ WARN' : r.verdict === VERDICT.NO_BASELINE ? 'ℹ️' : '✅ PASS';
  return `| **${r.label}** | ${r.current} | ${baseStr} | ${deltaStr} | ${absStr} | ${regStr} | ${vIcon} |`;
});

// 3. Quality Score
const qsLine = qualityScore !== null
  ? `**Quality Score global : ${qualityScore}/100**  (≥ ${QUALITY_SCORE_THRESHOLDS.pass} PASS, ≥ ${QUALITY_SCORE_THRESHOLDS.warn} WARN, < ${QUALITY_SCORE_THRESHOLDS.warn} FAIL)`
  : '';

// 4. Budgets
const budgetRows = (verdictData?.budgets ?? []).map(b => {
  const icon = b.exceeded
    ? (b.level === 'error' ? '❌' : '⚠️')
    : '✅';
  const status = b.exceeded
    ? `${icon} ${b.actual} ${b.unit} / ${b.budget} ${b.unit} (+${b.actual - b.budget})`
    : `${icon} ${b.actual} ${b.unit} / ${b.budget} ${b.unit}`;
  return `| **${b.label}** | ${status} |`;
});

// 5. Tendance
const trendLines = trendInfo?.trends
  ? Object.entries(trendInfo.trends).map(([key, t]) => {
      const cfg   = METRIC_CONFIG[key];
      const tIcon = t.trend === 'up' ? '📈' : t.trend === 'down' ? '📉' : '➡️';
      return `- **${cfg?.label ?? key}** : ${tIcon} ${t.trend} (pente: ${t.slope})`;
    })
  : [];

// 6. Diagnostics
const diagLines = diagnostics.map(d => `- ${d}`);

// 7. Contexte
const contextLines = [
  `| | |`,
  `|---|---|`,
  `| **URL auditée** | \`${urlInfo.auditedUrl || current.url || 'N/A'}\` |`,
  `| **Source URL** | \`${urlInfo.urlSource || 'N/A'}\` |`,
  baseline
    ? `| **Baseline** | \`${baseline.url || 'N/A'}\` (${baseline.timestamp?.slice(0, 10) || 'N/A'}) |`
    : `| **Baseline** | _Non disponible_ |`,
  baselineInfo.sha && baselineInfo.sha !== 'unknown'
    ? `| **Baseline SHA** | \`${baselineInfo.sha.slice(0, 8)}\` |`
    : null,
  urlInfo.crossContext
    ? `| **⚠️ Comparaison** | Cross-context : audit localhost vs baseline CDN (résultat dégradé) |`
    : null,
  urlInfo.wasFallback
    ? `| **⚠️ Fallback** | Localhost utilisé à la place de l'URL CDN |`
    : null,
].filter(Boolean);

// 8. Corps complet
const sections = [
  COMMENT_MARKER,
  '## 🔦 Lighthouse CI — Rapport qualité PR',
  '',
  verdictBanner,
  '',
  ...contextLines,
  '',
  '### Métriques — régression vs main',
  '',
  '| Métrique | Score PR | Baseline | Delta | Seuil absolu | Seuil régression | Statut |',
  '|---|---|---|---|---|---|---|',
  ...tableRows,
];

if (qsLine) {
  sections.push('', qsLine);
}

if (budgetRows.length > 0) {
  sections.push(
    '',
    '### Budgets de performance',
    '',
    '| Ressource | Statut |',
    '|---|---|',
    ...budgetRows,
  );
}

if (trendLines.length > 0) {
  sections.push(
    '',
    '### Tendance (N derniers runs)',
    '',
    ...trendLines,
  );
}

if (diagLines.length > 0) {
  sections.push(
    '',
    '### Causes détectées',
    '',
    ...diagLines,
  );
}

if (hasOverride) {
  sections.push(
    '',
    '> ⚠️ **Override actif** : le label `ci:override-lighthouse` est présent sur cette PR.',
    '> Un FAIL a été converti en WARN. Cet état est journalisé dans les artifacts CI.',
    '> Retirer le label pour rétablir le comportement normal.',
  );
}

sections.push(
  '',
  `> Seuils de régression : Performance -${THRESHOLDS.performance}, Accessibilité -${THRESHOLDS.accessibility}, SEO -${THRESHOLDS.seo}, Best Practices -${THRESHOLDS.bestPractices}.`,
  '> 📦 Rapports complets dans les [Artifacts du job CI](../../actions).',
);

const body = sections.filter(l => l !== null && l !== undefined).join('\n');

// ─── Numéro de PR ──────────────────────────────────────────────────────────────

let prNumber = process.env.PR_NUMBER;

if (!prNumber) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    try {
      const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
      prNumber = event?.pull_request?.number ?? event?.number ?? null;
    } catch { /* ignoré */ }
  }
}

if (!prNumber) {
  console.log('ℹ️  Pas de numéro de PR — skip commentaire PR (push sur main ?).');
  process.exit(0);
}

// ─── Envoi du commentaire ──────────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN;
const repo  = process.env.GITHUB_REPOSITORY;

if (!token || !repo) {
  console.log('⚠️  GITHUB_TOKEN ou GITHUB_REPOSITORY non défini — skip commentaire PR (journalisé).');
  process.exit(0);
}

const apiBase = `https://api.github.com/repos/${repo}`;
const headers = {
  Authorization:          `Bearer ${token}`,
  Accept:                 'application/vnd.github+json',
  'Content-Type':         'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function postOrUpdateComment() {
  // Liste des commentaires (paginé jusqu'à 100)
  const commentsRes = await fetch(`${apiBase}/issues/${prNumber}/comments?per_page=100`, { headers });
  if (!commentsRes.ok) throw new Error(`List comments ${commentsRes.status}: ${await commentsRes.text()}`);
  const comments = await commentsRes.json();

  const existing = comments.find(c => typeof c.body === 'string' && c.body.includes(COMMENT_MARKER));

  if (existing) {
    // Mise à jour idempotente
    const patchRes = await fetch(`${apiBase}/issues/comments/${existing.id}`, {
      method:  'PATCH',
      headers,
      body:    JSON.stringify({ body }),
    });
    if (!patchRes.ok) throw new Error(`Update comment ${patchRes.status}: ${await patchRes.text()}`);
    console.log(`✅ Commentaire Lighthouse mis à jour (PR #${prNumber}, comment #${existing.id}) — verdict: ${overallVerdict}`);
  } else {
    // Création
    const postRes = await fetch(`${apiBase}/issues/${prNumber}/comments`, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ body }),
    });
    if (!postRes.ok) throw new Error(`Post comment ${postRes.status}: ${await postRes.text()}`);
    const created = await postRes.json();
    console.log(`✅ Commentaire Lighthouse créé (PR #${prNumber}, comment #${created.id}) — verdict: ${overallVerdict}`);
  }
}

postOrUpdateComment().catch(err => {
  // Ne jamais faire échouer la CI à cause du commentaire PR — comportement journalisé
  console.warn('⚠️  Impossible de poster le commentaire Lighthouse sur la PR :', err.message);
  console.warn('   Le commentaire n\'a pas pu être posté. Vérifier les permissions pull-requests:write.');
  process.exit(0);
});
