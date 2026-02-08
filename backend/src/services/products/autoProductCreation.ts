/**
 * Auto Product Creation Service
 * 
 * Handles automatic product creation from various sources:
 * - OCR from receipts
 * - Open Food Facts
 * - Open Prices
 * - Citizen contributions
 */

import { ProductSource, ProductStatus } from '@prisma/client';
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
  source: ProductSource;
  status: ProductStatus;
  createdAt: Date;
  validatedBy?: string | null;
}

/**
 * Create product from OCR data
 */
export async function createProductFromOCR(
  ocrData: OCRProduct
): Promise<AutoCreatedProduct | null> {
  const normalizedName = normalizeProductName(ocrData.rawName);

  if (!normalizedName || normalizedName.length < 3) {
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
      ean: ocrData.ean,
      name: ocrData.rawName,
      normalizedName,
      source: 'OCR',
      status: 'PENDING_REVIEW', // OCR products always need review
    },
  });

  // If price is provided, create a price entry
  if (ocrData.price && ocrData.storeId) {
    await prisma.productPrice.create({
      data: {
        productId: product.id,
        productCode: ocrData.ean || undefined,
        price: ocrData.price,
        currency: 'EUR',
        storeId: ocrData.storeId,
        territory: ocrData.territory,
        date: new Date(),
        source: 'OCR',
      },
    });
  }

  return product;
}

/**
 * Create product from Open Food Facts data
 */
export async function createProductFromOpenFoodFacts(
  offData: OpenFoodFactsProduct
): Promise<AutoCreatedProduct | null> {
  const normalizedName = normalizeProductName(offData.product_name);

  if (!normalizedName || normalizedName.length < 3) {
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

    if (existing && existing.source !== 'OPENFOODFACTS') {
      // Enrich existing product with OFF data
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          brand: offData.brands || existing.brand,
          category: offData.categories || existing.category,
          quantity: offData.quantity || existing.quantity,
          imageUrl: offData.image_url || existing.imageUrl,
          nutriscoreGrade: offData.nutriscore_grade || existing.nutriscoreGrade,
          ecoscoreGrade: offData.ecoscore_grade || existing.ecoscoreGrade,
        },
      });
    }

    return null;
  }

  // Determine status based on data quality
  const status: ProductStatus =
    offData.nutriscore_grade && offData.ecoscore_grade
      ? 'VALIDATED' // Auto-validate if quality data is present
      : 'PENDING_REVIEW';

  // Create new product
  const product = await prisma.product.create({
    data: {
      ean: offData.code,
      name: offData.product_name,
      normalizedName,
      brand: offData.brands,
      category: offData.categories,
      quantity: offData.quantity,
      imageUrl: offData.image_url,
      nutriscoreGrade: offData.nutriscore_grade,
      ecoscoreGrade: offData.ecoscore_grade,
      source: 'OPENFOODFACTS',
      status,
      validatedAt: status === 'VALIDATED' ? new Date() : undefined,
    },
  });

  return product;
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

  if (duplicationResult.isDuplicate) {
    // Add price to existing product
    await prisma.productPrice.create({
      data: {
        productId: duplicationResult.existingProductId!,
        productCode: opData.product_code,
        price: opData.price,
        currency: opData.currency,
        locationOsmId: opData.location_osm_id,
        date: new Date(opData.date),
        source: 'OPENPRICES',
      },
    });

    return null;
  }

  // If no product name, we can't create a meaningful product
  if (!opData.product_name) {
    console.warn('No product name for code:', opData.product_code);
    return null;
  }

  const normalizedName = normalizeProductName(opData.product_name);

  // Create new product
  const product = await prisma.product.create({
    data: {
      ean: opData.product_code,
      name: opData.product_name,
      normalizedName,
      source: 'OPENPRICES',
      status: 'PENDING_REVIEW',
    },
  });

  // Create price entry
  await prisma.productPrice.create({
    data: {
      productId: product.id,
      productCode: opData.product_code,
      price: opData.price,
      currency: opData.currency,
      locationOsmId: opData.location_osm_id,
      date: new Date(opData.date),
      source: 'OPENPRICES',
    },
  });

  return product;
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
