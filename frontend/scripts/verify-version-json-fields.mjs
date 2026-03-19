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
 *   6. buildUrl ends with '/actions/runs/{runId}'.
 *   7. runId is a numeric string.
 *   8. sha256 is a valid 64-character hex digest.
 *   9. branch matches the GITHUB_REF_NAME environment variable (CI only).
 *
 * Run:  node scripts/verify-version-json-fields.mjs
 * In CI the workflow passes GITHUB_REF_NAME via env: so check 9 is active.
 * Locally GITHUB_REF_NAME is typically unset, so check 9 is skipped.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_PATH = resolve(process.cwd(), 'dist/version.json');

function fail(message, extra) {
  console.error(`❌ ${message}`);
  if (extra) {
    console.error(extra);
  }
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
const required = ['commit', 'shortCommit', 'branch', 'runId', 'buildUrl', 'sha256'];
const missing = required.filter((f) => {
  const value = v[f];
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 'unknown' ||
    value === 'local' ||
    value === 'dev' ||
    value === false
  );
});
if (missing.length > 0) {
  fail(
    `dist/version.json is missing or has placeholder values for: ${missing.join(', ')}`,
    `Content: ${JSON.stringify(v, null, 2)}`,
  );
}

// 3. commit length
if (typeof v.commit !== 'string' || v.commit.length < 7) {
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
  typeof v.buildUrl !== 'string' ||
  !v.buildUrl.startsWith('https://github.com/') ||
  !v.buildUrl.includes('/actions/runs/')
) {
  fail(
    `dist/version.json incoherence: buildUrl="${v.buildUrl}" is not a valid GitHub Actions run URL`,
  );
}

// 6. buildUrl must end with /actions/runs/{runId}
if (!String(v.buildUrl).endsWith(`/actions/runs/${v.runId}`)) {
  fail(
    `dist/version.json incoherence: buildUrl="${v.buildUrl}" does not end with /actions/runs/${v.runId}`,
  );
}

// 7. runId must be numeric
if (!/^\d+$/.test(String(v.runId))) {
  fail(
    `dist/version.json incoherence: runId="${v.runId}" is not numeric`,
  );
}

// 8. sha256 must be a valid 64-character hex digest
if (!/^[a-f0-9]{64}$/i.test(String(v.sha256))) {
  fail(
    `dist/version.json incoherence: sha256="${v.sha256}" is not a valid SHA-256 hex digest`,
  );
}

// 9. branch must match GITHUB_REF_NAME (CI only)
const expectedBranch = process.env.GITHUB_REF_NAME;
if (expectedBranch && v.branch !== expectedBranch) {
  fail(
    `dist/version.json incoherence: branch="${v.branch}" !== github.ref_name="${expectedBranch}"`,
  );
}

// All checks passed
console.log('✅ dist/version.json mirror-check passed');
console.log(`✅ shortCommit="${v.shortCommit}" matches commit.slice(0,7)`);
console.log('✅ buildUrl is a valid GitHub Actions run URL');
console.log(`✅ runId="${v.runId}" is numeric`);
console.log(`✅ sha256="${v.sha256}" is valid`);
if (expectedBranch) {
  console.log(`✅ branch="${v.branch}" matches github.ref_name`);
}
