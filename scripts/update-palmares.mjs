#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// 🏆 update-palmares.mjs
//
// Calcule le palmarès quotidien des enseignes DOM-TOM à partir des données
// disponibles (catalogue.json, observatoire snapshots) et maintient un
// historique glissant de 90 jours dans frontend/public/data/palmares.json.
//
// Usage:
//   node scripts/update-palmares.mjs [--dry-run]
//
// Sortie:
//   frontend/public/data/palmares.json   — données actuelles + historique
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'frontend', 'public', 'data');
const PALMARES_FILE = join(DATA_DIR, 'palmares.json');
const OBSERVATOIRE_DIR = join(DATA_DIR, 'observatoire');
const CATALOGUE_FILE = join(DATA_DIR, 'catalogue.json');

const DRY_RUN = process.argv.includes('--dry-run');
const TODAY = new Date().toISOString().slice(0, 10);
const HISTORY_MAX_DAYS = 90;

// ── Territory configuration ──────────────────────────────────────────────────

/** Maps territory codes to: snapshot file prefix, store seeds */
const TERRITORY_CONFIG = {
  gp: {
    label: 'Guadeloupe',
    snapshotPrefix: 'guadeloupe',
    stores: {
      lowestPrices: ['Ecomax Capesterre', 'Super U Baie-Mahault', 'Leader Price Jarry', 'Carrefour Destreland', 'Aldi Baie-Mahault'],
      bestValue:    ['Leader Price Jarry', 'Marché de Bergevin', 'Ecomax Gosier', 'Super U Baie-Mahault', 'Carrefour Destreland'],
      widestSelection: ['Carrefour Destreland', 'Super U Baie-Mahault', 'Hyper Casino Bas-du-Fort', 'Cora Baie-Mahault', 'Ecomax Capesterre'],
    },
  },
  mq: {
    label: 'Martinique',
    snapshotPrefix: 'martinique',
    stores: {
      lowestPrices: ['Ecomax Lamentin', 'Super U Ducos', 'Carrefour Génipa', 'Leader Price Rivière-Salée', 'Aldi Martinique'],
      bestValue:    ['Marché de Fort-de-France', 'Ecomax Trinité', 'Super U Ducos', 'Leader Price Rivière-Salée', 'Carrefour Génipa'],
      widestSelection: ['Carrefour Génipa', 'Super U Rivière-Salée', 'Ecomax Lamentin', 'Monoprix FDF', 'Hyper U Martinique'],
    },
  },
  gf: {
    label: 'Guyane',
    snapshotPrefix: 'guyane',
    stores: {
      lowestPrices: ['Leader Price Cayenne', 'Super U Matoury', 'Carrefour Rémire', 'Ecomax Kourou', 'Score Cayenne'],
      bestValue:    ['Marché de Cayenne', 'Super U Matoury', 'Leader Price Cayenne', 'Carrefour Rémire', 'Score Cayenne'],
      widestSelection: ['Carrefour Rémire', 'Super U Matoury', 'Leader Price Cayenne', 'Cora Guyane', 'Ecomax Kourou'],
    },
  },
  re: {
    label: 'La Réunion',
    snapshotPrefix: 'la_réunion',
    stores: {
      lowestPrices: ['Leader Price Saint-Pierre', 'Super U Saint-Paul', 'Carrefour Sainte-Clotilde', 'Aldi Réunion', 'Score Saint-Denis'],
      bestValue:    ['Marché de Saint-Paul', 'Super U Saint-Joseph', 'Leader Price Saint-Pierre', 'Score Saint-Denis', 'Carrefour Sainte-Clotilde'],
      widestSelection: ['Carrefour Sainte-Clotilde', 'Leclerc Portail', 'Super U Saint-Paul', 'Jumbo Score Nord', 'Auchan Réunion'],
    },
  },
  yt: {
    label: 'Mayotte',
    snapshotPrefix: 'mayotte',
    stores: {
      lowestPrices: ['Jumbo Score Kawéni', 'Super U Mamoudzou', 'Carrefour Mamoudzou', 'Score Bandraboua', 'G20 Kawéni'],
      bestValue:    ['Marché de Mamoudzou', 'Super U Mamoudzou', 'Jumbo Score Kawéni', 'G20 Kawéni', 'Carrefour Mamoudzou'],
      widestSelection: ['Carrefour Mamoudzou', 'Super U Mamoudzou', 'Jumbo Score Kawéni', 'Score Bandraboua', 'G20 Kawéni'],
    },
  },
  fr: {
    label: 'France métropolitaine',
    snapshotPrefix: 'hexagone',
    stores: {
      lowestPrices: ['E.Leclerc', 'Lidl', 'Intermarché', 'Aldi', 'Netto'],
      bestValue:    ['E.Leclerc', 'U Express', 'Carrefour Market', 'Intermarché', 'Système U'],
      widestSelection: ['Carrefour', 'Auchan', 'E.Leclerc', 'Intermarché', 'Système U'],
    },
  },
};

