#!/usr/bin/env node
/**
 * auto-content-engine.mjs
 *
 * Génère automatiquement du contenu pour :
 *   - TikTok (hook + voiceover + overlays + hashtags)
 *   - Facebook / WhatsApp (posts viraux — 3 variantes par combo)
 *   - WhatsApp digest hebdomadaire (top 5 économies)
 *   - Pages SEO (product × territory + comparaison × territory)
 *
 * Usage :
 *   node scripts/auto-content-engine.mjs
 *
 * Sortie :
 *   scripts/auto-content-engine-output.json
 *
 * Aucune dépendance externe — Node.js standard uniquement.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ─────────────────────────────────────────────────────────────

const LANDING_URL = 'https://akiprisaye.fr/landing';
const SITE_URL    = 'https://akiprisaye.fr';

const PRODUCTS = [
  {
    name:    'Coca-Cola 1,5 L',
    barcode: '5000112637922',
    prices:  { Carrefour: 2.85, 'E.Leclerc': 2.49, 'Super U': 2.69 },
  },
  {
    name:    'Lait demi-écrémé 1 L',
    barcode: '3274080005003',
    prices:  { Carrefour: 1.29, 'E.Leclerc': 1.09, 'Super U': 1.19 },
  },
  {
    name:    'Riz basmati 1 kg',
    barcode: '3760020504056',
    prices:  { Carrefour: 3.49, 'E.Leclerc': 2.99, 'Super U': 3.19 },
  },
  {
    name:    'Huile tournesol 1 L',
    barcode: '3501560001665',
    prices:  { Carrefour: 2.35, 'E.Leclerc': 1.99, 'Super U': 2.15 },
  },
  {
    name:    'Beurre doux 250 g',
    barcode: '3228857000166',
    prices:  { Carrefour: 3.25, 'E.Leclerc': 2.85, 'Super U': 3.05 },
  },
  {
    name:    'Farine de blé T45 1 kg',
    barcode: '3596710413965',
    prices:  { Carrefour: 1.59, 'E.Leclerc': 1.29, 'Super U': 1.45 },
  },
  {
    name:    'Sucre en poudre 1 kg',
    barcode: '3017614096071',
    prices:  { Carrefour: 1.89, 'E.Leclerc': 1.59, 'Super U': 1.75 },
  },
  {
    name:    'Yaourt nature x8',
    barcode: '3033490008016',
    prices:  { Carrefour: 2.45, 'E.Leclerc': 1.99, 'Super U': 2.25 },
  },
  {
    name:    'Pâtes spaghetti 500 g',
    barcode: '3174630009869',
    prices:  { Carrefour: 1.35, 'E.Leclerc': 0.99, 'Super U': 1.19 },
  },
  {
    name:    'Savon liquide 500 ml',
    barcode: '3574661530895',
    prices:  { Carrefour: 2.99, 'E.Leclerc': 2.39, 'Super U': 2.75 },
  },
];

const TERRITORIES = [
  {
    code:     'GP',
    label:    'Guadeloupe',
    hashtags: ['#Guadeloupe', '#Gwadloup', '#VieChereGuadeloupe', '#971'],
  },
  {
    code:     'MQ',
    label:    'Martinique',
    hashtags: ['#Martinique', '#VieChèreMartinique', '#PrixMartinique', '#972'],
  },
];

// ── Price helpers ─────────────────────────────────────────────────────────────

function bestPrice(prices)   { return Math.min(...Object.values(prices)); }
function worstPrice(prices)  { return Math.max(...Object.values(prices)); }
function savings(prices)     { return +(worstPrice(prices) - bestPrice(prices)).toFixed(2); }
function savingsPct(prices)  { return Math.round((savings(prices) / worstPrice(prices)) * 100); }

function bestRetailer(prices) {
  return Object.entries(prices).sort((a, b) => a[1] - b[1])[0][0];
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Deterministic variant picker — no randomness, reproducible output. */
function pick(arr, product, territory) {
  const key = product.name.length + territory.code.length + arr.length;
  return arr[key % arr.length];
}

