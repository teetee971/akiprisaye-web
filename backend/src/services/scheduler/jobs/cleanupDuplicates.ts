/**
 * Job: Cleanup Duplicates
 * 
 * Scheduled job to find and mark duplicate products
 */

import prisma from '../../../database/prisma.js';
import { findDuplicate } from '../../products/deduplication.js';

export async function cleanupDuplicatesJob(): Promise<void> {
  console.info('🧹 [JOB] Starting duplicate cleanup...');

  try {
    const batchSize = 500;
    let skip = 0;

    let duplicatesFound = 0;
    let duplicatesMarked = 0;

    // Process products in batches to avoid loading all at once
    while (true) {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: batchSize,
      });

      if (products.length === 0) {
        break;
      }

      // Check each product in the current batch for duplicates
      for (const product of products) {
        try {
          const duplicationResult = await findDuplicate({
            ean: product.barcode,
            name: product.normalizedLabel,
            brand: product.brand,
            category: product.category,
          });

          if (
            duplicationResult.isDuplicate &&
            duplicationResult.existingProductId &&
            duplicationResult.existingProductId !== product.id
          ) {
            duplicatesFound++;

            // Check if existing product was created before this one
            const existingProduct = await prisma.product.findUnique({
              where: { id: duplicationResult.existingProductId },
            });

            if (
              existingProduct &&
              existingProduct.createdAt < product.createdAt
            ) {
              // Move price observations to existing product
              await prisma.priceObservation.updateMany({
                where: { productId: product.id },
                data: { productId: existingProduct.id },
              });

              duplicatesMarked++;
              console.info(
                `🔗 [JOB] Merged duplicate: ${product.normalizedLabel} -> ${existingProduct.normalizedLabel}`
              );
            }
          }
        } catch (error) {
          console.error(
            `⚠️  [JOB] Error checking product ${product.id}:`,
            error
          );
        }
      }

      skip += batchSize;
    }

    console.info(
      `✅ [JOB] Duplicate cleanup completed: ${duplicatesFound} found, ${duplicatesMarked} merged`
    );
  } catch (error) {
    console.error('❌ [JOB] Duplicate cleanup failed:', error);
    throw error;
  }
}
