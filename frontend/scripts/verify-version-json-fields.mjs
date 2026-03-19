/**
 * verify-version-json-fields.mjs
 *
 * Mirror check: validates that dist/version.json was produced correctly by
 * generate-version.mjs and contains coherent, non-placeholder values.
 *
 * Checks performed:
 *   1. File is valid JSON.
 *   2. Required fields are present and not placeholder values
 *      (null, 'unknown', 'local', 'dev', falsy).
 *   3. commit is at least 7 characters long.
 *   4. shortCommit === commit.slice(0, 7).
 *   5. buildUrl starts with 'https://github.com/' and contains '/actions/runs/'.
 *   6. runId is a numeric string.
 *   7. branch matches the GITHUB_REF_NAME environment variable (CI only).
 *
 * Run:  node scripts/verify-version-json-fields.mjs
 * In CI the workflow passes GITHUB_REF_NAME via env: so check 7 is active.
 * Locally GITHUB_REF_NAME is typically unset, so check 7 is skipped.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_PATH = resolve(process.cwd(), 'dist/version.json');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// 1. Parse JSON
let raw;
try {
  raw = readFileSync(VERSION_PATH, 'utf8');
} catch {
  fail(`dist/version.json not found at ${VERSION_PATH}`);
}

let v;
try {
  v = JSON.parse(raw);
} catch {
  fail('dist/version.json is not valid JSON');
}

// 2. Required fields — must be present and not placeholder values
const PLACEHOLDERS = new Set([null, 'unknown', 'local', 'dev']);
const required = ['commit', 'shortCommit', 'branch', 'runId', 'buildUrl'];
const missing = required.filter(
  (f) => !v[f] || PLACEHOLDERS.has(v[f]),
);
if (missing.length > 0) {
  console.error('Content:', JSON.stringify(v, null, 2));
  fail(
    'dist/version.json is missing or has placeholder values for: ' +
      missing.join(', '),
  );
}

// 3. commit length
if (v.commit.length < 7) {
  fail(
    `dist/version.json incoherence: commit "${v.commit}" is shorter than 7 characters`,
  );
}

// 4. shortCommit === commit.slice(0, 7)
if (v.shortCommit !== v.commit.slice(0, 7)) {
  fail(
    `dist/version.json incoherence: shortCommit="${v.shortCommit}" !== commit.slice(0,7)="${v.commit.slice(0, 7)}"`,
  );
}

// 5. buildUrl must be a valid GitHub Actions run URL
if (
  !v.buildUrl.startsWith('https://github.com/') ||
  !v.buildUrl.includes('/actions/runs/')
) {
  fail(
    `dist/version.json incoherence: buildUrl="${v.buildUrl}" is not a valid GitHub Actions run URL`,
  );
}

// 6. runId must be numeric
if (!/^\d+$/.test(String(v.runId))) {
  fail(
    `dist/version.json incoherence: runId="${v.runId}" is not numeric`,
  );
}

// 7. branch must match GITHUB_REF_NAME (CI only)
const expectedBranch = process.env.GITHUB_REF_NAME;
if (expectedBranch && v.branch !== expectedBranch) {
  fail(
    `dist/version.json incoherence: branch="${v.branch}" !== github.ref_name="${expectedBranch}"`,
  );
}

// All checks passed
console.log(
  '✅ dist/version.json contains all required fields: ' + required.join(', '),
);
console.log(`✅ shortCommit="${v.shortCommit}" matches commit.slice(0,7)`);
console.log('✅ buildUrl is a valid GitHub Actions run URL');
console.log(`✅ runId="${v.runId}" is numeric`);
if (expectedBranch) {
  console.log(`✅ branch="${v.branch}" matches github.ref_name`);
}
