#!/usr/bin/env node
/**
 * prepare-lighthouse-config.mjs
 *
 * Génère un fichier de configuration @lhci/cli adapté à l'environnement CI.
 *
 * Comportement :
 *   - Si la variable d'environnement LHCI_URL est définie, la config cible
 *     cette URL réelle sans démarrer de serveur local (plus représentatif).
 *   - Sinon, fallback vers localhost:4173 avec `npm run preview` (comportement
 *     par défaut, conservé pour les PR sans URL de preview disponible).
 *
 * Entrées (variables d'environnement) :
 *   LHCI_URL            — URL de preview réelle (optionnel)
 *   LHCI_CONFIG_SOURCE  — chemin vers lighthouserc.json source (défaut: ../lighthouserc.json)
 *   LHCI_CONFIG_OUTPUT  — chemin de sortie de la config générée (défaut: /tmp/lhcirc.json)
 *
 * Usage : node scripts/prepare-lighthouse-config.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceFile = process.env.LHCI_CONFIG_SOURCE
  || path.resolve(__dirname, '..', '..', 'lighthouserc.json');
const outputFile = process.env.LHCI_CONFIG_OUTPUT || '/tmp/lhcirc.json';
const targetUrl  = process.env.LHCI_URL || '';

if (!fs.existsSync(sourceFile)) {
  console.error('❌  Fichier source introuvable : ' + sourceFile);
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

if (targetUrl) {
  // Real preview URL — no local server needed
  cfg.ci.collect.url = [targetUrl];
  delete cfg.ci.collect.startServerCommand;
  delete cfg.ci.collect.startServerReadyTimeout;
  console.log('🌐 Lighthouse → URL preview : ' + targetUrl);
} else {
  // Local fallback with preview server
  const localUrl = (cfg.ci.collect.url && cfg.ci.collect.url[0]) || 'http://localhost:4173';
  cfg.ci.collect.url = [localUrl];
  console.log('🖥️  Lighthouse → serveur local : ' + localUrl);
}

fs.writeFileSync(outputFile, JSON.stringify(cfg, null, 2));
console.log('✅ Config Lighthouse générée dans : ' + outputFile);
