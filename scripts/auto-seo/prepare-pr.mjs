/**
 * prepare-pr.mjs — Dry-run PR prep script. Review-only by default.
 * With --apply flag: creates branch and stages whitelisted files (no push).
 * Usage: node prepare-pr.mjs [--apply]
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'output');

const WHITELIST = [
  'frontend/src/data/seo/generated-pages.json',
  'frontend/src/data/seo/internal-links-map.json',
  'frontend/src/data/seo/generated-content.json',
  'seo-pages-manifest.json',
  'public/sitemap.xml',
];

const APPLY = process.argv.includes('--apply');

// Read PR metadata
const title = fs.readFileSync(path.join(OUT_DIR, 'pr-title.txt'), 'utf-8').trim();
const body = fs.readFileSync(path.join(OUT_DIR, 'pr-body.md'), 'utf-8');
const patches = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'patch-plan.json'), 'utf-8'));

// Validate patch files against whitelist
const invalidFiles = patches.filter((p) => !WHITELIST.includes(p.file));
if (invalidFiles.length > 0) {
  console.error('[prepare-pr] ❌ Non-whitelisted files found in patch plan:');
  invalidFiles.forEach((p) => console.error(`   - ${p.file}`));
  process.exit(1);
}

const filesToPatch = [...new Set(patches.map((p) => p.file))];

// Date for branch name
const date = new Date().toISOString().slice(0, 10);
const branchName = `auto-seo/weekly-optimization-${date}`;

// Print dry-run summary
console.log('\n[prepare-pr] 📋 PR Plan (dry-run):');
console.log(`   Branch: ${branchName}`);
console.log(`   Title:  ${title}`);
console.log(`   Files to patch (${filesToPatch.length}):`);
filesToPatch.forEach((f) => {
  const count = patches.filter((p) => p.file === f).length;
  const exists = fs.existsSync(path.join(process.cwd(), f));
  console.log(`     - ${f} (${count} change(s))${exists ? '' : ' ⚠️  file does not yet exist'}`);
});

// Write pr-metadata.json
const metadata = {
  branchName,
  title,
  body,
  filesToPatch,
  createdAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT_DIR, 'pr-metadata.json'), JSON.stringify(metadata, null, 2));
console.log('\n[prepare-pr] ✅ PR plan ready. Run with --apply to create branch and commit.');

if (!APPLY) {
  process.exit(0);
}

// --apply: create branch, stage whitelisted files that exist, commit
console.log('\n[prepare-pr] 🚀 Applying...');

try {
  const r = spawnSync('git', ['checkout', '-b', branchName], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('checkout -b failed');
} catch {
  console.warn(`[prepare-pr] Branch ${branchName} may already exist, trying to switch.`);
  spawnSync('git', ['checkout', branchName], { stdio: 'inherit' });
}

const existingFiles = filesToPatch.filter((f) => fs.existsSync(path.join(process.cwd(), f)));
if (existingFiles.length > 0) {
  spawnSync('git', ['add', '--', ...existingFiles], { stdio: 'inherit' });
  const commitMessage =
    `${title}\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;
  spawnSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
  console.log(`[prepare-pr] ✅ Committed ${existingFiles.length} file(s) on branch ${branchName}`);
} else {
  console.log('[prepare-pr] ℹ️  No whitelisted files exist yet to stage. Commit skipped.');
}

console.log('[prepare-pr] ℹ️  No git push performed. Review branch before pushing.');