// ── TikTok content ────────────────────────────────────────────────────────────

function generateTikTokScript(product, territory) {
  const best   = bestRetailer(product.prices);
  const bestP  = bestPrice(product.prices);
  const worstP = worstPrice(product.prices);
  const save   = savings(product.prices);
  const pct    = savingsPct(product.prices);

  const hooks = [
    `Pourquoi ${product.name} coûte plus cher en ${territory.label} ?`,
    `${product.name} : tu paies ${pct}% trop cher sans le savoir`,
    `Économisez ${save.toFixed(2)}€ sur ${product.name} en ${territory.label}`,
    `Même produit. Prix différent. ${product.name} en ${territory.label} →`,
  ];

  const hook = pick(hooks, product, territory);

  return {
    hook,
    voiceover: [
      `${product.name} en ${territory.label}.`,
      `Chez le plus cher : ${worstP.toFixed(2)} euros.`,
      `Chez le moins cher : ${bestP.toFixed(2)} euros chez ${best}.`,
      `Même produit. ${save.toFixed(2)} euros d'écart.`,
      `Vérifiez pour vos courses sur A Ki Pri Sa Yé point fr.`,
    ].join(' '),
    textOverlays: [
      { line: product.name,                   style: 'title' },
      { line: `❌ ${worstP.toFixed(2)}€`,      style: 'bad'   },
      { line: `✅ ${bestP.toFixed(2)}€ chez ${best}`, style: 'good' },
      { line: `Économisez ${save.toFixed(2)}€`, style: 'cta'  },
    ],
    hashtags: [
      ...territory.hashtags,
      '#VieChère',
      '#Économies',
      '#Courses',
      '#Comparateur',
      '#AkiPriSaYé',
    ].join(' '),
    cta:        `👉 ${LANDING_URL}`,
    product:    product.name,
    territory:  territory.label,
    savingsEur: save,
    savingsPct: pct,
    productUrl: `${SITE_URL}/${territory.code.toLowerCase()}/produit/${slugify(product.name)}`,
  };
}

// ── Facebook / WhatsApp posts ─────────────────────────────────────────────────

function generateSocialPost(product, territory) {
  const best   = bestRetailer(product.prices);
  const bestP  = bestPrice(product.prices);
  const worstP = worstPrice(product.prices);
  const save   = savings(product.prices);
  const pct    = savingsPct(product.prices);

  const variants = [
    // Casual — recommended for family/friends groups
    [
      `Tu paies trop cher tes courses sans le savoir.`,
      ``,
      `J'ai trouvé un outil qui compare les prix entre Carrefour, Leclerc, Super U en ${territory.label}.`,
      ``,
      `${product.name} :`,
      `${worstP.toFixed(2)}€ → ${bestP.toFixed(2)}€ chez ${best}`,
      ``,
      `Même produit. ${save.toFixed(2)}€ d'écart.`,
      ``,
      `👉 Vérifie pour tes courses ici :`,
      LANDING_URL,
      ``,
      `Dis-moi si ça vaut le coup 👀`,
    ].join('\n'),

    // Aggressive — recommended for "bons plans" groups
    [
      `Exemple réel en ${territory.label} :`,
      ``,
      `${product.name} :`,
      `❌ ${worstP.toFixed(2)}€ au plus cher`,
      `✅ ${bestP.toFixed(2)}€ chez ${best}`,
      ``,
      `Même produit. Prix différent.`,
      ``,
      `👉 Vérifie pour tes courses :`,
      LANDING_URL,
      ``,
      `Tu vas être surpris.`,
    ].join('\n'),

    // FOMO — recommended for Facebook pages
    [
      `⚠️ Les prix changent tous les jours en ${territory.label}.`,
      ``,
      `Ne payez plus ${pct}% trop cher sans le savoir.`,
      ``,
      `Les économies disponibles aujourd'hui :`,
      `${product.name} → -${save.toFixed(2)}€ chez ${best}`,
      ``,
      `+1 000 comparaisons effectuées cette semaine.`,
      ``,
      `👉 ${LANDING_URL}`,
    ].join('\n'),
  ];

  const primary = pick(variants, product, territory);
  const secondary = variants[(variants.indexOf(primary) + 1) % variants.length];

  return {
    post:          primary,
    postAlternate: secondary,
    product:       product.name,
    territory:     territory.label,
    savingsEur:    save,
    savingsPct:    pct,
    bestRetailer:  best,
    bestPrice:     bestP,
    landingUrl:    LANDING_URL,
    targetGroups: [
      `${territory.label} bons plans`,
      `Vie chère ${territory.label}`,
      `Courses pas cher Antilles`,
    ],
  };
}

