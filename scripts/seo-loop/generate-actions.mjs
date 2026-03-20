#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { pages } = JSON.parse(fs.readFileSync(path.join(__dirname, 'page-scores.json'), 'utf8'));

const actionable = pages.filter(p => p.action !== 'MONITOR').slice(0, 20);

function suggestTitle(p) {
  const slug = (p.path || '').split('/').pop() ?? '';
  const parts = slug.split('-');
  const territory = parts[parts.length - 1] ?? '';
  const product = parts.slice(0, -1).join(' ');
  return `Prix ${product} en ${territory} 2026 — Comparez maintenant`;
}

const actions = actionable.map(p => ({
  type: p.action,
  path: p.path,
  currentTitle: p.title || p.path,
  suggestedTitle: p.action === 'IMPROVE_TITLE' ? suggestTitle(p) : p.title,
  priority: p.score > 5 ? 'high' : 'medium',
}));

const plan = { generatedAt: new Date().toISOString(), totalActions: actions.length, actions };
const outPath = path.join(__dirname, 'action-plan.json');
fs.writeFileSync(outPath, JSON.stringify(plan, null, 2));
console.log(`✔ Generated ${actions.length} actions → ${outPath}`);
