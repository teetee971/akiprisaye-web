#!/usr/bin/env node
/**
 * lighthouse-pr-comment.mjs
 *
 * Poste (ou met à jour) un commentaire sur la PR en cours avec les scores Lighthouse.
 * Si une baseline est disponible via BASELINE_SCORES_PATH, affiche le delta par rapport
 * au dernier run sur main avec un verdict clair PASS / WARN / FAIL.
 *
 * Verdicts :
 *   PASS — aucun score n'a baissé
 *   WARN — au moins un score a baissé, sans dépasser le seuil de régression
 *   FAIL — au moins un score a baissé au-delà du seuil de régression
 *
 * Le commentaire est idempotent : si un commentaire existant contient le COMMENT_MARKER,
 * il est mis à jour plutôt que dupliqué.
 *
 * Variables d'environnement :
 *   GITHUB_TOKEN          — token avec permissions pull-requests:write (requis)
 *   GITHUB_REPOSITORY     — "owner/repo" (automatique en GitHub Actions)
 *   GITHUB_EVENT_PATH     — chemin vers l'event JSON GitHub (pour extraire le numéro de PR)
 *   PR_NUMBER             — numéro de PR (alternative à GITHUB_EVENT_PATH)
 *   BASELINE_SCORES_PATH  — chemin vers un fichier JSON de scores baseline (optionnel)
 *   VERDICT_PATH          — chemin vers /tmp/lh-verdict.json produit par --compare (optionnel)
 *   LHCI_DIR              — répertoire des rapports LHCI (défaut : .lighthouseci)
 *
 * Usage : node scripts/lighthouse-pr-comment.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname      = path.dirname(fileURLToPath(import.meta.url));
const COMMENT_MARKER = '<!-- lighthouse-ci-bot -->';
const dir            = path.resolve(process.cwd(), process.env.LHCI_DIR || '.lighthouseci');

// Per-metric regression thresholds (must match lighthouse-guard.mjs defaults)
const THRESHOLDS = {
  performance:   5,
  accessibility: 2,
  seo:           3,
  bestPractices: 3,
};

// ─── Read current scores ──────────────────────────────────────────────────────

const reports = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(f => f.endsWith('.report.json') && f !== 'lighthouse-scores.json')
  : [];

if (!reports.length) {
  console.log('ℹ️  Aucun rapport Lighthouse — skip commentaire PR.');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(path.join(dir, reports[0]), 'utf8'));
const current = {
  url:           data.finalUrl || data.requestedUrl || 'unknown',
  performance:   Math.round((data.categories.performance?.score         ?? 0) * 100),
  accessibility: Math.round((data.categories.accessibility?.score       ?? 0) * 100),
  seo:           Math.round((data.categories.seo?.score                 ?? 0) * 100),
  bestPractices: Math.round((data.categories['best-practices']?.score   ?? 0) * 100),
};

// ─── Read optional baseline and verdict ──────────────────────────────────────

let baseline = null;
const baselinePath = process.env.BASELINE_SCORES_PATH || '/tmp/lh-baseline.json';
if (fs.existsSync(baselinePath)) {
  try { baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); } catch { /* ignore */ }
}

// Try to read the full verdict from lighthouse-guard --compare
let verdictData = null;
const verdictPath = process.env.VERDICT_PATH || '/tmp/lh-verdict.json';
if (fs.existsSync(verdictPath)) {
  try { verdictData = JSON.parse(fs.readFileSync(verdictPath, 'utf8')); } catch { /* ignore */ }
}

// ─── Compute per-row deltas and overall verdict ───────────────────────────────

const rows = [
  { label: 'Performance',   key: 'performance',   absThreshold: 80,  regThreshold: THRESHOLDS.performance   },
  { label: 'Accessibilité', key: 'accessibility', absThreshold: 90,  regThreshold: THRESHOLDS.accessibility },
  { label: 'SEO',           key: 'seo',           absThreshold: 80,  regThreshold: THRESHOLDS.seo           },
  { label: 'Best Practices',key: 'bestPractices', absThreshold: null, regThreshold: THRESHOLDS.bestPractices },
];

let hasFail = false;
let hasWarn = false;

