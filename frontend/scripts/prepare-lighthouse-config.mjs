#!/usr/bin/env node
/**
 * prepare-lighthouse-config.mjs
 *
 * Génère la configuration @lhci/cli adaptée à l'environnement CI,
 * et détermine l'URL à auditer selon une politique explicite et ordonnée.
 *
 * Politique d'URL (ordre de priorité décroissant — Phase 7) :
 *   1. URL Cloudflare Pages réelle (LHCI_URL défini par le workflow Cloudflare)
 *   2. URL fournie explicitement (workflow_dispatch LHCI_URL)
 *   3. Fallback localhost:4173 (npm run preview — toujours disponible en CI)
 *
 * Pour chaque run, enregistre dans les variables d'environnement (via env file) :
 *   LH_AUDITED_URL   — URL réellement auditée
 *   LH_SOURCE_TYPE   — 'cloudflare' | 'manual' | 'localhost'
 *   LH_WAS_FALLBACK  — '1' si localhost utilisé à la place d'une URL CDN attendue
 *
 * Ces variables sont ensuite consommées par lighthouse-guard.mjs et
 * lighthouse-pr-comment.mjs pour afficher et journaliser le contexte d'audit.
 *
 * Entrées (variables d'environnement) :
 *   LHCI_URL            — URL cible réelle (Cloudflare ou manuelle, optionnel)
 *   LHCI_EXPECT_CDN     — '1' si une URL CDN est attendue (non-localhost = warning si absent)
 *   LHCI_CONFIG_SOURCE  — chemin vers lighthouserc.json source
 *                         (défaut: ../lighthouserc.json)
 *   LHCI_CONFIG_OUTPUT  — chemin de sortie de la config générée
 *                         (défaut: /tmp/lhcirc.json)
 *   GITHUB_ENV          — chemin vers le fichier d'env GitHub Actions (optionnel)
 *
 * Sorties :
 *   /tmp/lhcirc.json    — config @lhci/cli prête à l'emploi
 *   $GITHUB_ENV         — LH_AUDITED_URL, LH_SOURCE_TYPE, LH_WAS_FALLBACK (si disponible)
 *
 * Usage : node scripts/prepare-lighthouse-config.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceFile  = process.env.LHCI_CONFIG_SOURCE
  || path.resolve(__dirname, '..', '..', 'lighthouserc.json');
const outputFile  = process.env.LHCI_CONFIG_OUTPUT || '/tmp/lhcirc.json';
const targetUrl   = process.env.LHCI_URL || '';
const expectCDN   = process.env.LHCI_EXPECT_CDN === '1';

if (!fs.existsSync(sourceFile)) {
  console.error('❌  Fichier source introuvable : ' + sourceFile);
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

// ─── Politique d'URL ───────────────────────────────────────────────────────────

let auditedUrl, urlSource, wasFallback;

if (targetUrl && targetUrl.startsWith('http')) {
  // Priorité 1 & 2 : URL réelle (Cloudflare ou manuelle)
  auditedUrl  = targetUrl;
  // Distinguer Cloudflare (.pages.dev ou .cloudflare.com) et manuelle
  urlSource   = /pages\.dev|cloudflare\.com/.test(targetUrl) ? 'cloudflare' : 'manual';
  wasFallback = false;

  cfg.ci.collect.url = [auditedUrl];
  delete cfg.ci.collect.startServerCommand;
  delete cfg.ci.collect.startServerReadyTimeout;

  console.log(`🌐 Lighthouse → URL ${urlSource} : ${auditedUrl}`);
} else {
  // Priorité 3 : fallback localhost
  const localUrl = (cfg.ci.collect.url && cfg.ci.collect.url[0]) || 'http://localhost:4173';
  auditedUrl  = localUrl;
  urlSource   = 'localhost';
  wasFallback = expectCDN; // fallback non attendu si CDN était requis

  cfg.ci.collect.url = [auditedUrl];
  console.log(`🖥️  Lighthouse → serveur local : ${auditedUrl}`);

  if (expectCDN) {
    console.warn('⚠️  Fallback localhost utilisé alors qu\'une URL CDN était attendue (LHCI_EXPECT_CDN=1).');
    console.warn('   → Le verdict sera marqué WARN pour signaler ce contexte dégradé.');
  }
}

// ─── Écriture de la config ─────────────────────────────────────────────────────

fs.writeFileSync(outputFile, JSON.stringify(cfg, null, 2));
console.log('✅ Config Lighthouse générée dans : ' + outputFile);
console.log(`   URL source    : ${urlSource}`);
console.log(`   URL auditée   : ${auditedUrl}`);
console.log(`   Fallback      : ${wasFallback ? 'oui (⚠️ WARN)' : 'non'}`);

// ─── Export vers $GITHUB_ENV ───────────────────────────────────────────────────
// Rend les métadonnées d'URL disponibles pour les étapes suivantes du job.

const githubEnv = process.env.GITHUB_ENV;
if (githubEnv) {
  try {
    const envLines = [
      `LH_AUDITED_URL=${auditedUrl}`,
      `LH_SOURCE_TYPE=${urlSource}`,
      `LH_WAS_FALLBACK=${wasFallback ? '1' : '0'}`,
    ].join('\n') + '\n';
    fs.appendFileSync(githubEnv, envLines);
    console.log('✅ LH_AUDITED_URL, LH_SOURCE_TYPE, LH_WAS_FALLBACK exportés dans $GITHUB_ENV.');
  } catch (err) {
    console.warn('⚠️  Impossible d\'écrire dans $GITHUB_ENV :', err.message);
  }
}
