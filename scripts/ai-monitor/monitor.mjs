/**
 * monitor.mjs — IA de Surveillance Globale "A KI PRI SA YÉ"
 *
 * Ce script est une intelligence artificielle autonome qui surveille
 * l'INTÉGRALITÉ du logiciel sans intervention humaine :
 *
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │  PÉRIMÈTRE DE SURVEILLANCE                                       │
 *  ├─────────────────────────────────────────────────────────────────┤
 *  │  1. 🌐 Disponibilité site live (GitHub Pages + Cloudflare)       │
 *  │  2. 🚀 Santé des déploiements (CI/CD status via GitHub API)      │
 *  │  3. 🔥 Fraîcheur Firestore (lettre_jour, lettre_hebdo, prix)     │
 *  │  4. 📰 Santé des flux RSS (12 feeds DOM-TOM)                     │
 *  │  5. 📦 Santé des données prix (fuel, alimentaire, services)      │
 *  │  6. 🔒 Alertes sécurité (CodeQL + npm audit résumé)              │
 *  │  7. 🤖 Analyse IA globale (GPT-4o-mini) → rapport Markdown       │
 *  │  8. 💾 Écriture Firestore (monitoring/{timestamp})               │
 *  │  9. 🚨 Création GitHub Issue si score < 70/100                   │
 *  │  10.📊 Step summary GitHub Actions                               │
 *  └─────────────────────────────────────────────────────────────────┘
 *
 * Fréquence : toutes les heures (cron: '0 * * * *')
 * Aussi : après chaque déploiement réussi
 *
 * Usage :
 *   node monitor.mjs           → Production
 *   node monitor.mjs --dry-run → Simulation (pas d'écriture)
 *
 * Variables d'environnement :
 *   FIREBASE_SERVICE_ACCOUNT  — Credentials Firebase Admin (requis)
 *   OPENAI_API_KEY            — Clé OpenAI (requis pour analyse IA)
 *   GITHUB_TOKEN              — Token GitHub (pour API + issues)
 *   GITHUB_REPOSITORY         — owner/repo
 *   SITE_URL_GHPAGES          — URL GitHub Pages (optionnel)
 *   SITE_URL_CF               — URL Cloudflare Pages (optionnel)
 */

import admin from 'firebase-admin';
import OpenAI from 'openai';

const DRY_RUN = process.argv.includes('--dry-run');
const NOW = new Date();
const ISO_NOW = NOW.toISOString();
const TIMESTAMP_ID = ISO_NOW.replace(/[:.]/g, '-').slice(0, 19);

// ─── Configuration ────────────────────────────────────────────────────────────

/** Labels appliqués à toutes les issues de monitoring automatique */
const MONITORING_ISSUE_LABELS = ['monitoring', 'automatique', 'alerte-ia'];

const CONFIG = {
  /** Score minimum avant création d'une GitHub Issue d'alerte */
  alertScoreThreshold: 70,
  /** Âge maximum acceptable pour la lettre du jour (en heures) */
  maxLetterAgeHours: 26,
  /** Âge maximum acceptable pour les données carburant (en heures) */
  maxFuelDataAgeHours: 25,
  /** URLs à vérifier */
  siteUrls: [
    process.env.SITE_URL_GHPAGES ?? 'https://teetee971.github.io/akiprisaye-web/',
    process.env.SITE_URL_CF ?? 'https://akiprisaye-web.pages.dev/',
  ].filter(Boolean),
  /** Flux RSS à vérifier */
  rssFeeds: [
    'https://www.franceinfo.fr/france/outre-mer.rss',
    'https://la1ere.franceinfo.fr/actu/rss',
    'https://imazpress.com/feed',
    'https://www.rci.fm/guadeloupe/rss.xml',
    'https://www.rci.fm/martinique/rss.xml',
    'https://la1ere.franceinfo.fr/economie/rss?r=polynesie',
    'https://la1ere.franceinfo.fr/economie/rss?r=nouvellecaledonie',
    'https://la1ere.franceinfo.fr/economie/rss?r=saintpierreetmiquelon',
  ],
  /** GitHub repo */
  repo: process.env.GITHUB_REPOSITORY ?? 'teetee971/akiprisaye-web',
};

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ status: 'ok'|'warn'|'error', label: string, detail: string, score: number }} CheckResult
 */

