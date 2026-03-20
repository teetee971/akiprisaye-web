/**
 * generate-recommendations.mjs — Apply rules to produce AutoSeoRecommendation[].
 * Reads signals.json + page-scores.json.
 * Writes scripts/auto-seo/output/recommendations.json.
 * Capped at 20 high-priority and 50 total entries.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'output');

const signals = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'signals.json'), 'utf-8'));
const scores = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'page-scores.json'), 'utf-8'));

const scoreByUrl = Object.fromEntries(scores.map((s) => [s.url, s]));

const TERRITORIES = ['GP', 'MQ', 'RE', 'GF', 'YT'];

function suggestedTerritory(url) {
  const current = TERRITORIES.find((t) => url.includes(`/${t.toLowerCase()}/`));
  const others = TERRITORIES.filter((t) => t !== current);
  return current ? url.replace(`/${current.toLowerCase()}/`, `/${others[0].toLowerCase()}/`) : url + '-mq';
}

/** @type {Array<{type: string; priority: string; url: string; reason: string; expectedImpact?: string; suggestedTarget?: string}>} */
const recommendations = [];

for (const signal of signals) {
  const score = scoreByUrl[signal.url];
  const globalScore = score ? score.globalScore : 0;

  if (signal.impressions > 50 && signal.ctr < 0.015) {
    recommendations.push({
      type: 'IMPROVE_TITLE',
      priority: 'high',
      url: signal.url,
      reason: `CTR de ${(signal.ctr * 100).toFixed(2)}% trop faible malgré ${signal.impressions} impressions`,
      expectedImpact: '+15-30% de clics organiques',
    });
  } else if (signal.impressions > 50 && signal.clicks < 5) {
    recommendations.push({
      type: 'IMPROVE_META',
      priority: 'medium',
      url: signal.url,
      reason: `Seulement ${signal.clicks} clics pour ${signal.impressions} impressions — meta description à optimiser`,
      expectedImpact: '+10% de clics',
    });
  } else if (signal.affiliateClicks > 0 || signal.pageViews > 20) {
    recommendations.push({
      type: 'BOOST_LINKING',
      priority: 'medium',
      url: signal.url,
      reason: `${signal.pageViews} pages vues et ${signal.affiliateClicks} clics affiliés — renforcer le maillage interne`,
      expectedImpact: '+20% de pages vues par session',
    });
  } else if (['pillar', 'category', 'comparison'].includes(signal.pageType) && signal.pageViews < 10) {
    recommendations.push({
      type: 'ENRICH_CONTENT',
      priority: 'medium',
      url: signal.url,
      reason: `Page ${signal.pageType} avec seulement ${signal.pageViews} pages vues — contenu à enrichir`,
      expectedImpact: '+25% d\'engagement',
    });
  } else if (globalScore > 60 && signal.pageViews > 15) {
    recommendations.push({
      type: 'DUPLICATE_PAGE',
      priority: 'high',
      url: signal.url,
      reason: `Score global de ${globalScore.toFixed(1)} et ${signal.pageViews} pages vues — dupliquer vers autre territoire`,
      expectedImpact: 'Nouvelle source de trafic organique',
      suggestedTarget: suggestedTerritory(signal.url),
    });
  } else if (signal.pageViews > 30 && signal.affiliateClicks < 3) {
    recommendations.push({
      type: 'BOOST_CTA',
      priority: 'high',
      url: signal.url,
      reason: `${signal.pageViews} pages vues mais seulement ${signal.affiliateClicks} clics affiliés — optimiser les CTA`,
      expectedImpact: '+40% de conversions affiliées',
    });
  } else if (signal.impressions < 5 && signal.pageViews < 3 && signal.clicks === 0) {
    recommendations.push({
      type: 'DEPRIORITIZE',
      priority: 'low',
      url: signal.url,
      reason: `Faible visibilité : ${signal.impressions} impressions, 0 clics, ${signal.pageViews} pages vues`,
      expectedImpact: 'Libère budget crawl pour pages performantes',
    });
  } else {
    recommendations.push({
      type: 'BOOST_LINKING',
      priority: 'low',
      url: signal.url,
      reason: `Maillage interne à renforcer pour améliorer la découvrabilité`,
      expectedImpact: '+10% de trafic interne',
    });
  }
}

// Cap high-priority to 20
const high = recommendations.filter((r) => r.priority === 'high').slice(0, 20);
const rest = recommendations.filter((r) => r.priority !== 'high');
const capped = [...high, ...rest].slice(0, 50);

fs.writeFileSync(path.join(OUT_DIR, 'recommendations.json'), JSON.stringify(capped, null, 2));

const byPriority = { high: 0, medium: 0, low: 0 };
const byType = {};
for (const r of capped) {
  byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
  byType[r.type] = (byType[r.type] ?? 0) + 1;
}
console.log(`[generate-recommendations] ✅ ${capped.length} recommendations`);
console.log(`[generate-recommendations]    high: ${byPriority.high}, medium: ${byPriority.medium}, low: ${byPriority.low}`);
console.log(`[generate-recommendations]    by type:`, byType);
