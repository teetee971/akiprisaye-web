#!/usr/bin/env node
/**
 * enrich-product-images-from-ticket.mjs
 *
 * Pipeline batch d'enrichissement d'images produit à partir d'un ticket de caisse.
 *
 * Usage:
 *   node frontend/scripts/enrich-product-images-from-ticket.mjs \
 *     --input data/tickets/u-express-2026-03-04-products.json \
 *     --output output/
 *
 * Sorties:
 *   output/product-image-import.json      → enregistrements prêts à injecter en base
 *   output/product-image-review-queue.json → produits ambigus / introuvables
 *   output/product-image-report.md         → rapport lisible
 *
 * Architecture:
 *   searchImages()     → appel OpenFoodFacts (ou stub si --dry-run)
 *   scoreCandidate()   → score composite 0–100
 *   chooseBestImage()  → sélection selon seuils
 *   exportImportJson() → écriture product-image-import.json
 *   exportReviewQueue()→ écriture product-image-review-queue.json
 *   exportReport()     → écriture product-image-report.md
 *
 * Règles:
 * - Aucune URL inventée — tout candidat provient d'une source réelle
 * - Score < 60 → reject + review queue
 * - Score 60-79 → accept + needsReview=true
 * - Score >= 80 → auto-accept
 * - Produits ambigus → review queue directe
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const THRESHOLD_AUTO   = 80;
const THRESHOLD_REVIEW = 60;
const OFF_SEARCH_URL   = 'https://world.openfoodfacts.org/cgi/search.pl';
const MAX_CANDIDATES   = 5;

/** Tokens OCR parasites à supprimer lors de la normalisation */
const OCR_NOISE = new Set(['ls', 'uc1', 'uc2', 'pxm', 'pqc', 'ux10', 'ux8', 'usau', 'lc', 'pet']);

/** Produits ambigus → revue manuelle directe, sans recherche auto */
const AMBIGUOUS_PATTERNS = [
  /sucre\s+b[âa]tonnets/i,
  /museau\s+de?\s+b[œoe]uf/i,
  /saucisson\s+ail/i,
  /fromage\s+past[a-z]*\s+noix/i,
  /parmigiano\s+r[âa]p[eé]/i,
  /emmental\s+r[âa]p[eé]/i,
  /hitcoko/i,
];

/** Marques connues avec information officielle */
const KNOWN_BRANDS = [
  { pattern: /\bcoca[\s-]*cola\b/i,   name: 'Coca-Cola',  officialQuery: 'Coca-Cola 2L bouteille' },
  { pattern: /\bdamoiseau\b/i,        name: 'Damoiseau',  officialQuery: 'Damoiseau rhum blanc 1L' },
  { pattern: /\bu\s+bio\b/i,          name: 'U Bio',      officialQuery: null },
  { pattern: /\bpepsi\b/i,            name: 'Pepsi',      officialQuery: null },
  { pattern: /\bnestl[eé]\b/i,        name: 'Nestlé',     officialQuery: null },
  { pattern: /\bdanone\b/i,           name: 'Danone',     officialQuery: null },
  { pattern: /\byoplait\b/i,          name: 'Yoplait',    officialQuery: null },
  { pattern: /\bpanzani\b/i,          name: 'Panzani',    officialQuery: null },
  { pattern: /\bheinz\b/i,            name: 'Heinz',      officialQuery: null },
  { pattern: /\bpringles\b/i,         name: 'Pringles',   officialQuery: null },
  { pattern: /\blu\b/i,               name: 'LU',         officialQuery: null },
  { pattern: /\blipton\b/i,           name: 'Lipton',     officialQuery: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dry-run') { args.dryRun = true; continue; }
    if (argv[i].startsWith('--') && argv[i + 1]) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers (inline — no TS import needed)
// ─────────────────────────────────────────────────────────────────────────────

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractSizeFromLabel(label) {
  const m = label.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|cl|l|ml|oz)\b/i);
  return m ? `${m[1].replace(',', '.')}${m[2].toLowerCase()}` : null;
}

function extractBrandFromLabel(label) {
  for (const { pattern, name } of KNOWN_BRANDS) {
    if (pattern.test(label)) return name;
  }
  // "U" standalone brand detection
  if (/\bU\s*(?:Bio|Express)?\b/.test(label)) return 'U';
  return null;
}

function isAmbiguous(label) {
  return AMBIGUOUS_PATTERNS.some((p) => p.test(label));
}

