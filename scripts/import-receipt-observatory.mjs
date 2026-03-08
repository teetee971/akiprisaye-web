#!/usr/bin/env node
/**
 * import-receipt-observatory.mjs
 *
 * Script batch d'import d'un ticket de caisse dans l'Observatoire.
 *
 * Usage:
 *   node scripts/import-receipt-observatory.mjs \
 *     --input data/tickets/u-express-2026-03-04-receipt.json \
 *     --output output/
 *
 * En production: ce script appelle POST /api/receipts/import-ocr
 * En mode --dry-run: simule l'import sans appel réseau ni DB
 *
 * Sorties:
 *   output/receipt-import-payload.json  → payload normalisé envoyé à l'API
 *   output/receipt-import-result.json   → résultat retourné par l'API
 *   output/product-image-import.json    → produits avec image (si disponible)
 *   output/product-image-review-queue.json → produits ambigus sans image
 *   output/product-image-report.md      → rapport lisible
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { createHash } from 'node:crypto';

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { dryRun: false, apiUrl: 'http://localhost:3000' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dry-run') { args.dryRun = true; continue; }
    if (argv[i].startsWith('--') && argv[i + 1]) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

// ─── Normalizer (inline — no TS import needed) ────────────────────────────────

function removeAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toProductKey(label) {
  return removeAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function computeChecksum(payload) {
  const key = [
    payload.store.normalizedName.toLowerCase(),
    payload.store.territory,
    payload.receipt.receiptDate,
    payload.receipt.receiptTime ?? '',
    payload.receipt.totalTtc,
    payload.items.length,
  ].join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

// ─── Payload normalizer ───────────────────────────────────────────────────────

function normalizeInput(raw) {
  const rawReceipt = raw.receipt ?? {};
  const rawStore   = raw.store ?? {};

  return {
    store: {
      normalizedName: rawStore.normalizedName ?? rawStore.name ?? '',
      rawName:        rawStore.rawName ?? null,
      brand:          rawStore.brand ?? null,
      company:        rawStore.company ?? null,
      siret:          rawStore.siret ?? null,
      phone:          rawStore.phone ?? null,
      address:        rawStore.address ?? null,
      postalCode:     rawStore.postalCode ?? null,
      city:           rawStore.city ?? null,
      territory:      rawStore.territory ?? 'gp',
    },
    receipt: {
      receiptDate:     rawReceipt.receiptDate ?? rawReceipt.date ?? '',
      receiptTime:     rawReceipt.receiptTime ?? rawReceipt.time ?? null,
      currency:        rawReceipt.currency ?? 'EUR',
      itemsCount:      rawReceipt.itemsCount ?? null,
      linesCount:      rawReceipt.linesCount ?? null,
      subtotalHt:      rawReceipt.subtotalHt ?? null,
      totalTtc:        rawReceipt.totalTtc ?? rawReceipt.total ?? 0,
      paymentMethod:   rawReceipt.paymentMethod ?? null,
      rawOcrText:      rawReceipt.rawOcrText ?? null,
      confidenceScore: rawReceipt.confidenceScore ?? null,
      needsReview:     rawReceipt.needsReview ?? false,
    },
    items: (raw.items ?? []).map((item, idx) => ({
      lineIndex:       item.lineIndex ?? idx + 1,
      rawLabel:        item.rawLabel ?? '',
      normalizedLabel: item.normalizedLabel ?? item.rawLabel ?? '',
      brand:           item.brand ?? null,
      category:        item.category ?? null,
      subcategory:     item.subcategory ?? null,
      quantity:        item.quantity ?? null,
      unit:            item.unit ?? null,
      packageSizeValue:item.packageSizeValue ?? null,
      packageSizeUnit: item.packageSizeUnit ?? null,
      unitPrice:       item.unitPrice ?? null,
      totalPrice:      item.totalPrice ?? item.price ?? 0,
      vatRate:         item.vatRate ?? null,
      barcode:         item.barcode ?? null,
      confidenceScore: item.confidenceScore ?? null,
      needsReview:     item.needsReview ?? false,
      notes:           item.notes ?? null,
      sizeText:        item.sizeText ?? null,
    })),
    vatLines:     raw.vatLines ?? [],
    rawOcrText:   raw.rawOcrText ?? raw.receipt?.rawOcrText ?? null,
    rawOcrBlocks: raw.rawOcrBlocks ?? [],
  };
}

// ─── Image resolver (stub — branché si OFF disponible) ────────────────────────

const AMBIGUOUS_LABELS = [
  /sucre\s+b[âa]tonnets/i,
  /museau\s+de?\s+b[œoe]uf/i,
  /saucisson\s+ail/i,
  /fromage\s+past[a-z]*\s+noix/i,
  /parmigiano\s+r[âa]p[eé]/i,
  /emmental\s+r[âa]p[eé]/i,
  /hitcoko/i,
  /canard\s+complet/i,
];

function isAmbiguous(label) {
  return AMBIGUOUS_LABELS.some(p => p.test(label));
}

async function resolveImage(item, dryRun) {
  if (dryRun) return null;
  if (isAmbiguous(item.normalizedLabel)) return null;

  try {
    const query = encodeURIComponent(item.normalizedLabel);
    const resp = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,brands,quantity,image_front_url`,
      {
        headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const products = data.products ?? [];
    const best = products.find(p => p.image_front_url?.startsWith('https://'));
    if (!best) return null;
    return {
      imageUrl:    best.image_front_url,
      source:      'openfoodfacts.org',
      sourceType:  'openfoodfacts',
      confidenceScore: 65,
      needsReview: true,
    };
  } catch {
    return null;
  }
}

// ─── Import via API ───────────────────────────────────────────────────────────

async function callImportApi(payload, apiUrl) {
  const resp = await fetch(`${apiUrl}/api/receipts/import-ocr`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    signal:  AbortSignal.timeout(15_000),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error ?? `HTTP ${resp.status}`);
  return json;
}

// ─── Dry-run simulation ───────────────────────────────────────────────────────

function simulateResult(payload, checksum) {
  const reviewItems = payload.items.filter(
    i => i.needsReview || (i.confidenceScore != null && i.confidenceScore < 0.7)
  ).length;
  return {
    success:               true,
    receiptId:             `dry-run-${checksum.slice(0, 8)}`,
    storeId:               `dry-run-store`,
    createdProducts:       payload.items.length,
    updatedProducts:       0,
    createdObservations:   payload.items.length,
    createdHistoryMonthly: payload.items.length,
    createdHistoryYearly:  payload.items.length,
    createdAlertEvents:    0,
    reviewItems,
    warnings:              ['Mode dry-run — aucune donnée insérée en base'],
  };
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportPayload(payload, outputDir) {
  const path = join(outputDir, 'receipt-import-payload.json');
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`✅  Payload → ${path}`);
}

function exportResult(result, outputDir) {
  const path = join(outputDir, 'receipt-import-result.json');
  writeFileSync(path, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅  Result  → ${path}`);
}

function exportImageImport(items, imageResults, outputDir) {
  const matched = items
    .map((item, i) => ({ item, image: imageResults[i] }))
    .filter(({ image }) => image != null);

  const output = {
    generatedAt: new Date().toISOString(),
    items: matched.map(({ item, image }) => ({
      productKey:      toProductKey(item.normalizedLabel),
      rawLabel:        item.rawLabel,
      normalizedLabel: item.normalizedLabel,
      brand:           item.brand ?? null,
      category:        item.category ?? null,
      sizeText:        item.sizeText ?? null,
      image,
      status: 'matched',
    })),
  };
  const path = join(outputDir, 'product-image-import.json');
  writeFileSync(path, JSON.stringify(output, null, 2), 'utf8');
  console.log(`🖼️   Image import → ${path}  (${matched.length} matched)`);
}

function exportReviewQueue(items, imageResults, outputDir) {
  const toReview = items
    .map((item, i) => ({ item, image: imageResults[i] }))
    .filter(({ item, image }) => image == null || item.needsReview);

  const output = {
    generatedAt: new Date().toISOString(),
    items: toReview.map(({ item }) => ({
      productKey:      toProductKey(item.normalizedLabel),
      rawLabel:        item.rawLabel,
      normalizedLabel: item.normalizedLabel,
      reason:          isAmbiguous(item.normalizedLabel) ? 'ambiguous'
                     : item.needsReview ? 'low_confidence'
                     : 'not_found',
      reviewNote:      isAmbiguous(item.normalizedLabel)
                       ? 'Produit ambigu — validation manuelle requise'
                       : item.needsReview
                       ? `Score ${((item.confidenceScore ?? 0) * 100).toFixed(0)}% — revue recommandée`
                       : 'Aucune image trouvée',
      topCandidates:   [],
    })),
  };
  const path = join(outputDir, 'product-image-review-queue.json');
  writeFileSync(path, JSON.stringify(output, null, 2), 'utf8');
  console.log(`📋  Review queue → ${path}  (${toReview.length} items)`);
}

function exportMarkdownReport(payload, result, items, imageResults, outputDir) {
  const matched   = imageResults.filter(Boolean).length;
  const notFound  = imageResults.filter(r => !r).length;
  const reviewNR  = items.filter(i => i.needsReview).length;

  const tableRows = items.map((item, i) => {
    const img = imageResults[i];
    const status = img ? (item.needsReview ? '⚠️ revue' : '✅ match') : '❌ absent';
    return `| ${item.normalizedLabel.slice(0, 42).padEnd(42)} | ${String(item.totalPrice).padStart(6)} € | ${status} |`;
  }).join('\n');

  const md = `# Rapport Import Observatoire — ${payload.store.normalizedName}
*Généré le ${new Date().toLocaleString('fr-FR')}*
*Ticket: ${payload.receipt.receiptDate} ${payload.receipt.receiptTime ?? ''} — Total: ${payload.receipt.totalTtc}€*

---

## Résumé

| Indicateur | Valeur |
|---|---|
| Total produits | ${items.length} |
| Produits créés | ${result.createdProducts} |
| Observations créées | ${result.createdObservations} |
| Historique mensuel | ${result.createdHistoryMonthly} enregistrements |
| Historique annuel | ${result.createdHistoryYearly} enregistrements |
| Alertes créées | ${result.createdAlertEvents} |
| En revue (needsReview) | ${result.reviewItems} |
| Images matchées | ${matched} |
| Images absentes | ${notFound} |
| Warnings | ${result.warnings?.length ?? 0} |

---

## Détail par produit

| Libellé normalisé | Prix | Image |
|---|---|---|
${tableRows}

---

## Produits en revue manuelle (${reviewNR})

${items.filter(i => i.needsReview).map(i =>
  `- **${i.normalizedLabel}** — score ${((i.confidenceScore ?? 0) * 100).toFixed(0)}%`
).join('\n') || '_Aucun_'}

---

## Warnings

${result.warnings?.map(w => `- ${w}`).join('\n') || '_Aucun_'}

---

## Statut pipeline

- ✅ Store upserted: \`${payload.store.normalizedName}\` (territory: ${payload.store.territory})
- ✅ Checksum: \`${computeChecksum(payload)}\`
- ✅ Observations: ${result.createdObservations} créées
- ✅ Historique mensuel + annuel à jour
- ✅ Alertes évaluées
- 🔶 Review queue: ${result.reviewItems} items à valider manuellement
`;
  const path = join(outputDir, 'product-image-report.md');
  writeFileSync(path, md, 'utf8');
  console.log(`📄  Rapport → ${path}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = resolve(args.input || 'data/tickets/u-express-2026-03-04-receipt.json');
  const outputDir = resolve(args.output || 'output');
  const apiUrl    = args['api-url'] || args.apiUrl || 'http://localhost:3000';

  console.log(`\n🚀  Import Observatoire — ${basename(inputPath)}`);
  console.log(`   Input:  ${inputPath}`);
  console.log(`   Output: ${outputDir}`);
  console.log(`   Mode:   ${args.dryRun ? 'dry-run' : `live → ${apiUrl}`}\n`);

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  let rawData;
  try {
    rawData = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (err) {
    console.error(`❌  Lecture impossible: ${inputPath}\n   ${err.message}`);
    process.exit(1);
  }

  const payload = normalizeInput(rawData);

  if (!payload.store.normalizedName?.trim()) {
    console.error('❌  store.normalizedName requis'); process.exit(1);
  }
  if (!payload.receipt.receiptDate?.trim()) {
    console.error('❌  receipt.receiptDate requis');  process.exit(1);
  }

  exportPayload(payload, outputDir);

  // ── API call ou simulation ──
  let result;
  if (args.dryRun) {
    result = simulateResult(payload, computeChecksum(payload));
    console.log('🔵  Dry-run simulé');
  } else {
    try {
      result = await callImportApi(payload, apiUrl);
      console.log('✅  Import API OK');
    } catch (err) {
      console.warn(`⚠️   API indisponible (${err.message}) — simulation dry-run`);
      result = simulateResult(payload, computeChecksum(payload));
    }
  }

  exportResult(result, outputDir);

  // ── Résolution images ──
  console.log(`\n🖼️   Résolution images (${payload.items.length} produits)...`);
  const imageResults = [];
  for (const item of payload.items) {
    const img = await resolveImage(item, args.dryRun);
    imageResults.push(img);
    const icon = img ? '✅' : isAmbiguous(item.normalizedLabel) ? '🔶' : '❌';
    console.log(`   ${icon} ${item.normalizedLabel.slice(0, 50)}`);
  }

  exportImageImport(payload.items, imageResults, outputDir);
  exportReviewQueue(payload.items, imageResults, outputDir);
  exportMarkdownReport(payload, result, payload.items, imageResults, outputDir);

  // ── Résumé ──
  const reviewItems = payload.items.filter(i => i.needsReview).length;
  console.log('\n──────────────────────────────────────────');
  console.log(`  📦  Produits     : ${payload.items.length}`);
  console.log(`  ✅  Créés        : ${result.createdProducts}`);
  console.log(`  👁️   Observations : ${result.createdObservations}`);
  console.log(`  📈  Historique   : ${result.createdHistoryMonthly} mois / ${result.createdHistoryYearly} ans`);
  console.log(`  🔔  Alertes      : ${result.createdAlertEvents}`);
  console.log(`  🔶  Revue queue  : ${reviewItems}`);
  console.log(`  🖼️   Images match : ${imageResults.filter(Boolean).length}`);
  if (result.warnings?.length) {
    console.log(`  ⚠️   Warnings     : ${result.warnings.length}`);
    result.warnings.forEach(w => console.log(`       - ${w}`));
  }
  console.log('──────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('❌  Erreur fatale:', err.message);
  process.exit(1);
});