// ── WhatsApp weekly digest ────────────────────────────────────────────────────

function generateWhatsAppDigest(territory) {
  const ranked = PRODUCTS.map((p) => ({
    name:      p.name,
    savings:   savings(p.prices),
    best:      bestRetailer(p.prices),
    bestPrice: bestPrice(p.prices),
  })).sort((a, b) => b.savings - a.savings);

  const top5  = ranked.slice(0, 5);
  const lines = top5
    .map((p, i) =>
      `${i + 1}. ${p.name} → -${p.savings.toFixed(2)}€ chez ${p.best} (${p.bestPrice.toFixed(2)}€)`,
    )
    .join('\n');

  return {
    message: [
      `🔥 Top 5 prix les moins chers cette semaine en ${territory.label} :`,
      ``,
      lines,
      ``,
      `👉 Voir tous les prix :`,
      LANDING_URL,
    ].join('\n'),
    territory:   territory.label,
    generatedAt: new Date().toISOString(),
  };
}

// ── SEO page specs ────────────────────────────────────────────────────────────

function generateSeoPages(product, territory) {
  const slug   = slugify(product.name);
  const best   = bestRetailer(product.prices);
  const bestP  = bestPrice(product.prices);
  const worstP = worstPrice(product.prices);
  const save   = savings(product.prices);
  const year   = new Date().getFullYear();

  return [
    // Product page
    {
      path:        `/${territory.code.toLowerCase()}/produit/${slug}`,
      type:        'product',
      title:       `Prix ${product.name} en ${territory.label} ${year} — Comparez maintenant`,
      description: `Comparez le prix de ${product.name} entre Carrefour, E.Leclerc et Super U en ${territory.label}. Économisez jusqu'à ${save.toFixed(2)}€. Données actualisées.`,
      h1:          `${product.name} en ${territory.label} : meilleur prix ${bestP.toFixed(2)}€ chez ${best}`,
      faq: [
        {
          q: `Où trouver ${product.name} moins cher en ${territory.label} ?`,
          a: `Chez ${best} à ${bestP.toFixed(2)}€ — ${save.toFixed(2)}€ moins cher que le prix le plus élevé.`,
        },
        {
          q: `Combien coûte ${product.name} en ${territory.label} ?`,
          a: `Entre ${bestP.toFixed(2)}€ et ${worstP.toFixed(2)}€ selon l'enseigne. Utilisez notre comparateur pour voir tous les prix en temps réel.`,
        },
        {
          q: `Pourquoi ${product.name} est plus cher en ${territory.label} qu'en métropole ?`,
          a: `L'octroi de mer et les coûts logistiques expliquent l'écart de prix. Notre comparateur vous aide à trouver le meilleur prix local.`,
        },
      ],
    },
    // Comparison page (moins-cher)
    {
      path:        `/${territory.code.toLowerCase()}/comparer/${slug}-moins-cher`,
      type:        'comparison',
      title:       `${product.name} moins cher en ${territory.label} — Comparatif ${year}`,
      description: `Où acheter ${product.name} moins cher en ${territory.label} ? Comparatif Carrefour, E.Leclerc, Super U. Jusqu'à ${save.toFixed(2)}€ d'économies.`,
      h1:          `${product.name} : où est-il le moins cher en ${territory.label} ?`,
      faq: [
        {
          q: `Quelle enseigne vend ${product.name} le moins cher en ${territory.label} ?`,
          a: `${best} propose actuellement le meilleur prix à ${bestP.toFixed(2)}€.`,
        },
        {
          q: `Quelle est la différence de prix pour ${product.name} en ${territory.label} ?`,
          a: `Jusqu'à ${save.toFixed(2)}€ d'écart entre les enseignes locales, soit ${savingsPct(product.prices)}% d'économies.`,
        },
      ],
    },
  ];
}

