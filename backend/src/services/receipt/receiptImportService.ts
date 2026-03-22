/**
 * Receipt Import Service
 *
 * Orchestrateur principal du pipeline d'ingestion d'un ticket OCR.
 *
 * Pipeline:
 *  1.  Valider le payload
 *  2.  Normaliser territoire / store / labels
 *  3.  Calculer checksum (déduplication)
 *  4.  Upsert store
 *  5.  Créer receipt (avec protection doublon via checksum)
 *  6.  Pour chaque ligne:
 *      a. Upsert product
 *      b. Créer receipt_item
 *      c. Créer price_observation
 *      d. Mettre à jour historique mensuel + annuel
 *      e. Évaluer alertes prix
 *      f. Si needsReview → enqueue review queue
 *  7.  Retourner ImportReceiptResult
 *
 * Contraintes:
 * - Ne jamais halluciner un produit ou un prix
 * - Propager confidenceScore et needsReview
 * - Tolérer les erreurs ligne par ligne (un item raté ne bloque pas l'import)
 */

import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import prismaDefault from '../../database/prisma.js';
import { productCatalogService } from './productCatalogService.js';
import { priceObservationService } from './priceObservationService.js';
import { priceHistoryAggregationService } from './priceHistoryAggregationService.js';
import { priceAlertService } from './priceAlertService.js';
import { reviewQueueService } from './reviewQueueService.js';
import type {
  ImportReceiptPayload,
  ImportReceiptResult,
  TerritoryCode,
  ReceiptItemInput,
} from '../../types/receipt.types.js';

// ─── Checksum ─────────────────────────────────────────────────────────────────

/**
 * Calcule un checksum SHA-256 unique pour un ticket.
 * Basé sur: storeNormalizedName + territory + date + totalTtc + itemCount
 */
