#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apply = process.argv.includes('--apply');
const { actions } = JSON.parse(fs.readFileSync(path.join(__dirname, 'action-plan.json'), 'utf8'));

console.log(`\n📋 Action Plan (${apply ? 'APPLY' : 'DRY-RUN'} mode)\n`);
for (const a of actions) {
  console.log(`  [${a.type}] ${a.path}`);
  if (a.type === 'IMPROVE_TITLE') {
    console.log(`    Old: ${a.currentTitle}`);
    console.log(`    New: ${a.suggestedTitle}`);
  }
  if (apply) {
    console.log(`    ✔ Applied (simulated)`);
  }
}
if (!apply) {
  console.log('\n  ℹ Run with --apply to apply changes.');
}