// ── Exported API (for programmatic use by ai-growth-system.mjs etc.) ─────────

/**
 * Generate ready-to-use content for a single product.
 *
 * @param {{ name: string, bestRetailer: string, bestPrice: number,
 *            worstRetailer: string, worstPrice: number, delta: number }} product
 * @returns {{ tiktok: object, facebook: string, whatsapp: string,
 *             savingsEur: number, savingsPct: number }}
 */
export function generateContent({ name, bestRetailer, bestPrice, worstRetailer, worstPrice, delta }) {
  const save = delta ?? (worstPrice - bestPrice);
  const pct  = worstPrice > 0 ? Math.round((save / worstPrice) * 100) : 0;

  return {
    tiktok: {
      hook:      `${name}: économisez ${save.toFixed(2)}€ en choisissant ${bestRetailer}`,
      voiceover: [
        `${name}.`,
        `Chez ${worstRetailer} : ${(+worstPrice).toFixed(2)} euros.`,
        `Chez ${bestRetailer} : ${(+bestPrice).toFixed(2)} euros.`,
        `Même produit. ${save.toFixed(2)} euros d'écart.`,
        `Vérifiez sur A Ki Pri Sa Yé point fr.`,
      ].join(' '),
      textOverlays: [
        { line: name,                                      style: 'title' },
        { line: `❌ ${(+worstPrice).toFixed(2)}€`,         style: 'bad'   },
        { line: `✅ ${(+bestPrice).toFixed(2)}€ chez ${bestRetailer}`, style: 'good' },
        { line: `Économisez ${save.toFixed(2)}€`,          style: 'cta'   },
      ],
      cta:        `👉 ${LANDING_URL}`,
      savingsEur: save,
      savingsPct: pct,
    },
    facebook: [
      `Exemple réel en Outre-mer :`,
      ``,
      `${name} :`,
      `❌ ${(+worstPrice).toFixed(2)}€ chez ${worstRetailer}`,
      `✅ ${(+bestPrice).toFixed(2)}€ chez ${bestRetailer}`,
      ``,
      `Même produit. Prix différent.`,
      ``,
      `👉 Vérifie pour tes courses :`,
      LANDING_URL,
    ].join('\n'),
    whatsapp:   `🔥 Bon plan : ${name} → -${save.toFixed(2)}€ chez ${bestRetailer} (${(+bestPrice).toFixed(2)}€)\n👉 ${LANDING_URL}`,
    savingsEur: save,
    savingsPct: pct,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const output = {
  generatedAt: new Date().toISOString(),
  tiktok:      [],
  facebook:    [],
  whatsapp:    [],
  seo:         [],
};

for (const territory of TERRITORIES) {
  for (const product of PRODUCTS) {
    output.tiktok.push(generateTikTokScript(product, territory));
    output.facebook.push(generateSocialPost(product, territory));
    output.seo.push(...generateSeoPages(product, territory));
  }
  output.whatsapp.push(generateWhatsAppDigest(territory));
}

const outPath = path.join(__dirname, 'auto-content-engine-output.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log('✔ auto-content-engine complete:');
console.log(`  TikTok scripts   : ${output.tiktok.length}`);
console.log(`  Facebook posts   : ${output.facebook.length}`);
console.log(`  WhatsApp digests : ${output.whatsapp.length}`);
console.log(`  SEO page specs   : ${output.seo.length}`);
console.log(`  Output → ${outPath}`);
