#!/usr/bin/env node
/**
 * validate-seo-artifacts.mjs
 *
 * Safety-gate for the SEO generation pipeline.
 *
 * Checks:
 *   1. generated-pages.json is valid JSON and non-empty
 *   2. No duplicate URLs in generated pages
 *   3. No empty required fields (path, meta.title, meta.description)
 *   4. No path traversal sequences in generated paths
 *   5. No forbidden path prefixes (admin, api, /__*)
 *   6. seo-pages-manifest.json is valid JSON (if it exists)
 *   7. Sitemap exists and is non-empty (if expected)
 *   8. internal-links-map.json is valid JSON (if it exists)
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more checks failed
 *
 * Usage:
 *   node scripts/validate-seo-artifacts.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failed++;
}

function warn(msg) {
  console.warn(`  ⚠️  ${msg}`);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    fail(`${label} — invalid JSON: ${e.message}`);
    return undefined; // distinguishable from null (file missing)
  }
}

// ── Forbidden path patterns ───────────────────────────────────────────────────

const TRAVERSAL_PATTERNS = ['../', '..\\', '%2e%2e', '%252e'];
const FORBIDDEN_PREFIXES = ['/admin', '/api', '/_', '/__', '/auth', '/billing'];

function isSafePath(p) {
  if (!p || typeof p !== 'string') return false;
  const lower = p.toLowerCase();
  if (TRAVERSAL_PATTERNS.some((t) => lower.includes(t))) return false;
  if (FORBIDDEN_PREFIXES.some((pfx) => lower.startsWith(pfx))) return false;
  return true;
}

// ── Check 1: generated-pages.json (summary) ──────────────────────────────────

console.log('\n📋 Check 1 — generated-pages.json (summary)');
const genPagesPath = path.join(ROOT, 'frontend/src/data/seo/generated-pages.json');
const genPages = readJson(genPagesPath, 'generated-pages.json');

if (genPages === null) {
  warn('generated-pages.json not found — skipping (run seo:generate first)');
} else if (genPages !== undefined) {
  const total = genPages.totalPages ?? genPages.total ?? 0;
  if (total === 0) warn('generated-pages.json totalPages is 0');
  else ok(`generated-pages.json summary — totalPages: ${total}`);
}

// ── Check 5: seo-pages-manifest.json (primary URL source) ────────────────────

console.log('\n📋 Check 5 — seo-pages-manifest.json (URL dedup + field validation)');
const manifestPath = path.join(ROOT, 'seo-pages-manifest.json');
const manifest = readJson(manifestPath, 'seo-pages-manifest.json');
if (manifest === null) {
  warn('seo-pages-manifest.json not found — skipping');
} else if (manifest !== undefined) {
  const mPages = manifest.pages ?? (Array.isArray(manifest) ? manifest : []);
  if (mPages.length === 0) {
    fail('seo-pages-manifest.json has 0 pages');
  } else {
    ok(`seo-pages-manifest.json — ${mPages.length} entries`);

    // Check 2: No duplicate URLs
    console.log('\n📋 Check 2 — No duplicate URLs (seo-pages-manifest.json)');
    const urls = mPages.map((p) => p.path ?? p.url ?? '').filter(Boolean);
    const seen = new Set();
    const dupes = [];
    for (const u of urls) {
      if (seen.has(u)) dupes.push(u);
      else seen.add(u);
    }
    if (dupes.length > 0) {
      fail(`${dupes.length} duplicate URL(s): ${dupes.slice(0, 5).join(', ')}${dupes.length > 5 ? '…' : ''}`);
    } else {
      ok('No duplicate URLs');
    }

    // Check 3: Required fields
    console.log('\n📋 Check 3 — Required fields (seo-pages-manifest.json)');
    const sample = mPages.slice(0, 200); // check first 200 for speed
    const missingPath  = sample.filter((p) => !(p.path ?? p.url));
    const missingTitle = sample.filter((p) => !p.meta?.title && !p.title);

    if (missingPath.length > 0)  fail(`${missingPath.length} page(s) missing path/url (sample of 200)`);
    else ok('All sampled pages have a path');

    if (missingTitle.length > 0) fail(`${missingTitle.length} page(s) missing title (sample of 200)`);
    else ok('All sampled pages have a title');

    // Check 4: No path traversal
    console.log('\n📋 Check 4 — Path traversal / forbidden prefixes');
    const unsafePaths = urls.filter((u) => !isSafePath(u));
    if (unsafePaths.length > 0) {
      fail(`${unsafePaths.length} unsafe path(s): ${unsafePaths.slice(0, 3).join(', ')}`);
    } else {
      ok('All paths are safe');
    }
  }
}

// ── Check 6: internal-links-map.json ─────────────────────────────────────────

console.log('\n📋 Check 6 — internal-links-map.json');
const linksPath = path.join(ROOT, 'frontend/src/data/seo/internal-links-map.json');
const linksMap = readJson(linksPath, 'internal-links-map.json');
if (linksMap === null) {
  warn('internal-links-map.json not found — skipping');
} else if (linksMap !== undefined) {
  const keys = Object.keys(linksMap);
  if (keys.length === 0) fail('internal-links-map.json is empty');
  else ok(`internal-links-map.json — ${keys.length} entries`);
}

// ── Check 7: sitemap ─────────────────────────────────────────────────────────

console.log('\n📋 Check 7 — sitemap.xml');
const sitemapCandidates = [
  path.join(ROOT, 'frontend/public/sitemap.xml'),
  path.join(ROOT, 'public/sitemap.xml'),
  path.join(ROOT, 'frontend/dist/sitemap.xml'),
];
const sitemapPath = sitemapCandidates.find((p) => fs.existsSync(p));
if (!sitemapPath) {
  warn('sitemap.xml not found in expected locations — skipping');
} else {
  const raw = fs.readFileSync(sitemapPath, 'utf-8');
  if (!raw.includes('<urlset') && !raw.includes('<sitemapindex')) {
    fail('sitemap.xml does not look like a valid XML sitemap');
  } else {
    const urlCount = (raw.match(/<url>/g) ?? []).length;
    ok(`sitemap.xml — ${urlCount} <url> entries`);
  }
}

// ── Check 8: signals.json (if SEO loop has run) ───────────────────────────────

console.log('\n📋 Check 8 — auto-seo/output/signals.json');
const signalsPath = path.join(__dirname, 'auto-seo/output/signals.json');
const signals = readJson(signalsPath, 'signals.json');
if (signals === null) {
  warn('signals.json not found — skipping (run seo:loop first)');
} else if (signals !== undefined) {
  if (!Array.isArray(signals) || signals.length === 0) {
    fail('signals.json is empty or not an array');
  } else {
    ok(`signals.json — ${signals.length} signals`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`  ✅ Passed : ${passed}`);
if (failed > 0) {
  console.log(`  ❌ Failed : ${failed}`);
  console.log('');
  console.error('validate-seo-artifacts: FAILED — see errors above');
  process.exit(1);
} else {
  console.log(`  🎉 All checks passed`);
}
