/**
 * Receipt Import Route
 *
 * POST /api/receipts/import-ocr
 *
 * Normalise le payload entrant (supporte plusieurs variantes de nommage),
 * puis délègue au receiptImportService.
 *
 * Supporte deux formats d'entrée pour la compatibilité:
 *   - Canonique:  receipt.receiptDate / items[].totalPrice
 *   - Compact:    receipt.date        / items[].price
 */

import { Router, Request, Response } from 'express';
import { receiptImportService } from '../services/receipt/receiptImportService.js';
import type { ImportReceiptPayload, ReceiptItemInput } from '../types/receipt.types.js';

const router = Router();

// ─── Payload normalizer ───────────────────────────────────────────────────────

function normalizePayload(body: Record<string, unknown>): ImportReceiptPayload {
  const rawReceipt = (body.receipt ?? {}) as Record<string, unknown>;
  const rawStore   = (body.store   ?? {}) as Record<string, unknown>;
  const rawItems   = Array.isArray(body.items) ? body.items : [];

  const items: ReceiptItemInput[] = (rawItems as Record<string, unknown>[]).map(
    (item, idx) => ({
      lineIndex:       typeof item.lineIndex  === 'number' ? item.lineIndex : idx + 1,
      rawLabel:        String(item.rawLabel ?? item.label ?? ''),
      normalizedLabel: item.normalizedLabel ? String(item.normalizedLabel) : undefined,
      brand:           item.brand   != null ? String(item.brand)   : undefined,
      category:        item.category != null ? String(item.category) : undefined,
      subcategory:     item.subcategory != null ? String(item.subcategory) : undefined,
      quantity:        typeof item.quantity  === 'number' ? item.quantity  : undefined,
      unit:            item.unit    != null ? String(item.unit)    : undefined,
      packageSizeValue:typeof item.packageSizeValue === 'number' ? item.packageSizeValue : undefined,
      packageSizeUnit: item.packageSizeUnit != null ? String(item.packageSizeUnit) : undefined,
      unitPrice:       typeof item.unitPrice === 'number' ? item.unitPrice : undefined,
      // Support both "totalPrice" and "price"
      totalPrice:      typeof item.totalPrice === 'number' ? item.totalPrice
                     : typeof item.price      === 'number' ? item.price
                     : 0,
      vatRate:         typeof item.vatRate    === 'number' ? item.vatRate    : undefined,
      barcode:         item.barcode != null ? String(item.barcode) : undefined,
      confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : undefined,
      needsReview:     typeof item.needsReview === 'boolean' ? item.needsReview : undefined,
      reviewNote:      item.reviewNote != null ? String(item.reviewNote) : undefined,
      notes:           item.notes != null ? String(item.notes) : undefined,
      // Carry sizeText for parsePackageSize in the service
      ...(item.sizeText != null ? { sizeText: String(item.sizeText) } : {}),
      // Explicit productKey override (caller's stable key takes precedence)
      ...(item.productKey != null ? { productKey: String(item.productKey) } : {}),
      // weightKg for unit price calculation
      ...(typeof item.weightKg === 'number' ? { weightKg: item.weightKg } : {}),
    } as ReceiptItemInput),
  );

  return {
    store: {
      normalizedName: String(rawStore.normalizedName ?? rawStore.name ?? ''),
      rawName:        rawStore.rawName        != null ? String(rawStore.rawName)        : undefined,
      brand:          rawStore.brand          != null ? String(rawStore.brand)          : undefined,
      company:        rawStore.company        != null ? String(rawStore.company)        : undefined,
      siret:          rawStore.siret          != null ? String(rawStore.siret)          : undefined,
      phone:          rawStore.phone          != null ? String(rawStore.phone)          : undefined,
      address:        rawStore.address        != null ? String(rawStore.address)        : undefined,
      postalCode:     rawStore.postalCode     != null ? String(rawStore.postalCode)     : undefined,
      city:           rawStore.city           != null ? String(rawStore.city)           : undefined,
      territory:      String(rawStore.territory ?? 'gp') as import('../types/receipt.types.js').TerritoryCode,
    },
    receipt: {
      // Support both "receiptDate" and "date"
      receiptDate:     String(rawReceipt.receiptDate ?? rawReceipt.date ?? ''),
      receiptTime:     rawReceipt.receiptTime != null ? String(rawReceipt.receiptTime)
                     : rawReceipt.time       != null ? String(rawReceipt.time)
                     : undefined,
      currency:        rawReceipt.currency    != null ? String(rawReceipt.currency)    : undefined,
      itemsCount:      typeof rawReceipt.itemsCount === 'number' ? rawReceipt.itemsCount : undefined,
      linesCount:      typeof rawReceipt.linesCount === 'number' ? rawReceipt.linesCount : undefined,
      subtotalHt:      typeof rawReceipt.subtotalHt === 'number' ? rawReceipt.subtotalHt : undefined,
      // Support both "totalTtc" and "total"
      totalTtc:        typeof rawReceipt.totalTtc === 'number' ? rawReceipt.totalTtc
                     : typeof rawReceipt.total    === 'number' ? rawReceipt.total
                     : 0,
      paymentMethod:   rawReceipt.paymentMethod != null ? String(rawReceipt.paymentMethod) : undefined,
      rawOcrText:      rawReceipt.rawOcrText != null ? String(rawReceipt.rawOcrText) : undefined,
      confidenceScore: typeof rawReceipt.confidenceScore === 'number' ? rawReceipt.confidenceScore : undefined,
      needsReview:     typeof rawReceipt.needsReview === 'boolean' ? rawReceipt.needsReview : undefined,
    },
    items,
    rawOcrText:   body.rawOcrText   != null ? String(body.rawOcrText)   : undefined,
    rawOcrBlocks: Array.isArray(body.rawOcrBlocks)
      ? (body.rawOcrBlocks as import('../types/receipt.types.js').OcrBlock[])
      : undefined,
  };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function validateNormalized(payload: ImportReceiptPayload): string | null {
  if (!payload.store.normalizedName?.trim()) return 'store.normalizedName is required';
  if (!payload.receipt.receiptDate?.trim()) return 'receipt.receiptDate (or receipt.date) is required';
  if (!payload.receipt.totalTtc) return 'receipt.totalTtc (or receipt.total) is required';
  if (!payload.items?.length) return 'items array must not be empty';
  for (const item of payload.items) {
    if (!item.rawLabel?.trim()) return `Item at lineIndex ${item.lineIndex}: rawLabel is required`;
    if (item.totalPrice == null || isNaN(item.totalPrice)) {
      return `Item "${item.rawLabel}": totalPrice (or price) is required`;
    }
  }
  return null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/receipts/import-ocr
 *
 * Importe un ticket de caisse OCR dans la base Observatoire.
 * Crée store, receipt, products, receipt_items, observations,
 * historique mensuel/annuel, alertes prix, review queue.
 */
router.post('/import-ocr', async (req: Request, res: Response) => {
  try {
    const payload = normalizePayload(req.body as Record<string, unknown>);

    const validationError = validateNormalized(payload);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }

    const result = await receiptImportService.import(payload);

    if (!result.success && result.error) {
      res.status(422).json({ success: false, error: result.error });
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[POST /api/receipts/import-ocr]', err);
    res.status(500).json({ success: false, error: message });
  }
});

// ─── Batch normalizer ─────────────────────────────────────────────────────────

function normalizeBatchEntry(
  entry: Record<string, unknown>,
  batchTerritory?: string,
): import('../types/receipt.types.js').ImportReceiptPayload {
  const rawStore      = ((entry.store ?? {}) as Record<string, unknown>);
  const rawReceiptMeta = ((entry.receiptMeta ?? entry.receipt ?? {}) as Record<string, unknown>);
  const rawItems      = Array.isArray(entry.items) ? entry.items : [];

  // storeLabel is the human-readable name; storeKey is the identifier
  const normalizedName =
    String(rawStore.normalizedName ?? rawStore.storeLabel ?? rawStore.name ?? '');

  const receiptDate =
    String(rawReceiptMeta.receiptDate ?? rawReceiptMeta.date ??
           (typeof rawReceiptMeta.observedAt === 'string'
             ? rawReceiptMeta.observedAt.slice(0, 10)
             : '') ?? '');

  const receiptTime =
    rawReceiptMeta.receiptTime ?? rawReceiptMeta.time ??
    (typeof rawReceiptMeta.observedAt === 'string' &&
     rawReceiptMeta.observedAt.length > 10
       ? rawReceiptMeta.observedAt.slice(11, 19)
       : null);

  return normalizePayload({
    store: {
      ...rawStore,
      normalizedName,
      territory: rawStore.territory ?? batchTerritory ?? 'gp',
    },
    receipt: {
      receiptDate,
      receiptTime,
      currency:      rawReceiptMeta.currency ?? 'EUR',
      itemsCount:    rawReceiptMeta.itemsCount,
      totalTtc:      rawReceiptMeta.totalTtc ?? rawReceiptMeta.total ?? 0,
      paymentMethod: rawReceiptMeta.paymentMethod,
      needsReview:   rawReceiptMeta.needsReview,
    },
    items:      rawItems,
    rawOcrText: entry.rawOcrText,
  } as Record<string, unknown>);
}

/**
 * POST /api/receipts/import-batch
 *
 * Importe plusieurs tickets en une seule requête.
 *
 * Payload:
 * {
 *   "importBatch": {
 *     "batchId": "...",
 *     "territory": "gp",
 *     "receipts": [ {...}, {...} ]
 *   }
 * }
 *
 * Réponse: BatchImportResult
 */
router.post('/import-batch', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const batch = body.importBatch as Record<string, unknown> | undefined;

    if (!batch || !Array.isArray(batch.receipts) || batch.receipts.length === 0) {
      res.status(400).json({ success: false, error: 'importBatch.receipts array is required' });
      return;
    }

    const batchTerritory = typeof batch.territory === 'string' ? batch.territory : 'gp';
    const receipts = batch.receipts as Record<string, unknown>[];

    const batchResult: import('../types/receipt.types.js').BatchImportResult = {
      batchId:       typeof batch.batchId === 'string' ? batch.batchId : undefined,
      totalReceipts: receipts.length,
      successCount:  0,
      failCount:     0,
      results:       [],
      warnings:      [],
    };

    for (let i = 0; i < receipts.length; i++) {
      try {
        const payload = normalizeBatchEntry(receipts[i], batchTerritory);
        const validationError = validateNormalized(payload);
        if (validationError) {
          batchResult.failCount++;
          batchResult.results.push({
            index: i,
            result: { success: false, error: validationError, createdProducts: 0,
              updatedProducts: 0, createdObservations: 0, createdHistoryMonthly: 0,
              createdHistoryYearly: 0, createdAlertEvents: 0, reviewItems: 0, warnings: [] },
          });
          continue;
        }
        const result = await receiptImportService.import(payload);
        batchResult.results.push({ index: i, result });
        if (result.success) batchResult.successCount++;
        else batchResult.failCount++;
        if (result.warnings?.length) batchResult.warnings.push(...result.warnings);
      } catch (err) {
        batchResult.failCount++;
        const message = err instanceof Error ? err.message : String(err);
        batchResult.results.push({
          index: i,
          result: { success: false, error: message, createdProducts: 0,
            updatedProducts: 0, createdObservations: 0, createdHistoryMonthly: 0,
            createdHistoryYearly: 0, createdAlertEvents: 0, reviewItems: 0, warnings: [] },
        });
      }
    }

    res.status(200).json(batchResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[POST /api/receipts/import-batch]', err);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