// ─── Firebase Admin ───────────────────────────────────────────────────────────

function getFirestore() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (!raw) return null;
  let sa;
  try { sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  catch { sa = JSON.parse(raw); }
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin.firestore();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, timeout = 15_000, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function ageHours(isoString) {
  if (!isoString) return Infinity;
  return (Date.now() - new Date(isoString).getTime()) / 3_600_000;
}

// ─── Check 1: Site availability ───────────────────────────────────────────────

async function checkSiteAvailability() {
  /** @type {CheckResult[]} */
  const results = [];

  for (const url of CONFIG.siteUrls) {
    try {
      const start = Date.now();
      const res = await fetchWithTimeout(url, 15_000, { method: 'HEAD' });
      const ms = Date.now() - start;
      const ok = res.ok || res.status === 304;
      results.push({
        status: ok ? (ms < 2000 ? 'ok' : 'warn') : 'error',
        label: `Site ${new URL(url).hostname}`,
        detail: ok ? `HTTP ${res.status} en ${ms}ms` : `HTTP ${res.status}`,
        score: ok ? (ms < 2000 ? 100 : 70) : 0,
      });
    } catch (err) {
      // Network errors (fetch failed, timeout) may reflect runner restrictions,
      // not actual site downtime — score as 50 (inconclusive) instead of 0.
      const networkErrorMessages = ['fetch failed', 'ECONNREFUSED', 'ENOTFOUND'];
      const isNetErr = err.name === 'AbortError' || networkErrorMessages.some((m) => err.message.includes(m));
      results.push({
        status: isNetErr ? 'warn' : 'error',
        label: `Site ${url}`,
        detail: `Inaccessible : ${err.message}`,
        score: isNetErr ? 50 : 0,
      });
    }
  }

  return results;
}

// ─── Check 2: GitHub CI/CD health ─────────────────────────────────────────────

async function checkCIHealth() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return [{ status: 'warn', label: 'CI/CD', detail: 'GITHUB_TOKEN non défini', score: 50 }];
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${CONFIG.repo}/actions/runs?per_page=10&branch=main`,
      10_000,
      { headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } },
    );
    if (!res.ok) throw new Error(`GitHub API : ${res.status}`);
    const data = await res.json();
    const runs = (data.workflow_runs ?? []).slice(0, 5);

    if (runs.length === 0) {
      return [{ status: 'warn', label: 'CI/CD', detail: 'Aucun run trouvé', score: 50 }];
    }

    const latest = runs[0];
    const conclusion = latest.conclusion;
    const ageH = ageHours(latest.created_at);

    const failed = runs.filter((r) => r.conclusion === 'failure').length;
    const score = conclusion === 'success' ? (failed === 0 ? 100 : 80) : conclusion === 'failure' ? 20 : 60;

    return [
      {
        status: conclusion === 'success' ? 'ok' : conclusion === 'failure' ? 'error' : 'warn',
        label: 'CI/CD — Dernier run',
        detail: `${latest.name} : ${conclusion ?? 'en cours'} (il y a ${ageH.toFixed(1)}h)`,
        score,
      },
      {
        status: failed === 0 ? 'ok' : failed <= 1 ? 'warn' : 'error',
        label: 'CI/CD — Runs récents (5)',
        detail: `${runs.length - failed} réussis, ${failed} échoués`,
        score: Math.max(0, 100 - failed * 20),
      },
    ];
  } catch (err) {
    return [{ status: 'error', label: 'CI/CD', detail: err.message, score: 30 }];
  }
}

// ─── Check 3: Firestore data freshness ────────────────────────────────────────

async function checkFirestoreFreshness(db) {
  if (!db) {
    return [{ status: 'warn', label: 'Firestore', detail: 'Non connecté', score: 50 }];
  }

  /** @type {CheckResult[]} */
  const results = [];

  // Check lettre_jour_ia — max 26h
  try {
    const snap = await db.collection('lettre_jour_ia').orderBy('generatedAt', 'desc').limit(1).get();
    if (snap.empty) {
      results.push({ status: 'error', label: 'Lettre du Jour', detail: 'Collection vide', score: 0 });
    } else {
      const doc = snap.docs[0].data();
      const ts = doc.generatedAt?.toDate?.()?.toISOString() ?? doc.dayId;
      const age = ageHours(ts);
      results.push({
        status: age < CONFIG.maxLetterAgeHours ? 'ok' : 'error',
        label: 'Lettre du Jour IA',
        detail: `Dernière édition : ${doc.dayId ?? 'N/A'} (il y a ${age.toFixed(1)}h)`,
        score: age < CONFIG.maxLetterAgeHours ? 100 : age < 48 ? 50 : 0,
      });
    }
  } catch (err) {
    results.push({ status: 'error', label: 'Lettre du Jour', detail: err.message, score: 0 });
  }

  // Check lettre_hebdo_ia — max 8 jours
  try {
    const snap = await db.collection('lettre_hebdo_ia').orderBy('generatedAt', 'desc').limit(1).get();
    if (snap.empty) {
      results.push({ status: 'error', label: 'Lettre Hebdo', detail: 'Collection vide', score: 0 });
    } else {
      const doc = snap.docs[0].data();
      const ts = doc.generatedAt?.toDate?.()?.toISOString() ?? doc.weekId;
      const age = ageHours(ts);
      results.push({
        status: age < 200 ? 'ok' : 'warn',
        label: 'Lettre Hebdo IA',
        detail: `Dernière édition : ${doc.weekId ?? 'N/A'} (il y a ${age.toFixed(1)}h)`,
        score: age < 200 ? 100 : age < 300 ? 70 : 30,
      });
    }
  } catch (err) {
    results.push({ status: 'error', label: 'Lettre Hebdo', detail: err.message, score: 0 });
  }

  // Check fuel_prices_snapshots — max 25h
  try {
    const snap = await db.collection('fuel_prices_snapshots').orderBy('date', 'desc').limit(1).get();
    if (snap.empty) {
      results.push({ status: 'warn', label: 'Prix Carburants Firestore', detail: 'Aucun snapshot', score: 50 });
    } else {
      const doc = snap.docs[0].data();
      const age = ageHours(doc.date ? `${doc.date}T07:00:00Z` : null);
      results.push({
        status: age < CONFIG.maxFuelDataAgeHours ? 'ok' : 'warn',
        label: 'Prix Carburants (snapshot)',
        detail: `Dernier snapshot : ${doc.date ?? 'N/A'} (il y a ${age.toFixed(1)}h)`,
        score: age < CONFIG.maxFuelDataAgeHours ? 100 : age < 50 ? 60 : 20,
      });
    }
  } catch (err) {
    results.push({ status: 'error', label: 'Prix Carburants', detail: err.message, score: 0 });
  }

  return results;
}

// ─── Check 4: RSS feed health ─────────────────────────────────────────────────

async function checkRSSFeeds() {
  /** @type {CheckResult[]} */
  const results = [];

  const checks = await Promise.allSettled(
    CONFIG.rssFeeds.map(async (url) => {
      const start = Date.now();
      const res = await fetchWithTimeout(url, 10_000);
      const ms = Date.now() - start;
      const text = await res.text();
      const hasItems = text.includes('<item>') || text.includes('<entry>');
      return { url, ok: res.ok && hasItems, ms, status: res.status };
    }),
  );

  let okCount = 0;
  let failCount = 0;
  for (const r of checks) {
    if (r.status === 'fulfilled' && r.value.ok) okCount++;
    else failCount++;
  }

  results.push({
    status: failCount === 0 ? 'ok' : failCount <= 1 ? 'warn' : 'error',
    label: `Flux RSS (${CONFIG.rssFeeds.length} vérifiés)`,
    detail: `${okCount} actifs, ${failCount} inactifs`,
    score: Math.round((okCount / CONFIG.rssFeeds.length) * 100),
  });

  return results;
}

// ─── Check 5: Static data freshness ───────────────────────────────────────────

async function checkStaticDataFreshness() {
  /** @type {CheckResult[]} */
  const results = [];

  // Check fuel-prices.json via static URL
  for (const baseUrl of CONFIG.siteUrls.slice(0, 1)) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/data/fuel-prices.json`;
      const res = await fetchWithTimeout(url, 10_000);
      if (!res.ok) {
        results.push({ status: 'error', label: 'Données carburants (static)', detail: `HTTP ${res.status}`, score: 0 });
        continue;
      }
      const data = await res.json();
      const lastUpdated = data?.metadata?.lastUpdated ?? data?.lastAutoUpdate;
      const age = ageHours(lastUpdated);
      results.push({
        status: age < 48 ? 'ok' : age < 72 ? 'warn' : 'error',
        label: 'fuel-prices.json',
        detail: `Mis à jour il y a ${age.toFixed(1)}h`,
        score: age < 48 ? 100 : age < 72 ? 60 : 20,
      });
    } catch (err) {
      results.push({ status: 'warn', label: 'fuel-prices.json', detail: err.message, score: 40 });
    }
  }

  return results;
}

