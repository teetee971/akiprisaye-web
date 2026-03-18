#!/usr/bin/env node
/**
 * lighthouse-history.mjs
 *
 * Gestion de l'historique compact des runs Lighthouse.
 *
 * Structure d'un snapshot :
 *   {
 *     sha, branch, runId, workflow,
 *     auditedUrl, sourceType,      // 'localhost' | 'cloudflare' | 'manual'
 *     timestamp,
 *     performance, accessibility, seo, bestPractices,
 *     qualityScore,
 *   }
 *
 * L'historique est un tableau JSON de snapshots (du plus ancien au plus récent).
 * Il est stocké comme artefact GitHub Actions (lighthouse-history) et chargé
 * depuis /tmp/lh-history.json lors de chaque run.
 *
 * @see docs/lighthouse-governance.md pour la politique de conservation.
 */

import fs from 'fs';

/** Nombre maximum de snapshots conservés dans l'historique. */
export const MAX_HISTORY_ENTRIES = 10;

/**
 * Crée un snapshot à partir des scores et des métadonnées d'environnement.
 *
 * @param {Object} scores  - { performance, accessibility, seo, bestPractices, url }
 * @param {Object} [meta]  - Métadonnées supplémentaires
 * @returns {Object} Snapshot prêt à insérer dans l'historique
 */
export function createSnapshot(scores, meta = {}) {
  const { computeQualityScore } = meta._engine ?? {};
  const qualityScore = typeof computeQualityScore === 'function'
    ? computeQualityScore(scores)
    : null;

  return {
    sha:          meta.sha          ?? process.env.GITHUB_SHA        ?? 'unknown',
    branch:       meta.branch       ?? process.env.GITHUB_REF_NAME   ?? 'unknown',
    runId:        meta.runId        ?? process.env.GITHUB_RUN_ID     ?? 'unknown',
    workflow:     meta.workflow     ?? process.env.GITHUB_WORKFLOW    ?? 'unknown',
    auditedUrl:   meta.auditedUrl   ?? scores.url                    ?? 'unknown',
    sourceType:   meta.sourceType   ?? 'localhost',
    timestamp:    meta.timestamp    ?? new Date().toISOString(),
    performance:  scores.performance   ?? null,
    accessibility:scores.accessibility ?? null,
    seo:          scores.seo           ?? null,
    bestPractices:scores.bestPractices ?? null,
    qualityScore,
  };
}

/**
 * Ajoute un snapshot à l'historique en conservant au maximum MAX_HISTORY_ENTRIES entrées.
 *
 * @param {Object[]} history  - Historique existant
 * @param {Object} snapshot   - Nouveau snapshot à ajouter
 * @returns {Object[]} Nouvel historique (nouveau tableau, immutable)
 */
export function appendToHistory(history, snapshot) {
  const base = Array.isArray(history) ? history : [];
  const updated = [...base, snapshot];
  // Garde les N dernières entrées (les plus récentes)
  return updated.slice(-MAX_HISTORY_ENTRIES);
}

/**
 * Charge l'historique depuis un fichier JSON.
 * Retourne un tableau vide si le fichier est absent ou malformé.
 *
 * @param {string} historyPath - Chemin vers le fichier historique
 * @returns {Object[]} Historique chargé
 */
export function loadHistory(historyPath) {
  if (!historyPath || !fs.existsSync(historyPath)) return [];
  try {
    const raw = fs.readFileSync(historyPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`⚠️  Historique Lighthouse invalide (non-tableau) dans ${historyPath} — ignoré.`);
      return [];
    }
    return parsed;
  } catch (err) {
    console.warn(`⚠️  Impossible de lire l'historique Lighthouse (${historyPath}) : ${err.message}`);
    return [];
  }
}

/**
 * Sauvegarde l'historique dans un fichier JSON.
 *
 * @param {Object[]} history     - Historique à sauvegarder
 * @param {string} historyPath   - Chemin de destination
 */
export function saveHistory(history, historyPath) {
  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.warn(`⚠️  Impossible d'écrire l'historique Lighthouse (${historyPath}) : ${err.message}`);
  }
}
