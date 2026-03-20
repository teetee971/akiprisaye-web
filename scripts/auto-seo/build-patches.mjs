/**
 * build-patches.mjs — Convert recommendations into a reviewable patch plan.
 * Reads scripts/auto-seo/output/recommendations.json.
 * Writes scripts/auto-seo/output/patch-plan.json.
 * Only targets files in the WHITELIST — never writes outside it.
 */

import fs from 'fs';
import path from 'path';
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

const TYPE_TO_FILE = {
  IMPROVE_TITLE: 'frontend/src/data/seo/generated-pages.json',
  IMPROVE_META: 'frontend/src/data/seo/generated-pages.json',
  BOOST_LINKING: 'frontend/src/data/seo/internal-links-map.json',
  ENRICH_CONTENT: 'frontend/src/data/seo/generated-content.json',
  DUPLICATE_PAGE: 'frontend/src/data/seo/generated-pages.json',
  BOOST_CTA: 'frontend/src/data/seo/generated-pages.json',
  DEPRIORITIZE: 'seo-pages-manifest.json',
};

const TYPE_TO_CHANGE = {
  IMPROVE_TITLE: 'update',
  IMPROVE_META: 'update',
  BOOST_LINKING: 'update',
  ENRICH_CONTENT: 'update',
  DUPLICATE_PAGE: 'append',
  BOOST_CTA: 'update',
  DEPRIORITIZE: 'update',
};

const TYPE_TO_DESC = {
  IMPROVE_TITLE: (url) => `Update title tag for ${url}`,
  IMPROVE_META: (url) => `Update meta description for ${url}`,
  BOOST_LINKING: (url) => `Add internal links pointing to ${url}`,
  ENRICH_CONTENT: (url) => `Enrich content sections for ${url}`,
  DUPLICATE_PAGE: (url, target) => `Generate new page entry for ${target ?? url + '-new'} based on ${url}`,
  BOOST_CTA: (url) => `Update CTA blocks for ${url}`,
  DEPRIORITIZE: (url) => `Mark ${url} as low-priority in manifest`,
};

const recommendations = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'recommendations.json'), 'utf-8'));

const patches = recommendations.map((rec) => {
  const file = TYPE_TO_FILE[rec.type] ?? 'frontend/src/data/seo/generated-pages.json';
  if (!WHITELIST.includes(file)) {
    console.warn(`[build-patches] Skipping non-whitelisted file: ${file}`);
    return null;
  }
  return {
    file,
    changeType: TYPE_TO_CHANGE[rec.type] ?? 'update',
    description: (TYPE_TO_DESC[rec.type] ?? ((url) => `Update ${url}`))(rec.url, rec.suggestedTarget),
    recommendationType: rec.type,
    targetUrl: rec.url,
  };
}).filter(Boolean);

fs.writeFileSync(path.join(OUT_DIR, 'patch-plan.json'), JSON.stringify(patches, null, 2));
console.log(`[build-patches] ✅ ${patches.length} patches planned across ${new Set(patches.map((p) => p.file)).size} files`);
WHITELIST.forEach((f) => {
  const count = patches.filter((p) => p.file === f).length;
  if (count > 0) console.log(`[build-patches]    ${f}: ${count} patch(es)`);
});