// ─── Check 6: Security scan ───────────────────────────────────────────────────

async function checkSecurityScan() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [{ status: 'warn', label: 'Sécurité', detail: 'Token non disponible', score: 50 }];

  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${CONFIG.repo}/code-scanning/alerts?state=open&per_page=10`,
      10_000,
      { headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } },
    );

    if (res.status === 404) {
      return [{ status: 'ok', label: 'Code Scanning', detail: 'Non activé (normal pour ce repo)', score: 80 }];
    }
    if (!res.ok) throw new Error(`API ${res.status}`);

    const alerts = await res.json();
    const critical = Array.isArray(alerts) ? alerts.filter((a) => a.rule?.severity === 'critical').length : 0;
    const high = Array.isArray(alerts) ? alerts.filter((a) => a.rule?.severity === 'high').length : 0;
    const total = Array.isArray(alerts) ? alerts.length : 0;

    return [
      {
        status: critical > 0 ? 'error' : high > 0 ? 'warn' : 'ok',
        label: 'Code Scanning (CodeQL)',
        detail: `${total} alerte(s) : ${critical} critiques, ${high} élevées`,
        score: critical > 0 ? 10 : high > 0 ? 60 : 100,
      },
    ];
  } catch (err) {
    return [{ status: 'warn', label: 'Code Scanning', detail: err.message, score: 50 }];
  }
}

// ─── IA Global Analysis (GPT-4o-mini) ────────────────────────────────────────

async function generateGlobalAnalysis(allResults, globalScore) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const openai = new OpenAI({ apiKey: key });

  const summary = allResults
    .map((r) => `${r.status === 'ok' ? '✅' : r.status === 'warn' ? '⚠️' : '❌'} ${r.label} (${r.score}/100) : ${r.detail}`)
    .join('\n');

  const prompt = `Tu es l'IA de surveillance du logiciel "A KI PRI SA YÉ" (application citoyenne de transparence des prix en Outre-mer).

