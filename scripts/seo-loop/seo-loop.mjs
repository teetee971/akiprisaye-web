#!/usr/bin/env node
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_STEPS = ['collect-metrics', 'analyze-pages', 'generate-actions', 'apply-actions'];

for (const step of ALLOWED_STEPS) {
  console.log(`\n▶ ${step}`);
  execFileSync('node', [path.join(__dirname, step + '.mjs')], { stdio: 'inherit' });
}
console.log('\n✅ SEO loop complete.');