function computeReceiptChecksum(payload: ImportReceiptPayload): string {
  const key =
    `${payload.store.normalizedName.toLowerCase()}|` +
    `${payload.store.territory}|` +
    `${payload.receipt.receiptDate}|` +
    `${payload.receipt.receiptTime ?? ''}|` +
    `${payload.receipt.totalTtc}|` +
    `${payload.items.length}`;
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

// ─── Territory normalizer ─────────────────────────────────────────────────────

const VALID_TERRITORY_CODES: TerritoryCode[] = [
  'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf', 'fr',
];

function normalizeTerritory(raw: string): TerritoryCode {
  const lower = raw.toLowerCase().trim();
  if (VALID_TERRITORY_CODES.includes(lower as TerritoryCode)) return lower as TerritoryCode;
  // Fallback: essai par nom long
  const MAP: Record<string, TerritoryCode> = {
    guadeloupe: 'gp',
    martinique: 'mq',
    'guyane française': 'gf',
    'la réunion': 're',
    mayotte: 'yt',
    'saint-pierre-et-miquelon': 'pm',
    'saint-barthélemy': 'bl',
    'saint-martin': 'mf',
    france: 'fr',
  };
  return MAP[lower] ?? 'gp';
}

// ─── Label helpers ────────────────────────────────────────────────────────────

function parsePackageSize(
  sizeText?: string | null,
): { value: number | null; unit: string | null } {
  if (!sizeText) return { value: null, unit: null };
  const m = sizeText.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|cl|l|ml|oz)?$/i);
  if (!m) return { value: null, unit: null };
  return {
    value: parseFloat(m[1].replace(',', '.')),
    unit: m[2]?.toLowerCase() ?? null,
  };
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class ReceiptImportService {
  private readonly prisma: typeof prismaDefault;

  constructor(prismaClient: typeof prismaDefault = prismaDefault) {
    this.prisma = prismaClient;
  }

  async import(payload: ImportReceiptPayload): Promise<ImportReceiptResult> {
    const result: ImportReceiptResult = {
      success: false,
      createdProducts: 0,
      updatedProducts: 0,
      createdObservations: 0,
      createdHistoryMonthly: 0,
      createdHistoryYearly: 0,
      createdAlertEvents: 0,
      reviewItems: 0,
      warnings: [],
    };

    // ── 1. Validate ───────────────────────────────────────────────────────────
    if (!payload.store?.normalizedName) {
      return { ...result, error: 'store.normalizedName is required' };
    }
    if (!payload.receipt?.receiptDate) {
      return { ...result, error: 'receipt.receiptDate is required' };
    }
    if (payload.receipt.totalTtc == null) {
      return { ...result, error: 'receipt.totalTtc is required' };
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return { ...result, error: 'items array is required and must not be empty' };
    }

    // ── 2. Normalise ──────────────────────────────────────────────────────────
    const territory = normalizeTerritory(payload.store.territory ?? 'gp');

    const receiptDate = new Date(
      `${payload.receipt.receiptDate}${payload.receipt.receiptTime ? 'T' + payload.receipt.receiptTime : 'T00:00:00'}`
    );
    if (isNaN(receiptDate.getTime())) {
      return { ...result, error: `Invalid receiptDate: ${payload.receipt.receiptDate}` };
    }

    // ── 3. Checksum ───────────────────────────────────────────────────────────
    const checksum = computeReceiptChecksum(payload);
    const existingReceipt = await this.prisma.receipt.findUnique({ where: { checksum } });
    if (existingReceipt) {
      return {
        ...result,
        success: true,
        receiptId: existingReceipt.id,
        warnings: ['Ticket déjà importé (checksum identique) — import ignoré'],
      };
    }

    // ── 4. Upsert Store ───────────────────────────────────────────────────────
    let store = await this.prisma.store.findFirst({
      where: {
        normalizedName: payload.store.normalizedName,
        territory,
      },
    });

    if (!store) {
      store = await this.prisma.store.create({
        data: {
          id: randomUUID(),
          normalizedName: payload.store.normalizedName,
          rawName: payload.store.rawName ?? null,
          brand: payload.store.brand ?? null,
          company: payload.store.company ?? null,
          siret: payload.store.siret ?? null,
          phone: payload.store.phone ?? null,
          address: payload.store.address ?? null,
          postalCode: payload.store.postalCode ?? null,
          city: payload.store.city ?? null,
          territory,
        },
      });
    }

    // ── 5. Create Receipt ─────────────────────────────────────────────────────
    const receipt = await this.prisma.receipt.create({
      data: {
        id: randomUUID(),
        source: 'ocr_ticket',
        storeId: store.id,
        territory,
        receiptDate,
        receiptTime: payload.receipt.receiptTime ?? null,
        currency: payload.receipt.currency ?? 'EUR',
        itemsCount: payload.receipt.itemsCount ?? payload.items.length,
        linesCount: payload.receipt.linesCount ?? payload.items.length,
        subtotalHt: payload.receipt.subtotalHt ?? null,
        totalTtc: payload.receipt.totalTtc,
        rawOcrText: payload.receipt.rawOcrText ?? payload.rawOcrText ?? null,
        confidenceScore: Math.round((payload.receipt.confidenceScore ?? 0) * 100),
        needsReview: payload.receipt.needsReview ?? false,
        checksum,
      },
    });

    result.receiptId = receipt.id;
    result.storeId = store.id;

    // ── 6. Process each item ──────────────────────────────────────────────────
    for (const item of payload.items) {
      try {
        await this._processItem(item, receipt.id, store, territory, receiptDate, result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.warnings.push(`Item [${item.lineIndex}] "${item.rawLabel}": ${msg}`);
      }
    }

    result.success = true;
    return result;
  }

  private async _processItem(
    item: ReceiptItemInput,
    receiptId: string,
    store: { id: string; normalizedName: string },
    territory: TerritoryCode,
    observedAt: Date,
    result: ImportReceiptResult,
  ): Promise<void> {
    const normalizedLabel = item.normalizedLabel ?? item.rawLabel;
    const confidenceScore = item.confidenceScore ?? 0;
    const needsReview = item.needsReview ?? false;

    // Parse package size from sizeText if packageSize fields absent
    const { value: pkgValue, unit: pkgUnit } = parsePackageSize(
      item.packageSizeValue == null ? (item as unknown as { sizeText?: string }).sizeText : null,
    );

    // a. Upsert product
    const productResult = await productCatalogService.upsertProduct({
      normalizedLabel,
      rawLabel: item.rawLabel,
      productKey: item.productKey,          // explicit key takes precedence
      brand: item.brand,
      category: item.category,
      subcategory: item.subcategory,
      barcode: item.barcode,
      packageSizeValue: item.packageSizeValue ?? pkgValue,
      packageSizeUnit: item.packageSizeUnit ?? pkgUnit,
    });

    if (productResult.created) result.createdProducts++;
    else result.updatedProducts++;

    // b. Compute unit price
    const qty = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? (qty > 1 ? +(item.totalPrice / qty).toFixed(4) : item.totalPrice);

    // c. Create receipt_item
    const receiptItem = await this.prisma.receiptItem.create({
      data: {
        id: randomUUID(),
        receiptId,
        lineIndex: item.lineIndex,
        rawLabel: item.rawLabel,
        normalizedLabel,
        brand: item.brand ?? null,
        category: item.category ?? null,
        subcategory: item.subcategory ?? null,
        quantity: qty !== 1 ? qty : null,
        unit: item.unit ?? null,
        packageSizeValue: item.packageSizeValue ?? pkgValue ?? null,
        packageSizeUnit: item.packageSizeUnit ?? pkgUnit ?? null,
        unitPrice,
        totalPrice: item.totalPrice,
        vatRate: item.vatRate ?? null,
        barcode: item.barcode ?? null,
        productId: productResult.id,
        confidenceScore: Math.round(confidenceScore * 100),
        needsReview,
        notes: item.notes ?? (item.reviewNote ? `[Review] ${item.reviewNote}` : null),
      },
    });

    // d. Create price observation
    const obsId = await priceObservationService.create({
      source: 'receipt_ocr',
      receiptId,
      receiptItemId: receiptItem.id,
      productId: productResult.id,
      territory,
      storeId: store.id,
      storeLabel: store.normalizedName,
      observedAt,
      productLabel: item.rawLabel,
      normalizedLabel,
      category: item.category,
      brand: item.brand,
      barcode: item.barcode,
      quantity: qty !== 1 ? qty : null,
      unit: item.unit,
      packageSizeValue: item.packageSizeValue ?? pkgValue,
      packageSizeUnit: item.packageSizeUnit ?? pkgUnit,
      price: item.totalPrice,
      currency: 'EUR',
      confidenceScore,
      needsReview,
    });
    result.createdObservations++;
    void obsId;

    // e. Update history (monthly + yearly)
    const histResult = await priceHistoryAggregationService.update(
      productResult.id,
      territory,
      observedAt,
      item.totalPrice,
    );
    if (histResult.monthlyCreated) result.createdHistoryMonthly++;
    if (histResult.yearlyCreated) result.createdHistoryYearly++;

    // f. Evaluate price alerts
    const alertCount = await priceAlertService.evaluate(
      productResult.id,
      territory,
      observedAt,
      item.totalPrice,
      store.normalizedName,
    );
    result.createdAlertEvents += alertCount;

    // g. Review queue if item is flagged
    if (needsReview || confidenceScore < 0.7) {
      await reviewQueueService.enqueue({
        entityType: 'receipt_item',
        entityId: receiptItem.id,
        reason: needsReview
          ? 'Item marqué needsReview par le pipeline OCR'
          : `Score de confiance faible: ${(confidenceScore * 100).toFixed(0)}%`,
        payloadJson: {
          rawLabel: item.rawLabel,
          normalizedLabel,
          confidenceScore,
          totalPrice: item.totalPrice,
          productKey: productResult.productKey,
        },
      });
      result.reviewItems++;
    }
  }
}

export const receiptImportService = new ReceiptImportService();