const tableRows = rows.map(({ label, key, absThreshold, regThreshold }) => {
  const score = current[key];
  const base  = baseline?.[key] ?? null;
  const delta = base != null ? score - base : null;

  // Absolute threshold status
  const absOk = absThreshold == null ? true : score >= absThreshold;

  // Regression verdict
  let regVerdict = null;
  let deltaStr   = '';
  if (delta !== null) {
    if (delta < -regThreshold) { regVerdict = '❌ FAIL'; hasFail = true; }
    else if (delta < 0)        { regVerdict = '⚠️ WARN'; hasWarn = true; }
    else                       { regVerdict = '✅ PASS'; }
    const sign = delta >= 0 ? '+' : '';
    deltaStr   = ` \`${sign}${delta}\``;
  }

  const absSeuil = absThreshold != null ? `≥ ${absThreshold}` : '—';
  const absIcon  = absThreshold != null ? (absOk ? '✅' : '❌') : '—';
  const regCell  = regVerdict ?? '—';

  return `| **${label}** | ${score} / 100${deltaStr} | ${absSeuil} | ${absIcon} | ${regCell} |`;
});

// Overall verdict
const overallVerdict = verdictData?.verdict
  ?? (hasFail ? 'FAIL' : hasWarn ? 'WARN' : baseline ? 'PASS' : null);

const verdictBanner = overallVerdict === 'FAIL'
  ? '### ❌ FAIL — Régression bloquante détectée'
  : overallVerdict === 'WARN'
  ? '### ⚠️ WARN — Légère dégradation (non bloquante)'
  : overallVerdict === 'PASS'
  ? '### ✅ PASS — Aucune régression'
  : '';

// ─── Build comment body ───────────────────────────────────────────────────────

const baselineNote = baseline
  ? `> 📈 Deltas calculés par rapport à la baseline main du ${baseline.timestamp?.slice(0, 10) || 'N/A'} (\`${baseline.url}\`).`
  : '> ℹ️ Aucune baseline disponible — premier run ou baseline non trouvée sur main.';

const thresholdNote = `> Seuils de régression : Performance -${THRESHOLDS.performance}, Accessibilité -${THRESHOLDS.accessibility}, SEO -${THRESHOLDS.seo}, Best Practices -${THRESHOLDS.bestPractices}.`;

const body = [
  COMMENT_MARKER,
  '## 🔦 Lighthouse CI — Résumé PR',
  '',
  verdictBanner,
  '',
  `**URL auditée :** \`${current.url}\``,
  '',
  '| Métrique | Score PR | Seuil absolu | Statut | Régression vs main |',
  '|---|---|---|---|---|',
  ...tableRows,
  '',
  baselineNote,
  baseline ? thresholdNote : '',
  '> 📦 Rapports complets dans les [Artifacts du job CI](../../actions).',
].filter(l => l !== null && l !== undefined).join('\n');

// ─── Find PR number ───────────────────────────────────────────────────────────

let prNumber = process.env.PR_NUMBER;

if (!prNumber) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    try {
      const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
      prNumber = event?.pull_request?.number ?? event?.number ?? null;
    } catch { /* ignore */ }
  }
}

if (!prNumber) {
  console.log('ℹ️  Pas de numéro de PR — skip commentaire PR (push sur main ?).');
  process.exit(0);
}

// ─── Post / update PR comment ─────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN;
const repo  = process.env.GITHUB_REPOSITORY;

if (!token || !repo) {
  console.log('⚠️  GITHUB_TOKEN ou GITHUB_REPOSITORY non défini — skip commentaire PR.');
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
  // List existing comments on the PR (paginate up to 100)
  const commentsRes = await fetch(`${apiBase}/issues/${prNumber}/comments?per_page=100`, { headers });
  if (!commentsRes.ok) throw new Error(`List comments ${commentsRes.status}: ${await commentsRes.text()}`);
  const comments = await commentsRes.json();

  const existing = comments.find(c => typeof c.body === 'string' && c.body.includes(COMMENT_MARKER));

  if (existing) {
    // Update existing comment (idempotent)
    const patchRes = await fetch(`${apiBase}/issues/comments/${existing.id}`, {
      method:  'PATCH',
      headers,
      body:    JSON.stringify({ body }),
    });
    if (!patchRes.ok) throw new Error(`Update comment ${patchRes.status}: ${await patchRes.text()}`);
    console.log(`✅ Commentaire Lighthouse mis à jour (PR #${prNumber}, comment #${existing.id}) — verdict: ${overallVerdict}`);
  } else {
    // Create new comment
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
  // Never fail CI because a PR comment couldn't be posted
  console.warn('⚠️  Impossible de poster le commentaire Lighthouse sur la PR :', err.message);
  process.exit(0);
});
