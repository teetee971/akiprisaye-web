/**
 * Auto Product Creation Service
 * 
 * Handles automatic product creation from various sources:
 * - OCR from receipts
 * - Open Food Facts
 * - Open Prices
 * - Citizen contributions
 */

import { PriceSource } from '@prisma/client';
import prisma from '../../database/prisma.js';
import { normalizeProductName } from './normalization.js';
import { findDuplicate } from './deduplication.js';

export interface OCRProduct {
  rawName: string; // Raw name extracted from OCR
  price?: number;
  ean?: string | null; // If barcode detected
  storeId?: string;
  territory?: string;
  confidence: number; // OCR confidence score
}

export interface OpenFoodFactsProduct {
  code: string; // EAN/Barcode
  product_name: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_url?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
}

export interface OpenPriceProduct {
  product_code: string;
  product_name?: string;
  price: number;
  currency: string;
  location_osm_id?: string;
  date: string;
}

export interface AutoCreatedProduct {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: Date;
}

/**
 * Generate a unique productKey from normalized name and optional barcode
 */
function makeProductKey(normalizedName: string, barcode?: string | null): string {
  const base = normalizedName.toLowerCase().replace(/\s+/g, '-').slice(0, 80);
  return barcode ? `${base}__${barcode}` : `${base}__${Date.now()}`;
}

/**
 * Create product from OCR data
 */
export async function createProductFromOCR(
  ocrData: OCRProduct
): Promise<AutoCreatedProduct | null> {
  const normalizedLabel = normalizeProductName(ocrData.rawName);

  if (!normalizedLabel || normalizedLabel.length < 3) {
    console.warn('Product name too short after normalization:', ocrData.rawName);
    return null;
  }

  // Check for duplicates
  const duplicationResult = await findDuplicate({
    ean: ocrData.ean,
    name: ocrData.rawName,
  });

  if (duplicationResult.isDuplicate) {
    console.info(
      `Product already exists (${duplicationResult.matchedBy}):`,
      duplicationResult.existingProductId
    );
    return null;
  }

  // Create new product
  const product = await prisma.product.create({
    data: {
      productKey: makeProductKey(normalizedLabel, ocrData.ean),
      displayName: ocrData.rawName,
      rawLabel: ocrData.rawName,
      normalizedLabel,
      barcode: ocrData.ean ?? null,
      imageNeedsReview: false,
    },
  });

  // If price is provided, create a price observation
  if (ocrData.price && ocrData.storeId) {
    await prisma.priceObservation.create({
      data: {
        productId: product.id,
        price: ocrData.price,
        currency: 'EUR',
        storeId: ocrData.storeId,
        territory: ocrData.territory ?? 'gp',
        observedAt: new Date(),
        productLabel: ocrData.rawName,
        normalizedLabel,
        storeLabel: ocrData.storeId,
        source: 'receipt_ocr',
        confidenceScore: Math.round(ocrData.confidence * 100),
      },
    });
  }

  return {
    id: product.id,
    name: product.displayName,
    normalizedName: product.normalizedLabel,
    createdAt: product.createdAt,
  };
}

/**
 * Create product from Open Food Facts data
 */
export async function createProductFromOpenFoodFacts(
  offData: OpenFoodFactsProduct
): Promise<AutoCreatedProduct | null> {
  const normalizedLabel = normalizeProductName(offData.product_name);

  if (!normalizedLabel || normalizedLabel.length < 3) {
    console.warn('Product name too short:', offData.product_name);
    return null;
  }

  // Check for duplicates
  const duplicationResult = await findDuplicate({
    ean: offData.code,
    name: offData.product_name,
    brand: offData.brands,
    category: offData.categories,
  });

  if (duplicationResult.isDuplicate) {
    // Update existing product with OFF data if needed
    const existing = await prisma.product.findUnique({
      where: { id: duplicationResult.existingProductId },
    });

    if (existing && existing.imageSource !== 'OPENFOODFACTS') {
      // Enrich existing product with OFF data
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          brand: offData.brands ?? existing.brand,
          category: offData.categories ?? existing.category,
        },
      });
    }

    return null;
  }

  // Create new product
  const product = await prisma.product.create({
    data: {
      productKey: makeProductKey(normalizedLabel, offData.code),
      displayName: offData.product_name,
      rawLabel: offData.product_name,
      normalizedLabel,
      barcode: offData.code,
      brand: offData.brands,
      category: offData.categories,
      imageSource: offData.image_url ? 'OPENFOODFACTS' : null,
      imageNeedsReview: false,
    },
  });

  return {
    id: product.id,
    name: product.displayName,
    normalizedName: product.normalizedLabel,
    createdAt: product.createdAt,
  };
}

/**
 * Create product from Open Prices data
 */
export async function createProductFromOpenPrices(
  opData: OpenPriceProduct
): Promise<AutoCreatedProduct | null> {
  // Check for duplicates by EAN
  const duplicationResult = await findDuplicate({
    ean: opData.product_code,
    name: opData.product_name || opData.product_code,
  });

  if (duplicationResult.isDuplicate && duplicationResult.existingProductId) {
    // Add price observation to existing product
    await prisma.priceObservation.create({
      data: {
        productId: duplicationResult.existingProductId,
        price: opData.price,
        currency: opData.currency,
        territory: 'gp',
        observedAt: new Date(opData.date),
        productLabel: opData.product_name ?? opData.product_code,
        normalizedLabel: normalizeProductName(opData.product_name ?? opData.product_code),
        storeLabel: opData.location_osm_id ?? 'unknown',
        source: 'open_prices',
        barcode: opData.product_code,
      },
    });

    return null;
  }

  // If no product name, we can't create a meaningful product
  if (!opData.product_name) {
    console.warn('No product name for code:', opData.product_code);
    return null;
  }

  const normalizedLabel = normalizeProductName(opData.product_name);

  // Create new product
  const product = await prisma.product.create({
    data: {
      productKey: makeProductKey(normalizedLabel, opData.product_code),
      displayName: opData.product_name,
      rawLabel: opData.product_name,
      normalizedLabel,
      barcode: opData.product_code,
      imageNeedsReview: false,
    },
  });

  // Create price observation
  await prisma.priceObservation.create({
    data: {
      productId: product.id,
      price: opData.price,
      currency: opData.currency,
      territory: 'gp',
      observedAt: new Date(opData.date),
      productLabel: opData.product_name,
      normalizedLabel,
      storeLabel: opData.location_osm_id ?? 'unknown',
      source: 'open_prices',
      barcode: opData.product_code,
    },
  });

  return {
    id: product.id,
    name: product.displayName,
    normalizedName: product.normalizedLabel,
    createdAt: product.createdAt,
  };
}

/**
 * Batch create products with deduplication
 */
export async function batchCreateProducts<T>(
  items: T[],
  createFn: (item: T) => Promise<AutoCreatedProduct | null>
): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of items) {
    try {
      const product = await createFn(item);
      if (product) {
        created++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      errors++;
    }
  }

  return { created, skipped, errors };
}

// Keep PriceSource available for callers that import it from here
export type { PriceSource };
