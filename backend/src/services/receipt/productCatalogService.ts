/**
 * Product Catalog Service
 *
 * Gère le catalogue produits:
 * - génération de productKey stable
 * - upsert produit (create ou update enrichissement)
 * - règle de non-écrasement image haute confiance
 */

import { randomUUID } from 'node:crypto';
import prismaDefault from '../../database/prisma.js';

// ─── productKey ───────────────────────────────────────────────────────────────

/** Supprime les accents */
function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Génère une clé produit stable ASCII hyphen-separated.
 *
 * Exemples:
 *   "Coca-Cola PET 2L" → "coca-cola-pet-2l"
 *   "Lait UHT demi-écrémé U Bio 1L" → "lait-uht-demi-ecreme-u-bio-1l"
 */
export function buildProductKey(normalizedLabel: string): string {
  return removeAccents(normalizedLabel)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export interface UpsertProductInput {
  normalizedLabel: string;
  rawLabel: string;
  /** Si fourni, utilise cette clé au lieu d'auto-générer depuis le label */
  productKey?: string;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  barcode?: string | null;
  packageSizeValue?: number | null;
  packageSizeUnit?: string | null;
  primaryImageUrl?: string | null;
  imageSource?: string | null;
  imageSourceType?: string | null;
  imageConfidenceScore?: number | null;
  imageNeedsReview?: boolean;
}

export interface UpsertProductResult {
  id: string;
  productKey: string;
  created: boolean;
  imageUpdated: boolean;
}

const IMAGE_HIGH_CONFIDENCE_THRESHOLD = 80;

export class ProductCatalogService {

  constructor(private readonly prisma = prismaDefault) {}

  /**
   * Crée ou met à jour un produit dans le catalogue.
   *
   * Règles:
   * - Si le produit n'existe pas → créer
   * - Si le produit existe:
   *   - mettre à jour les champs manquants
   *   - ne PAS écraser une image de haute confiance par une image plus faible
   */
  async upsertProduct(input: UpsertProductInput): Promise<UpsertProductResult> {
    const productKey = input.productKey ?? buildProductKey(input.normalizedLabel);

    const existing = await this.prisma.product.findUnique({ where: { productKey } });

    if (!existing) {
      const created = await this.prisma.product.create({
        data: {
          id: randomUUID(),
          productKey,
          displayName: input.normalizedLabel,
          rawLabel: input.rawLabel,
          normalizedLabel: input.normalizedLabel,
          brand: input.brand ?? null,
          category: input.category ?? null,
          subcategory: input.subcategory ?? null,
          barcode: input.barcode ?? null,
          packageSizeValue: input.packageSizeValue ?? null,
          packageSizeUnit: input.packageSizeUnit ?? null,
          primaryImageUrl: input.primaryImageUrl ?? null,
          imageSource: input.imageSource ?? null,
          imageSourceType: input.imageSourceType ?? null,
          imageConfidenceScore: input.imageConfidenceScore ?? null,
          imageNeedsReview: input.imageNeedsReview ?? false,
        },
      });
      return { id: created.id, productKey, created: true, imageUpdated: false };
    }

    // Calcul si on doit mettre à jour l'image
    const existingScore = existing.imageConfidenceScore ?? 0;
    const incomingScore = input.imageConfidenceScore ?? 0;
    const shouldUpdateImage =
      input.primaryImageUrl != null &&
      (existing.primaryImageUrl == null || incomingScore > existingScore) &&
      !(existingScore >= IMAGE_HIGH_CONFIDENCE_THRESHOLD && incomingScore < existingScore);

    await this.prisma.product.update({
      where: { productKey },
      data: {
        // Toujours mettre à jour les champs enrichissement si null
        brand: existing.brand ?? input.brand ?? null,
        category: existing.category ?? input.category ?? null,
        subcategory: existing.subcategory ?? input.subcategory ?? null,
        barcode: existing.barcode ?? input.barcode ?? null,
        packageSizeValue: existing.packageSizeValue ?? input.packageSizeValue ?? null,
        packageSizeUnit: existing.packageSizeUnit ?? input.packageSizeUnit ?? null,
        // Image: ne mettre à jour que si pertinent
        ...(shouldUpdateImage
          ? {
              primaryImageUrl: input.primaryImageUrl,
              imageSource: input.imageSource,
              imageSourceType: input.imageSourceType,
              imageConfidenceScore: incomingScore,
              imageNeedsReview: input.imageNeedsReview ?? false,
            }
          : {}),
      },
    });

    return { id: existing.id, productKey, created: false, imageUpdated: shouldUpdateImage };
  }

  async findByProductKey(productKey: string) {
    return this.prisma.product.findUnique({ where: { productKey } });
  }

  async findByBarcode(barcode: string) {
    return this.prisma.product.findUnique({ where: { barcode } });
  }
}

export const productCatalogService = new ProductCatalogService();