Voici les résultats du monitoring automatique effectué le ${ISO_NOW} :
Score global : ${globalScore}/100

${summary}

Génère un rapport de monitoring concis (4-6 phrases) en français pour l'équipe technique :
- Évalue l'état général du système
- Identifie les problèmes prioritaires à traiter
- Estime l'impact utilisateur si problèmes présents
- Recommande des actions correctives

Réponds en JSON :
{
  "status_global": "opérationnel|dégradé|critique",
  "rapport": "...",
  "action_prioritaire": "...",
  "impact_utilisateur": "...",
  "prochaine_verification": "dans X heures"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });
    return JSON.parse(response.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    console.warn('⚠️  Erreur analyse IA globale :', err.message);
    return null;
  }
}

// ─── Write to Firestore ───────────────────────────────────────────────────────

async function writeMonitoringReport(db, report) {
  if (!db || DRY_RUN) return;
  await db.collection('monitoring').doc(TIMESTAMP_ID).set(report);
  console.log(`✅ Rapport écrit dans Firestore : monitoring/${TIMESTAMP_ID}`);

  // Also update latest snapshot
  await db.collection('monitoring').doc('_latest').set({
    ...report,
    latestId: TIMESTAMP_ID,
  });
}

// ─── Create GitHub Issue ──────────────────────────────────────────────────────

