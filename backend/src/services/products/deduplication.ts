/**
 * Product Deduplication Service
 * 
 * Detects duplicate products using multiple strategies:
 * 1. EAN exact match
 * 2. Normalized name exact match
 * 3. Fuzzy name matching (Levenshtein distance)
 */

import Fuse from 'fuse.js';
import prisma from '../../database/prisma.js';
import { normalizeProductName } from './normalization.js';
import { SYNC_CONFIG } from '../../config/syncConfig.js';

export interface NewProduct {
  name: string;
  ean?: string | null;
  brand?: string | null;
  category?: string | null;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingProductId?: string;
  similarity: number; // 0-1
  matchedBy: 'ean' | 'name' | 'fuzzy' | 'none';
  candidateProducts?: Array<{
    id: string;
    name: string;
    normalizedName: string;
    ean?: string | null;
    similarity: number;
  }>;
}

/**
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Find duplicate product
 */
export async function findDuplicate(
  product: NewProduct
): Promise<DeduplicationResult> {
  const normalizedName = normalizeProductName(product.name);

  // Strategy 1: Match by EAN/barcode (exact)
  if (product.ean) {
    const existingByEan = await prisma.product.findUnique({
      where: { barcode: product.ean },
      select: {
        id: true,
        displayName: true,
        normalizedLabel: true,
        barcode: true,
      },
    });

    if (existingByEan) {
      return {
        isDuplicate: true,
        existingProductId: existingByEan.id,
        similarity: 1.0,
        matchedBy: 'ean',
      };
    }
  }

  // Strategy 2: Match by normalized label (exact)
  const existingByName = await prisma.product.findFirst({
    where: { normalizedLabel: normalizedName },
    select: {
      id: true,
      displayName: true,
      normalizedLabel: true,
      barcode: true,
    },
  });

  if (existingByName) {
    return {
      isDuplicate: true,
      existingProductId: existingByName.id,
      similarity: 1.0,
      matchedBy: 'name',
    };
  }

  // Strategy 3: Fuzzy matching
  // Only perform fuzzy matching if name is long enough
  if (normalizedName.length < SYNC_CONFIG.deduplication.minNameLength) {
    return {
      isDuplicate: false,
      similarity: 0,
      matchedBy: 'none',
    };
  }

  // Get candidate products for fuzzy matching
  const candidates = await prisma.product.findMany({
    where: {
      normalizedLabel: {
        contains: normalizedName.split(' ')[0],
      },
    },
    take: SYNC_CONFIG.deduplication.maxCandidates,
    select: {
      id: true,
      displayName: true,
      normalizedLabel: true,
      barcode: true,
    },
  });

  if (candidates.length === 0) {
    return {
      isDuplicate: false,
      similarity: 0,
      matchedBy: 'none',
    };
  }

  // Calculate similarity for each candidate
  const candidatesWithSimilarity = candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.displayName,
    normalizedName: candidate.normalizedLabel,
    ean: candidate.barcode,
    similarity: calculateSimilarity(normalizedName, candidate.normalizedLabel),
  }));

  // Sort by similarity (descending)
  candidatesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  const bestMatch = candidatesWithSimilarity[0];

  // Check if best match exceeds threshold
  if (bestMatch.similarity >= SYNC_CONFIG.deduplication.fuzzyThreshold) {
    return {
      isDuplicate: true,
      existingProductId: bestMatch.id,
      similarity: bestMatch.similarity,
      matchedBy: 'fuzzy',
      candidateProducts: candidatesWithSimilarity.slice(0, 3),
    };
  }

  return {
    isDuplicate: false,
    similarity: bestMatch.similarity,
    matchedBy: 'none',
    candidateProducts: candidatesWithSimilarity.slice(0, 3),
  };
}

/**
 * Find similar products using Fuse.js
 */
export async function findSimilarProducts(
  name: string,
  limit: number = 5
): Promise<
  Array<{
    id: string;
    name: string;
    normalizedName: string;
    ean?: string | null;
    score: number;
  }>
> {
  const normalizedName = normalizeProductName(name);

  // Get all products (or a filtered subset based on first word)
  const products = await prisma.product.findMany({
    where: {
      normalizedLabel: {
        contains: normalizedName.split(' ')[0],
      },
    },
    take: 100,
    select: {
      id: true,
      displayName: true,
      normalizedLabel: true,
      barcode: true,
    },
  });

  if (products.length === 0) {
    return [];
  }

  // Configure Fuse for fuzzy search
  const fuse = new Fuse(products, {
    keys: ['normalizedLabel'],
    threshold: 0.3,
    includeScore: true,
  });

  const results = fuse.search(normalizedName);

  return results.slice(0, limit).map((result) => ({
    id: result.item.id,
    name: result.item.displayName,
    normalizedName: result.item.normalizedLabel,
    ean: result.item.barcode,
    score: 1 - (result.score || 0),
  }));
}

/**
 * Merge two products (for duplicate resolution)
 */
export async function mergeProducts(
  sourceId: string,
  targetId: string
): Promise<void> {
  // Start a transaction
  await prisma.$transaction(async (tx) => {
    const source = await tx.product.findUnique({
      where: { id: sourceId },
      include: { observations: true },
    });

    if (!source) {
      throw new Error(`Source product ${sourceId} not found`);
    }

    // Reassign all price observations to target product
    await tx.priceObservation.updateMany({
      where: { productId: sourceId },
      data: { productId: targetId },
    });

    // Delete the source product (merged into target)
    await tx.product.delete({
      where: { id: sourceId },
    });
  });
}