/**
 * Génère une clé produit stable (slug ASCII hyphen).
 * Ex: "Coca-Cola PET 2L" → "coca-cola-pet-2l"
 */
function toProductKey(label, brand, size) {
  let key = removeAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return key;
}

/**
 * Génère plusieurs variantes de requête pour la recherche image.
 * Retourne max 5 variantes dédupliquées.
 */
function generateQueryVariants(product) {
  const { normalizedLabel, brand, sizeText } = product;
  const queries = new Set();
  const detectedBrand = brand || extractBrandFromLabel(normalizedLabel);
  const detectedSize  = sizeText || extractSizeFromLabel(normalizedLabel);

  // 1. Libellé normalisé complet
  queries.add(normalizedLabel);

  // 2. Sans accents
  const noAccents = removeAccents(normalizedLabel);
  if (noAccents !== normalizedLabel) queries.add(noAccents);

  // 3. Marque en tête + mots-clés + taille
  if (detectedBrand) {
    const coreLabel = normalizedLabel
      .replace(new RegExp(`\\b${escapeRegex(detectedBrand)}\\b`, 'gi'), '')
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|cl|l|ml|oz)\b/gi, '')
      .replace(/\s+/g, ' ').trim();
    const v3 = [detectedBrand, coreLabel, detectedSize].filter(Boolean).join(' ').trim();
    if (v3.length >= 3) queries.add(v3);
  }

  // 4. Requête officielle si marque avec officialQuery défini
  if (detectedBrand) {
    const entry = KNOWN_BRANDS.find((b) => b.name === detectedBrand);
    if (entry?.officialQuery) {
      queries.add(entry.officialQuery);
    }
  }

  // 5. Libellé épuré (sans grammage, sans mots techniques)
  const stripped = normalizedLabel
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|cl|l|ml|oz)\b/gi, '')
    .replace(/\b(?:UHT|PET|AOP|IGP|BIO|PAST\.?)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  if (stripped.length >= 4 && stripped !== normalizedLabel) queries.add(stripped);

  return [...queries].filter((q) => q.length >= 3).slice(0, 5);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring (inline)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeForCmp(str) {
  return removeAccents(str).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractKeywords(label) {
  const stop = new Set(['les', 'des', 'une', 'pour', 'avec', 'sans', 'the', 'and', 'for', 'sur']);
  return normalizeForCmp(label).split(' ').filter((w) => w.length >= 3 && !stop.has(w));
}

/**
 * Score composite 0–100 pour un candidat image.
 *
 * +35 marque exacte, +25 grammage, +20 mots-clés, +10 catégorie, +10 source officielle
 * -20 logo, -30 lifestyle, -15 grammage incompatible, -10 titre trop court
 */
function scoreCandidate(product, candidate) {
  let score = 0;
  const titleNorm  = normalizeForCmp(candidate.title || '');
  const titleWords = titleNorm.split(' ');
  const detectedBrand = product.brand || extractBrandFromLabel(product.normalizedLabel);
  const detectedSize  = product.sizeText || extractSizeFromLabel(product.normalizedLabel);

  // +35 marque
  if (detectedBrand && titleNorm.includes(normalizeForCmp(detectedBrand))) score += 35;

  // +25 grammage
  if (detectedSize) {
    const sizeVal = detectedSize.replace(/[a-z]+$/i, '').trim();
    if (titleNorm.includes(sizeVal)) score += 25;
  }

  // +20 mots-clés
  const kws = extractKeywords(product.normalizedLabel);
  const common = kws.filter((kw) => titleWords.some((tw) => tw.includes(kw) || kw.includes(tw)));
  if (common.length >= 3) score += 20;
  else if (common.length === 2) score += 14;
  else if (common.length === 1) score += 6;

  // +10 catégorie
  if (product.category) {
    const catWords = normalizeForCmp(product.category.replace(/_/g, ' ')).split(' ').filter((w) => w.length >= 4);
    if (catWords.some((cw) => titleNorm.includes(cw))) score += 10;
  }

  // +10 source officielle
  if (candidate.sourceType === 'official' || candidate.sourceType === 'retailer') score += 10;

  // Malus
  if (candidate.notes?.includes('logo'))       score -= 20;
  if (candidate.notes?.includes('lifestyle'))  score -= 30;
  if (titleWords.filter((w) => w.length >= 2).length < 3) score -= 10;

  // Malus grammage incompatible
  if (detectedSize) {
    const sizeVal = detectedSize.replace(/[a-z]+$/i, '').trim();
    const tm = titleNorm.match(/\b(\d+(?:[.,]\d+)?)\s*(?:kg|g|cl|l|ml|oz)\b/i);
    if (tm && tm[1] !== sizeVal) score -= 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function chooseBestImage(product, candidates) {
  if (!candidates.length) return null;
  const scored = candidates
    .map((c) => ({ ...c, confidenceScore: scoreCandidate(product, c) }))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
  const best = scored[0];
  if (!best || best.confidenceScore < THRESHOLD_REVIEW) return null;
  return { ...best, needsReview: best.confidenceScore < THRESHOLD_AUTO };
}

// ─────────────────────────────────────────────────────────────────────────────
// Image search adapter (OpenFoodFacts)
// ─────────────────────────────────────────────────────────────────────────────

async function searchImages(queryStr) {
  try {
    const params = new URLSearchParams({
      search_terms: queryStr,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '5',
      fields: 'product_name,brands,quantity,image_url,image_front_url,categories_tags',
    });
    const resp = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.products ?? [])
      .filter((p) => p.image_front_url || p.image_url)
      .map((p) => ({
        url: p.image_front_url ?? p.image_url,
        source: 'openfoodfacts.org',
        sourceType: 'openfoodfacts',
        title: [p.product_name, p.brands, p.quantity].filter(Boolean).join(' — '),
        matchedQuery: queryStr,
        confidenceScore: 0,
        notes: 'packshot',
      }));
  } catch {
    return [];
  }
}

/** Stub utilisé en --dry-run (aucun appel réseau) */
function searchImagesDryRun(_queryStr) {
  return Promise.resolve([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Process one product
// ─────────────────────────────────────────────────────────────────────────────

async function processProduct(product, searchFn) {
  const productKey = toProductKey(product.normalizedLabel, product.brand, product.sizeText);

  // Produit ambigu → review queue directe
  if (isAmbiguous(product.rawLabel || product.normalizedLabel)) {
    return {
      productKey,
      rawLabel: product.rawLabel,
      normalizedLabel: product.normalizedLabel,
      brand: product.brand,
      category: product.category,
      sizeText: product.sizeText,
      image: null,
      candidates: [],
      status: 'ambiguous',
      needsReview: true,
      reviewReason: 'Produit ambigu — validation manuelle requise',
    };
  }

  // Générer les variantes de requête
  const queries = generateQueryVariants(product);

  // Rechercher les candidats (max 3 requêtes)
  const allCandidates = [];
  for (const q of queries.slice(0, 3)) {
    const found = await searchFn(q);
    allCandidates.push(...found);
    if (allCandidates.length >= MAX_CANDIDATES) break;
  }

  // Dédupliquer par URL
  const seenUrls = new Set();
  const uniqueCandidates = allCandidates.filter((c) => {
    if (seenUrls.has(c.url)) return false;
    seenUrls.add(c.url);
    return true;
  });

  // Scorer tous les candidats
  const scoredCandidates = uniqueCandidates
    .map((c) => ({ ...c, confidenceScore: scoreCandidate(product, c) }))
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, MAX_CANDIDATES);

  const bestImage = chooseBestImage(product, uniqueCandidates);

  if (!bestImage) {
    const topScore = scoredCandidates[0]?.confidenceScore ?? 0;
    return {
      productKey,
      rawLabel: product.rawLabel,
      normalizedLabel: product.normalizedLabel,
      brand: product.brand,
      category: product.category,
      sizeText: product.sizeText,
      image: null,
      candidates: scoredCandidates.slice(0, 3),
      status: scoredCandidates.length > 0 ? 'ambiguous' : 'not_found',
      needsReview: true,
      reviewReason: scoredCandidates.length > 0
        ? `Score max ${topScore}/100 insuffisant (seuil: ${THRESHOLD_REVIEW})`
        : 'Aucune image trouvée sur OpenFoodFacts',
    };
  }

  return {
    productKey,
    rawLabel: product.rawLabel,
    normalizedLabel: product.normalizedLabel,
    brand: product.brand,
    category: product.category,
    sizeText: product.sizeText,
    image: {
      imageUrl: bestImage.url,
      thumbnailUrl: null,
      source: bestImage.source,
      sourceType: bestImage.sourceType,
      confidenceScore: bestImage.confidenceScore,
      isPrimary: true,
      needsReview: bestImage.needsReview,
    },
    candidates: scoredCandidates.slice(0, 3),
    status: 'matched',
    needsReview: bestImage.needsReview,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export functions
// ─────────────────────────────────────────────────────────────────────────────

function exportImportJson(ticket, results, outputDir) {
  const matched = results.filter((r) => r.status === 'matched');
  const output = {
    generatedAt: new Date().toISOString(),
    sourceTicket: {
      storeName: ticket.storeName,
      storeId: ticket.storeId,
      ticketId: ticket.ticketId,
      ticketDate: ticket.ticketDate,
    },
    items: matched.map((r) => ({
      productKey: r.productKey,
      rawLabel: r.rawLabel,
      normalizedLabel: r.normalizedLabel,
      brand: r.brand ?? null,
      category: r.category ?? null,
      sizeText: r.sizeText ?? null,
      image: r.image,
      status: r.status,
    })),
  };
  const path = join(outputDir, 'product-image-import.json');
  writeFileSync(path, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅  Import JSON → ${path}  (${matched.length} produits)`);
  return output;
}

function exportReviewQueue(results, outputDir) {
  const toReview = results.filter((r) => r.needsReview || r.status !== 'matched');
  const output = {
    generatedAt: new Date().toISOString(),
    items: toReview.map((r) => ({
      productKey: r.productKey,
      rawLabel: r.rawLabel,
      normalizedLabel: r.normalizedLabel,
      reason: r.status === 'ambiguous' ? 'ambiguous'
            : r.status === 'not_found' ? 'not_found'
            : 'low_confidence',
      reviewNote: r.reviewReason ?? null,
      topCandidates: (r.candidates ?? []).slice(0, 3).map((c) => ({
        url: c.url,
        source: c.source,
        matchedQuery: c.matchedQuery,
        confidenceScore: c.confidenceScore,
        notes: c.notes ?? null,
      })),
    })),
  };
  const path = join(outputDir, 'product-image-review-queue.json');
  writeFileSync(path, JSON.stringify(output, null, 2), 'utf8');
  console.log(`📋  Review queue → ${path}  (${toReview.length} produits)`);
  return output;
}

function exportReport(ticket, results, outputDir) {
  const matched   = results.filter((r) => r.status === 'matched' && !r.needsReview);
  const review    = results.filter((r) => r.needsReview || r.status === 'ambiguous');
  const notFound  = results.filter((r) => r.status === 'not_found');

  const tableRows = results.map((r) => {
    const score = r.image?.confidenceScore ?? (r.candidates?.[0]?.confidenceScore ?? '—');
    const source = r.image?.source ?? (r.candidates?.[0]?.source ?? '—');
    const status = r.status === 'matched' && !r.needsReview ? '✅ auto'
                 : r.status === 'matched' && r.needsReview  ? '⚠️  revue'
                 : r.status === 'ambiguous'                 ? '🔶 ambigu'
                 : '❌ introuvable';
    return `| ${r.normalizedLabel.slice(0, 40).padEnd(40)} | ${String(score).padStart(5)} | ${String(source).slice(0, 20).padEnd(20)} | ${status} |`;
  }).join('\n');

  const queriesUsed = [...new Set(
    results.flatMap((r) => (r.candidates ?? []).map((c) => c.matchedQuery)),
  )].slice(0, 20);

  const sourcesUsed = [...new Set(
    results.flatMap((r) => [r.image?.source, ...(r.candidates ?? []).map((c) => c.source)].filter(Boolean)),
  )];

  const md = `# Rapport enrichissement image — Ticket U Express
*Généré le ${new Date().toLocaleString('fr-FR')}*
*Ticket: ${ticket.storeName} — ${ticket.ticketId} — ${ticket.ticketDate}*

---

## Résumé

| Indicateur | Valeur |
|---|---|
| Total produits | ${results.length} |
| Auto-matchés (score ≥ ${THRESHOLD_AUTO}) | ${matched.length} |
| En revue (score ${THRESHOLD_REVIEW}–${THRESHOLD_AUTO - 1} ou ambigus) | ${review.length} |
| Introuvables | ${notFound.length} |
| Sources utilisées | ${sourcesUsed.join(', ') || '—'} |

---

## Détail par produit

| Libellé normalisé | Score | Source | Statut |
|---|---|---|---|
${tableRows}

---

## Produits auto-matchés (${matched.length})

${matched.length === 0 ? '_Aucun produit auto-matché._' : matched.map((r) =>
  `- **${r.normalizedLabel}** — score ${r.image?.confidenceScore}/100 — [${r.image?.source}](${r.image?.imageUrl})`
).join('\n')}

---

## Produits en revue (${review.length})

${review.length === 0 ? '_Aucun produit en revue._' : review.map((r) =>
  `- **${r.normalizedLabel}** — ${r.reviewReason ?? 'revue manuelle'}` +
  (r.candidates?.length ? `\n  - Meilleur candidat: ${r.candidates[0].url} (score ${r.candidates[0].confidenceScore}/100)` : '')
).join('\n')}

---

## Produits introuvables (${notFound.length})

${notFound.length === 0 ? '_Aucun produit introuvable._' : notFound.map((r) =>
  `- **${r.normalizedLabel}** (${r.rawLabel})`
).join('\n')}

---

## Requêtes utilisées (${queriesUsed.length})

${queriesUsed.map((q) => `- \`${q}\``).join('\n') || '_Aucune requête (dry-run ou erreur réseau)_'}

---

## Sources utilisées

${sourcesUsed.map((s) => `- \`${s}\``).join('\n') || '- _Aucune source (dry-run ou erreur réseau)_'}

---

## Notes techniques

- Seuil auto-accept : **${THRESHOLD_AUTO}/100**
- Seuil revue : **${THRESHOLD_REVIEW}/100**
- Source primaire : **OpenFoodFacts** (CC BY-SA)
- Produits ambigus détectés automatiquement : sucre bâtonnets vanille pistache, museau de bœuf, saucisson ail, fromage pasteurisé noix, parmigiano râpé, emmental râpé, hitcoko
- Aucune URL d'image n'a été inventée
`;

  const path = join(outputDir, 'product-image-report.md');
  writeFileSync(path, md, 'utf8');
  console.log(`📄  Rapport Markdown → ${path}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const inputPath  = resolve(args.input  || 'data/tickets/u-express-2026-03-04-products.json');
  const outputDir  = resolve(args.output || 'output');

  console.log('\n🚀  Pipeline enrichissement image produit');
  console.log(`   Input : ${inputPath}`);
  console.log(`   Output: ${outputDir}`);
  console.log(`   Mode  : ${args.dryRun ? 'dry-run (aucun appel réseau)' : 'live (OpenFoodFacts)'}\n`);

  // Créer le répertoire output si nécessaire
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // Lire l'entrée
  let ticketData;
  try {
    ticketData = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (err) {
    console.error(`❌  Impossible de lire le fichier d'entrée: ${inputPath}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }

  const { ticket, products } = ticketData;
  if (!Array.isArray(products) || products.length === 0) {
    console.error('❌  Aucun produit dans le fichier d\'entrée.');
    process.exit(1);
  }

  console.log(`📦  ${products.length} produits à traiter...\n`);

  const searchFn = args.dryRun ? searchImagesDryRun : searchImages;

  // Traiter chaque produit
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const label = product.normalizedLabel || product.rawLabel;
    process.stdout.write(`[${String(i + 1).padStart(2)}/${products.length}] ${label.slice(0, 50).padEnd(50)} `);

    const result = await processProduct(product, searchFn);
    results.push(result);

    const icon = result.status === 'matched' && !result.needsReview ? '✅'
               : result.status === 'matched' && result.needsReview  ? '⚠️ '
               : result.status === 'ambiguous'                      ? '🔶'
               : '❌';
    const score = result.image?.confidenceScore ?? (result.candidates?.[0]?.confidenceScore ?? '—');
    console.log(`${icon} score:${score}`);
  }

  console.log('\n');

  // Exporter les sorties
  exportImportJson(ticket, results, outputDir);
  exportReviewQueue(results, outputDir);
  exportReport(ticket, results, outputDir);

  // Résumé console
  const matched  = results.filter((r) => r.status === 'matched' && !r.needsReview).length;
  const review   = results.filter((r) => r.needsReview || r.status === 'ambiguous').length;
  const notFound = results.filter((r) => r.status === 'not_found').length;

  console.log('\n──────────────────────────────────');
  console.log(`  Total     : ${results.length} produits`);
  console.log(`  ✅ Auto    : ${matched}`);
  console.log(`  ⚠️  Revue  : ${review}`);
  console.log(`  ❌ Absent  : ${notFound}`);
  console.log('──────────────────────────────────\n');
}

main().catch((err) => {
  console.error('❌  Erreur fatale:', err);
  process.exit(1);
});
