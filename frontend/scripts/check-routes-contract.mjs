import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const appSource = readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
const hubSource = readFileSync(path.join(ROOT, 'src/pages/ComparateursHub.tsx'), 'utf8');

const appRoutes = new Set();
for (const m of appSource.matchAll(/<Route\s+path="([^"]+)"/g)) {
  const route = m[1].startsWith('/') ? m[1] : `/${m[1]}`;
  appRoutes.add(route);
}

const hubRoutes = new Set();
for (const m of hubSource.matchAll(/path:\s*'([^']+)'/g)) {
  const p = m[1].trim();
  if (!p.startsWith('/')) continue;
  hubRoutes.add(p);
}

const missingInApp = [...hubRoutes].filter((r) => !appRoutes.has(r));

if (missingInApp.length > 0) {
  console.error('❌ Routes exposées par ComparateursHub absentes de App.tsx :');
  for (const r of missingInApp.sort()) console.error(`  - ${r}`);
  process.exit(1);
}

console.log(`✅ Route contract OK (${hubRoutes.size} routes ComparateursHub mappées dans App.tsx).`);
