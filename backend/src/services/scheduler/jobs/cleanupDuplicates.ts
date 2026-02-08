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
    // Get all validated products
    const products = await prisma.product.findMany({
      where: {
        status: 'VALIDATED',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let duplicatesFound = 0;
    let duplicatesMarked = 0;

    // Check each product for duplicates
    for (const product of products) {
      try {
        const duplicationResult = await findDuplicate({
          ean: product.ean,
          name: product.name,
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
            // Mark this product as duplicate (keep the older one)
            await prisma.$transaction(async (tx) => {
              // Move prices to existing product
              await tx.productPrice.updateMany({
                where: { productId: product.id },
                data: { productId: existingProduct.id },
              });

              // Mark as merged
              await tx.product.update({
                where: { id: product.id },
                data: {
                  status: 'MERGED',
                  validatedAt: new Date(),
                },
              });
            });

            duplicatesMarked++;
            console.info(
              `🔗 [JOB] Merged duplicate: ${product.name} -> ${existingProduct.name}`
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

    console.info(
      `✅ [JOB] Duplicate cleanup completed: ${duplicatesFound} found, ${duplicatesMarked} merged`
    );
  } catch (error) {
    console.error('❌ [JOB] Duplicate cleanup failed:', error);
    throw error;
  }
}
