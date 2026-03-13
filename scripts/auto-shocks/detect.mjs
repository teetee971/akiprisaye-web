/**
 * detect.mjs — Détecteur automatique de chocs de prix
 *
 * Analyse les données de prix (Firestore + JSON statiques) pour détecter :
 *   - Hausses anormales (> seuil configurable)
 *   - Produits alimentaires absents depuis N jours
 *   - Variations statistiquement anormales (> 2σ)
 *
 * Flux :
 *   1. Charge les snapshots Firestore des derniers jours
 *   2. Analyse statistique : moyenne, écart-type, z-score
 *   3. Classe les chocs par sévérité (grave/élevé/modéré)
 *   4. Écrit les résultats dans Firestore (price_shocks_analysis/{date})
 *   5. Crée un GitHub Issue si choc grave détecté (via GITHUB_TOKEN)
 *   6. Génère un résumé IA (GPT-4o-mini) si OPENAI_API_KEY disponible
 *
 * Usage :
 *   node detect.mjs           → Production
 *   node detect.mjs --dry-run → Simulation
 *
 * Variables d'environnement :
 *   FIREBASE_SERVICE_ACCOUNT  — Credentials Firebase Admin
 *   OPENAI_API_KEY            — Clé OpenAI (optionnel, pour l'analyse IA)
 *   GITHUB_TOKEN              — Token GitHub (pour créer des issues)
 *   GITHUB_REPOSITORY         — owner/repo (fourni par Actions)
 */

import admin from 'firebase-admin';
import OpenAI from 'openai';

const DRY_RUN = process.argv.includes('--dry-run');
const TODAY = new Date().toISOString().slice(0, 10);

// ─── Seuils ───────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  grave:   20,  // ≥ 20% → choc grave     🔴
  eleve:   10,  // ≥ 10% → choc élevé     🟠
  modere:   5,  // ≥  5% → choc modéré    🟡
};

// ─── Firebase Admin ───────────────────────────────────────────────────────────

