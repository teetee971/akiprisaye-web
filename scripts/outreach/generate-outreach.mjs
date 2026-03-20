#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));
const template = fs.readFileSync(path.join(__dirname, 'templates/first-contact.txt'), 'utf8');

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

const output = targets.map(t => ({
  ...t,
  subject: `Partenariat éditorial — données prix alimentaires ${t.territory.toUpperCase()}`,
  message: render(template, {
    territory: t.territory.toUpperCase(),
    anchorSuggestion: t.anchorSuggestion,
    targetPage: t.targetPage,
    domain: t.domain,
    name: t.name,
  }),
}));

const outPath = path.join(__dirname, 'outreach-generated.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`✔ Generated ${output.length} outreach messages → ${outPath}`);