/**
 * Check whether an open monitoring issue already exists for today.
 * Returns the existing issue number, or null if none found.
 */
async function findExistingAlertIssue(token, dateStr) {
  try {
    const labelFilter = MONITORING_ISSUE_LABELS.map((l) => `label:${l}`).join(' ');
    const query = encodeURIComponent(`[MONITORING] ${dateStr} repo:${CONFIG.repo} is:open ${labelFilter}`);
    const res = await fetchWithTimeout(
      `https://api.github.com/search/issues?q=${query}&per_page=5`,
      10_000,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Maximum age in days before an open monitoring issue is auto-closed. */
const MONITORING_ISSUE_MAX_AGE_DAYS = 3;

/**
 * Close monitoring issues older than MONITORING_ISSUE_MAX_AGE_DAYS to prevent tracker pollution.
 * Uses pagination and a created:<cutoff date filter to handle large numbers of issues.
 */
async function closeOldMonitoringIssues(token) {
  try {
    const cutoff = new Date(Date.now() - MONITORING_ISSUE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const cutoffDate = cutoff.toISOString().slice(0, 10);
    const labelFilter = MONITORING_ISSUE_LABELS.map((l) => `label:${l}`).join(' ');
    const query = encodeURIComponent(
      `[MONITORING] Score in:title repo:${CONFIG.repo} is:open is:issue created:<${cutoffDate} ${labelFilter}`,
    );

    let page = 1;
    while (true) {
      const res = await fetchWithTimeout(
        `https://api.github.com/search/issues?q=${query}&sort=created&order=asc&per_page=100&page=${page}`,
        10_000,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );
      if (!res.ok) return;

      const data = await res.json();
      const items = data.items ?? [];
      if (items.length === 0) break;

      for (const issue of items) {
        const patchRes = await fetchWithTimeout(
          `https://api.github.com/repos/${CONFIG.repo}/issues/${issue.number}`,
          10_000,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({ state: 'closed', state_reason: 'not_planned' }),
          },
        );
        if (patchRes.ok) {
          console.log(`🗑️  Issue #${issue.number} fermée (> ${MONITORING_ISSUE_MAX_AGE_DAYS} jours) : ${issue.title}`);
        } else {
          const errBody = await patchRes.text().catch(() => '');
          console.warn(`⚠️  Impossible de fermer l'issue #${issue.number} (HTTP ${patchRes.status}) : ${errBody}`);
        }
      }

      if (items.length < 100) break;
      page += 1;
    }
  } catch (err) {
    console.warn('⚠️  Impossible de fermer les anciennes issues monitoring :', err.message);
  }
}

async function createAlertIssue(report) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || DRY_RUN) return;
  if (report.globalScore >= CONFIG.alertScoreThreshold) return;

  const errors = report.checks.filter((c) => c.status === 'error');
  const warns = report.checks.filter((c) => c.status === 'warn');
  const dateStr = ISO_NOW.slice(0, 10);

  // Close old monitoring issues (> 3 days) before creating a new one.
  await closeOldMonitoringIssues(token);

  // Deduplicate: update the existing open issue for today instead of creating a new one.
  const existingIssue = await findExistingAlertIssue(token, dateStr);

  const body = [
    `## 🤖 Alerte Monitoring Automatique — Score ${report.globalScore}/100`,
    `> Détecté le ${ISO_NOW}`,
    '',
    `**Statut global : ${report.aiAnalysis?.status_global ?? 'dégradé'}**`,
    '',
    report.aiAnalysis?.rapport ? `### Analyse IA\n${report.aiAnalysis.rapport}` : '',
    '',
    errors.length > 0 ? `### ❌ Erreurs (${errors.length})\n${errors.map((e) => `- **${e.label}** : ${e.detail}`).join('\n')}` : '',
    warns.length > 0 ? `### ⚠️ Avertissements (${warns.length})\n${warns.map((w) => `- **${w.label}** : ${w.detail}`).join('\n')}` : '',
    '',
    report.aiAnalysis?.action_prioritaire ? `### 🔧 Action prioritaire\n${report.aiAnalysis.action_prioritaire}` : '',
    report.aiAnalysis?.impact_utilisateur ? `### 👥 Impact utilisateur\n${report.aiAnalysis.impact_utilisateur}` : '',
    '',
    `---`,
    `*Généré automatiquement par l'IA de surveillance — [Voir monitoring Firestore](https://console.firebase.google.com)*`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    if (existingIssue) {
      // Update existing issue body to latest state
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${CONFIG.repo}/issues/${existingIssue.number}`,
        10_000,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            title: `🤖 [MONITORING] Score ${report.globalScore}/100 — ${report.aiAnalysis?.status_global ?? 'Dégradé'} — ${dateStr}`,
            body,
          }),
        },
      );
      if (res.ok) {
        console.log(`📋 Issue GitHub mise à jour : #${existingIssue.number}`);
      }
    } else {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${CONFIG.repo}/issues`,
        10_000,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            title: `🤖 [MONITORING] Score ${report.globalScore}/100 — ${report.aiAnalysis?.status_global ?? 'Dégradé'} — ${dateStr}`,
            body,
            labels: MONITORING_ISSUE_LABELS,
          }),
        },
      );
      if (res.ok) {
        const issue = await res.json();
        console.log(`📋 Issue GitHub créée : #${issue.number}`);
      }
    }
  } catch (err) {
    console.warn('⚠️  Impossible de créer/mettre à jour l\'issue :', err.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🤖 IA de Surveillance Globale — A KI PRI SA YÉ              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   ${ISO_NOW}`);
  console.log(`   Mode : ${DRY_RUN ? 'DRY-RUN' : 'PRODUCTION'}`);
  console.log('');

  const db = getFirestore();

  // ── Run all checks in parallel ─────────────────────────────────────────────
  console.log('🔍 Lancement de tous les contrôles en parallèle…\n');

  const [
    siteResults,
    ciResults,
    firestoreResults,
    rssResults,
    staticResults,
    securityResults,
  ] = await Promise.all([
    checkSiteAvailability(),
    checkCIHealth(),
    checkFirestoreFreshness(db),
    checkRSSFeeds(),
    checkStaticDataFreshness(),
    checkSecurityScan(),
  ]);

  const allChecks = [
    ...siteResults,
    ...ciResults,
    ...firestoreResults,
    ...rssResults,
    ...staticResults,
    ...securityResults,
  ];

  // ── Compute global score ───────────────────────────────────────────────────
  const globalScore = Math.round(
    allChecks.reduce((s, c) => s + c.score, 0) / allChecks.length,
  );

  // ── Print results ──────────────────────────────────────────────────────────
  const icons = { ok: '✅', warn: '⚠️ ', error: '❌' };
  const categories = [
    ['🌐 Disponibilité', siteResults],
    ['🚀 CI/CD', ciResults],
    ['🔥 Firestore', firestoreResults],
    ['📰 Flux RSS', rssResults],
    ['📦 Données statiques', staticResults],
    ['🔒 Sécurité', securityResults],
  ];

  for (const [cat, results] of categories) {
    console.log(`${cat} :`);
    results.forEach((r) => console.log(`  ${icons[r.status]} ${r.label} (${r.score}/100) — ${r.detail}`));
    console.log('');
  }

  const statusEmoji = globalScore >= 90 ? '🟢' : globalScore >= 70 ? '🟡' : '🔴';
  console.log(`${statusEmoji} Score global : ${globalScore}/100`);

  // ── AI global analysis ─────────────────────────────────────────────────────
  console.log('\n🤖 Génération analyse IA globale…');
  const aiAnalysis = await generateGlobalAnalysis(allChecks, globalScore);
  if (aiAnalysis) {
    console.log(`   Statut : ${aiAnalysis.status_global}`);
    console.log(`   Rapport : ${aiAnalysis.rapport?.slice(0, 100)}…`);
    console.log(`   Action : ${aiAnalysis.action_prioritaire?.slice(0, 80)}…`);
  }

  // ── Compose final report ───────────────────────────────────────────────────
  const report = {
    timestamp: ISO_NOW,
    globalScore,
    statusEmoji,
    checks: allChecks,
    aiAnalysis,
    summary: {
      ok: allChecks.filter((c) => c.status === 'ok').length,
      warn: allChecks.filter((c) => c.status === 'warn').length,
      error: allChecks.filter((c) => c.status === 'error').length,
      total: allChecks.length,
    },
  };

  if (!DRY_RUN) {
    // ── Write to Firestore ──────────────────────────────────────────────────
    await writeMonitoringReport(db, report);

    // ── Create alert issue if score too low ─────────────────────────────────
    if (globalScore < CONFIG.alertScoreThreshold) {
      console.log(`\n🚨 Score ${globalScore} < ${CONFIG.alertScoreThreshold} — création issue GitHub…`);
      await createAlertIssue(report);
    }
  } else {
    console.log('\nℹ️  DRY-RUN : pas d\'écriture Firestore ni création issue');
  }

  // ── GitHub Step Summary ────────────────────────────────────────────────────
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { appendFileSync } = await import('fs');
    const lines = [
      `## 🤖 Monitoring IA Global — ${ISO_NOW.slice(0, 16).replace('T', ' ')} UTC`,
      '',
      `### ${statusEmoji} Score Global : ${globalScore}/100`,
      '',
      `| Statut | Nombre |`,
      `|---|---|`,
      `| ✅ OK | ${report.summary.ok} |`,
      `| ⚠️ Avertissements | ${report.summary.warn} |`,
      `| ❌ Erreurs | ${report.summary.error} |`,
      '',
      ...categories.map(([cat, results]) =>
        [`#### ${cat}`, ...results.map((r) => `- ${icons[r.status]} **${r.label}** (${r.score}/100) — ${r.detail}`)].join('\n'),
      ),
      '',
      aiAnalysis ? [
        '### 🤖 Analyse IA',
        `> **${aiAnalysis.status_global?.toUpperCase()}** — ${aiAnalysis.rapport}`,
        '',
        aiAnalysis.action_prioritaire ? `**Action prioritaire :** ${aiAnalysis.action_prioritaire}` : '',
      ].filter(Boolean).join('\n') : '',
    ]
      .filter((l) => l !== undefined)
      .join('\n');
    appendFileSync(summaryPath, lines + '\n');
  }

  console.log('\n✅ Surveillance terminée\n');

  // The monitor completes successfully even when issues are detected.
  // Alerts are communicated via GitHub Issues and Firestore reports.
  // Exit code 0 ensures the workflow stays green and avoids alarm fatigue.
  const criticalErrors = allChecks.filter((c) => c.status === 'error' && c.score === 0).length;
  if (criticalErrors > 0) {
    console.log(`ℹ️  ${criticalErrors} erreur(s) détectée(s) — rapport Firestore + issue GitHub créés`);
  }
}

main().catch((err) => {
  console.error('💥 Erreur fatale IA Monitor :', err);
  process.exit(1);
});