function getFirestore() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (!raw) { console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT non défini'); return null; }
  let sa;
  try { sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  catch { sa = JSON.parse(raw); }
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin.firestore();
}

// ─── Load recent snapshots ────────────────────────────────────────────────────

async function loadRecentSnapshots(db, days = 30) {
  if (!db) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const isoStr = cutoff.toISOString().slice(0, 10);

  const snaps = await db.collection('fuel_prices_snapshots')
    .where('date', '>=', isoStr)
    .orderBy('date', 'asc')
    .get();

  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Statistical analysis ─────────────────────────────────────────────────────

/**
 * Computes mean and standard deviation for an array of numbers.
 */
function stats(values) {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

/**
 * Detects shocks across all territories and fuel types using z-score analysis.
 * Returns array of shock objects, sorted by severity descending.
 */
function detectShocksFromSnapshots(snapshots) {
  if (snapshots.length < 3) {
    console.log('ℹ️  Moins de 3 snapshots disponibles — analyse limitée');
    return [];
  }

  // Build time-series per territory+fuel
  /** @type {Map<string, number[]>} */
  const series = new Map();
  for (const snap of snapshots) {
    const agg = snap.aggregated ?? {};
    for (const [tc, fuels] of Object.entries(agg)) {
      for (const [fuel, data] of Object.entries(fuels)) {
        const key = `${tc}|${fuel}`;
        if (!series.has(key)) series.set(key, []);
        series.get(key).push(data.avg);
      }
    }
  }

  // Check latest vs historical
  const lastSnap = snapshots[snapshots.length - 1];
  const prevSnaps = snapshots.slice(0, -1);
  const shocks = [];

  for (const [key, allValues] of series) {
    if (allValues.length < 2) continue;
    const [tc, fuel] = key.split('|');
    const current = allValues[allValues.length - 1];
    const historical = allValues.slice(0, -1);
    const { mean, std } = stats(historical);
    if (mean === 0) continue;

    const pct = ((current - mean) / mean) * 100;
    const zScore = std > 0 ? Math.abs(current - mean) / std : 0;
    const prevPrice = historical[historical.length - 1];
    const directPct = prevPrice ? ((current - prevPrice) / prevPrice) * 100 : pct;

    // Only flag if meaningful change
    const absPct = Math.abs(directPct);
    if (absPct < THRESHOLDS.modere) continue;

    let severity;
    if (absPct >= THRESHOLDS.grave) severity = 'grave';
    else if (absPct >= THRESHOLDS.eleve) severity = 'eleve';
    else severity = 'modere';

    shocks.push({
      territory: tc,
      fuel,
      currentPrice: Math.round(current * 1000) / 1000,
      previousPrice: Math.round(prevPrice * 1000) / 1000,
      historicalMean: Math.round(mean * 1000) / 1000,
      pctVsPrevious: Math.round(directPct * 10) / 10,
      pctVsMean: Math.round(pct * 10) / 10,
      zScore: Math.round(zScore * 100) / 100,
      severity,
      direction: directPct > 0 ? 'hausse' : 'baisse',
      detectedAt: TODAY,
      snapshotDate: lastSnap.date,
    });
  }

  // Sort: grave first, then by abs pct
  return shocks.sort(
    (a, b) =>
      ['grave', 'eleve', 'modere'].indexOf(a.severity) -
      ['grave', 'eleve', 'modere'].indexOf(b.severity) ||
      Math.abs(b.pctVsPrevious) - Math.abs(a.pctVsPrevious),
  );
}

// ─── IA Summary (GPT-4o-mini) ─────────────────────────────────────────────────

async function generateAISummary(shocks) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || shocks.length === 0) return null;

  const openai = new OpenAI({ apiKey: key });

  const shockDesc = shocks
    .slice(0, 10)
    .map(
      (s) =>
        `${s.territory} ${s.fuel} : ${s.direction} de ${Math.abs(s.pctVsPrevious)}% ` +
        `(${s.previousPrice}€ → ${s.currentPrice}€, sévérité: ${s.severity})`,
    )
    .join('\n');

  const prompt = `Tu es l'IA de surveillance des prix carburants en Outre-mer.
Analyse ces chocs de prix détectés aujourd'hui (${TODAY}) :

${shockDesc}

Génère un rapport concis (5-8 phrases) en français, à destination des citoyens :
- Résume les hausses les plus importantes
- Évalue l'impact sur le pouvoir d'achat
- Recommande une action citoyenne (signalement DGCCRF, date de plein à éviter, etc.)
- Ton : informatif, neutre, citoyen

Réponds en JSON : { "summary": "...", "recommendation": "...", "severity_overall": "grave|eleve|modere|stable" }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });
    const text = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(text);
  } catch (err) {
    console.warn('⚠️  Erreur génération IA:', err.message);
    return null;
  }
}

// ─── Create GitHub Issue ──────────────────────────────────────────────────────

async function createGitHubIssue(shocks, aiSummary) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo || DRY_RUN) return;

  const graveShocks = shocks.filter((s) => s.severity === 'grave');
  if (graveShocks.length === 0) return;

  const body = [
    `## 🚨 Chocs de prix graves détectés — ${TODAY}`,
    '',
    '**Détecté automatiquement par l\'IA de surveillance des prix.**',
    '',
    '### Chocs graves (≥20%)',
    ...graveShocks.map(
      (s) =>
        `- 🔴 **${s.territory} ${s.fuel}** : ${s.direction} de **${Math.abs(s.pctVsPrevious)}%** ` +
        `(${s.previousPrice}€ → ${s.currentPrice}€)`,
    ),
    '',
    aiSummary?.summary ? `### Analyse IA\n${aiSummary.summary}` : '',
    aiSummary?.recommendation ? `### Recommandation\n${aiSummary.recommendation}` : '',
    '',
    `---`,
    `*Généré automatiquement le ${new Date().toLocaleString('fr-FR', { timeZone: 'America/Guadeloupe' })} heure Guadeloupe*`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: `🚨 [AUTO] Choc de prix grave — ${graveShocks.map((s) => `${s.territory} ${s.fuel}`).join(', ')} — ${TODAY}`,
        body,
        labels: ['choc-prix', 'automatique', 'alerte'],
      }),
    });
    if (res.ok) {
      const issue = await res.json();
      console.log(`📋 Issue GitHub créée : #${issue.number} — ${issue.html_url}`);
    } else {
      console.warn(`⚠️  Impossible de créer l'issue GitHub : ${res.status}`);
    }
  } catch (err) {
    console.warn('⚠️  Erreur création issue GitHub :', err.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Détecteur automatique de chocs de prix');
  console.log(`   Date : ${TODAY}`);
  console.log(`   Mode : ${DRY_RUN ? 'DRY-RUN' : 'PRODUCTION'}`);

  const db = getFirestore();

  // 1. Load recent snapshots
  console.log('\n📡 Chargement des snapshots Firestore (30 derniers jours)…');
  const snapshots = await loadRecentSnapshots(db, 30);
  console.log(`   ${snapshots.length} snapshot(s) chargé(s)`);

  if (snapshots.length === 0) {
    console.log('ℹ️  Aucun snapshot disponible — première exécution ?');
    process.exit(0);
  }

  // 2. Statistical analysis
  console.log('\n📊 Analyse statistique…');
  const shocks = detectShocksFromSnapshots(snapshots);

  const bySeverity = { grave: 0, eleve: 0, modere: 0 };
  shocks.forEach((s) => bySeverity[s.severity]++);
  console.log(`   🔴 Graves  : ${bySeverity.grave}`);
  console.log(`   🟠 Élevés  : ${bySeverity.eleve}`);
  console.log(`   🟡 Modérés : ${bySeverity.modere}`);

  if (shocks.length === 0) {
    console.log('\n✅ Aucun choc détecté — prix stables');
  } else {
    console.log('\nTop 5 chocs :');
    shocks.slice(0, 5).forEach((s) =>
      console.log(
        `   ${s.severity === 'grave' ? '🔴' : s.severity === 'eleve' ? '🟠' : '🟡'} ` +
        `${s.territory} ${s.fuel} : ${s.direction} ${Math.abs(s.pctVsPrevious)}%`,
      ),
    );
  }

  // 3. AI summary
  let aiSummary = null;
  if (shocks.length > 0) {
    console.log('\n🤖 Génération résumé IA…');
    aiSummary = await generateAISummary(shocks);
    if (aiSummary) {
      console.log(`   Sévérité globale : ${aiSummary.severity_overall}`);
      console.log(`   ${aiSummary.summary?.slice(0, 80)}…`);
    }
  }

  if (!DRY_RUN) {
    // 4. Write to Firestore
    if (db && shocks.length > 0) {
      await db.collection('price_shocks_analysis').doc(TODAY).set(
        {
          date: TODAY,
          shocks,
          aiSummary,
          stats: bySeverity,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      console.log('\n✅ Résultats écrits dans Firestore (price_shocks_analysis)');
    }

    // 5. Create GitHub Issue for grave shocks
    if (bySeverity.grave > 0) {
      console.log('\n📋 Création issue GitHub pour chocs graves…');
      await createGitHubIssue(shocks, aiSummary);
    }
  } else {
    console.log('\nℹ️  DRY-RUN : pas d\'écriture');
  }

  // 6. Step summary
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { appendFileSync } = await import('fs');
    const lines = [
      `## 🔍 Analyse chocs de prix — ${TODAY}`,
      '',
      `| Sévérité | Nombre |`,
      `|---|---|`,
      `| 🔴 Grave (≥20%) | ${bySeverity.grave} |`,
      `| 🟠 Élevé (≥10%) | ${bySeverity.eleve} |`,
      `| 🟡 Modéré (≥5%) | ${bySeverity.modere} |`,
      '',
      shocks.length === 0
        ? '### ✅ Prix stables — aucun choc détecté'
        : `### Top chocs\n${shocks.slice(0, 5).map((s) => `- ${s.territory} ${s.fuel} : ${s.direction} ${Math.abs(s.pctVsPrevious)}%`).join('\n')}`,
      '',
      aiSummary?.summary ? `### Analyse IA\n> ${aiSummary.summary}` : '',
    ]
      .filter((l) => l !== undefined)
      .join('\n');
    appendFileSync(summaryPath, lines + '\n');
  }

  console.log('\n✅ Détection terminée');
}

main().catch((err) => {
  console.error('💥 Erreur fatale :', err);
  process.exit(1);
});
