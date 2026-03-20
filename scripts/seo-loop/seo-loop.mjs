#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const step of ['collect-metrics', 'analyze-pages', 'generate-actions', 'apply-actions']) {
  console.log(`\n▶ ${step}`);
  execSync(`node ${path.join(__dirname, step + '.mjs')}`, { stdio: 'inherit' });
}
console.log('\n✅ SEO loop complete.');