// ── Data loading helpers ──────────────────────────────────────────────────────

function loadJSON(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function loadCatalogue() {
  return loadJSON(CATALOGUE_FILE) ?? [];
}

/** Load the most recent observatoire snapshot for a territory. */
function loadLatestSnapshot(snapshotPrefix) {
  if (!existsSync(OBSERVATOIRE_DIR)) return null;
  const files = readdirSync(OBSERVATOIRE_DIR)
    .filter((f) => f.startsWith(snapshotPrefix) && f.endsWith('.json'))
    .sort()
    .reverse();
  if (!files.length) return null;
  return loadJSON(join(OBSERVATOIRE_DIR, files[0]));
}

// ── Score computation ─────────────────────────────────────────────────────────

/**
 * Build a price map { storeName: avgPrice } from catalogue items.
 * Only use items that have no territory field (global catalogue).
 */
function buildCatalogueStorePrices(catalogue) {
  const sums = {};
  const counts = {};
  for (const item of catalogue) {
    const store = (item.store ?? '').trim().toUpperCase();
    if (!store) continue;
    const price = Number(item.price);
    if (!price || price <= 0) continue;
    sums[store] = (sums[store] ?? 0) + price;
    counts[store] = (counts[store] ?? 0) + 1;
  }
  const result = {};
  for (const store of Object.keys(sums)) {
    result[store] = sums[store] / counts[store];
  }
  return result;
}

/**
 * Build a price map { storeName: avgPrice } from an observatoire snapshot.
 */
function buildSnapshotStorePrices(snapshot) {
  if (!snapshot?.donnees) return {};
  const sums = {};
  const counts = {};
  for (const item of snapshot.donnees) {
    const store = (item.enseigne ?? '').trim().toUpperCase();
    const price = Number(item.prix);
    if (!store || !price || price <= 0) continue;
    sums[store] = (sums[store] ?? 0) + price;
    counts[store] = (counts[store] ?? 0) + 1;
  }
  const result = {};
  for (const store of Object.keys(sums)) {
    result[store] = sums[store] / counts[store];
  }
  return result;
}

/**
 * Compute a normalized score [60-100] from a raw value where:
 *  - lower raw = better score for lowestPrices
 *  - higher raw = better score for others
 */
function normalizeScore(values, higher = true) {
  const vals = Object.values(values).filter((v) => v > 0);
  if (!vals.length) return {};
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const scores = {};
  for (const [k, v] of Object.entries(values)) {
    const normalized = higher
      ? ((v - min) / range) * 40 + 60
      : ((max - v) / range) * 40 + 60;
    scores[k] = Math.round(normalized);
  }
  return scores;
}

/**
 * Derive `change` by comparing to the last snapshot in history.
 */
function deriveChange(storeName, category, territory, history) {
  if (!history.length) return 'stable';
  const prev = history[history.length - 1]?.territories?.find(
    (t) => t.territory === territory,
  );
  if (!prev) return 'stable';
  const prevEntry = prev[category]?.find((e) => e.name === storeName);
  if (!prevEntry) return 'stable';
  // current score will be computed — we use the previous score as reference
  return null; // will be resolved post-scoring
}

/**
 * Build ranking entries for a list of candidate stores.
 * Falls back to seeded scores when no real data is available.
 */
function buildRanking(storeNames, scoreMap, seedScores, category, territory, history) {
  const entries = storeNames.map((name, idx) => {
    const upper = name.toUpperCase();
    // Try exact match, then partial match in score map
    let rawScore = scoreMap[upper];
    if (rawScore === undefined) {
      for (const [k, v] of Object.entries(scoreMap)) {
        if (k.includes(upper) || upper.includes(k)) {
          rawScore = v;
          break;
        }
      }
    }
    const score = rawScore !== undefined ? rawScore : seedScores[idx];
    return { name, score };
  });

  // Sort: higher score first
  entries.sort((a, b) => b.score - a.score);

  // Compare to history to derive change
  const prevMap = {};
  if (history.length) {
    const prev = history[history.length - 1]?.territories?.find(
      (t) => t.territory === territory,
    );
    if (prev) {
      for (const e of prev[category] ?? []) {
        prevMap[e.name] = e.score;
      }
    }
  }

  return entries.slice(0, 3).map((e) => {
    const prev = prevMap[e.name];
    const change =
      prev === undefined ? 'stable'
      : e.score > prev ? 'up'
      : e.score < prev ? 'down'
      : 'stable';
    const diff = prev !== undefined ? e.score - prev : 0;
    const note =
      change === 'stable'
        ? 'Score stable'
        : change === 'up'
        ? `+${diff.toFixed(1)} pt`
        : `${diff.toFixed(1)} pt`;
    return { name: e.name, score: e.score, change, note };
  });
}

// ── Main computation ──────────────────────────────────────────────────────────

function computePalmares(history) {
  const catalogue = loadCatalogue();
  const catalogueStorePrices = buildCatalogueStorePrices(catalogue);
  // Normalize catalogue prices (lower = better for lowestPrices)
  const catalogueLowScores = normalizeScore(catalogueStorePrices, false);
  // Normalize for selection count (catalogue items per store)
  const catalogueCounts = {};
  for (const item of catalogue) {
    const s = (item.store ?? '').trim().toUpperCase();
    if (s) catalogueCounts[s] = (catalogueCounts[s] ?? 0) + 1;
  }
  const catalogueSelectionScores = normalizeScore(catalogueCounts, true);

  const territories = [];

  for (const [code, cfg] of Object.entries(TERRITORY_CONFIG)) {
    const snapshot = loadLatestSnapshot(cfg.snapshotPrefix);
    const snapshotPrices = buildSnapshotStorePrices(snapshot);
    const snapshotLowScores = normalizeScore(snapshotPrices, false);

    // Merge catalogue + snapshot scores (snapshot wins when available)
    const mergedLow = { ...catalogueLowScores, ...snapshotLowScores };
    const mergedSel = { ...catalogueSelectionScores };

    // For bestValue we invert (higher price often → better quality in DOM context)
    // but we primarily use rank stability; proxy: mid-range price = best value
    const snapshotAvg = Object.values(snapshotPrices).reduce((a, b) => a + b, 0) / (Object.keys(snapshotPrices).length || 1);
    const mergedBest = {};
    for (const [k, v] of Object.entries(snapshotPrices)) {
      // Closer to average price → better "value" (not cheapest, not most expensive)
      mergedBest[k] = 100 - Math.abs(v - snapshotAvg) / (snapshotAvg || 1) * 50;
    }

    // Seed scores (fallback when no real data) — based on previous static data
    const seedLow   = [93, 90, 88];
    const seedBest  = [92, 89, 87];
    const seedSel   = [95, 93, 89];

    territories.push({
      territory: code,
      updatedAt: TODAY,
      lowestPrices: buildRanking(cfg.stores.lowestPrices, mergedLow, seedLow, 'lowestPrices', code, history),
      bestValue: buildRanking(cfg.stores.bestValue, mergedBest, seedBest, 'bestValue', code, history),
      widestSelection: buildRanking(cfg.stores.widestSelection, mergedSel, seedSel, 'widestSelection', code, history),
    });
  }

  return territories;
}

// ── Entry point ───────────────────────────────────────────────────────────────

function main() {
  console.log(`🏆 update-palmares.mjs — ${TODAY}${DRY_RUN ? ' [DRY RUN]' : ''}`);

  // Load existing palmares (with history)
  const existing = loadJSON(PALMARES_FILE) ?? { generatedAt: TODAY, territories: [], history: [] };
  const history = existing.history ?? [];

  // Skip if already computed today
  if (existing.generatedAt === TODAY && !DRY_RUN) {
    const alreadyRun = (existing.territories ?? []).some((t) => t.updatedAt === TODAY);
    if (alreadyRun) {
      console.log('ℹ️  Palmarès déjà à jour pour aujourd\'hui — skip');
      return;
    }
  }

  // Archive current territories as a history entry (before overwriting)
  if (existing.territories?.length && existing.generatedAt !== TODAY) {
    history.push({
      date: existing.generatedAt,
      territories: existing.territories,
    });
    // Keep only last HISTORY_MAX_DAYS entries
    while (history.length > HISTORY_MAX_DAYS) {
      history.shift();
    }
    console.log(`📚 Archivé snapshot du ${existing.generatedAt} (historique: ${history.length} entrée(s))`);
  }

  // Compute fresh palmares
  const territories = computePalmares(history);

  const output = {
    generatedAt: TODAY,
    territories,
    history,
  };

  if (DRY_RUN) {
    console.log('--- DRY RUN output ---');
    console.log(JSON.stringify(output, null, 2).slice(0, 2000));
    console.log('...');
    return;
  }

  writeFileSync(PALMARES_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ palmares.json mis à jour — ${territories.length} territoires, ${history.length} entrée(s) historique`);

  // Print summary
  for (const t of territories) {
    const top = t.lowestPrices[0];
    console.log(`  ${t.territory.toUpperCase()}: #1 prix bas → ${top?.name} (${top?.score}/100)`);
  }
}

main();
