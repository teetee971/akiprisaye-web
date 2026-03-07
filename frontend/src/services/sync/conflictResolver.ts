/**
 * Service de résolution de conflits et déduplication
 */

import type {
  Product,
  ConflictResolution,
  ConflictStrategy,
  OFFProduct,
} from './types';
import { mapOFFToProduct } from './openFoodFactsService';

/**
 * Configuration par défaut de résolution de conflits
 */
export const DEFAULT_CONFLICT_RESOLUTION: ConflictResolution = {
  strategy: 'newest_wins',
  compareFields: ['nom', 'marque', 'contenance', 'imageUrl'],
  deduplicationThreshold: 0.85, // 85% de similarité
};

/**
 * Calcule la similarité entre deux chaînes (algorithme de Jaro-Winkler simplifié)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const longer = str1.length > str2.length ? str1 : str2;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
    Array.from({ length: str1.length + 1 }, () => 0),
  );

  for (let i = 0; i <= str2.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length] ?? 0;
}

/**
 * Calcule le score de similarité entre deux produits
 */
export function calculateSimilarity(
  product1: Product,
  product2: Product,
  fields: string[] = DEFAULT_CONFLICT_RESOLUTION.compareFields
): number {
  let totalScore = 0;
  let fieldCount = 0;

  for (const field of fields) {
    const value1 = product1[field as keyof Product];
    const value2 = product2[field as keyof Product];

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      totalScore += stringSimilarity(value1, value2);
      fieldCount++;
    } else if (typeof value1 === 'number' && typeof value2 === 'number') {
      // Pour les nombres, on calcule la proximité relative
      const max = Math.max(Math.abs(value1), Math.abs(value2));
      if (max > 0) {
        const diff = Math.abs(value1 - value2);
        totalScore += 1 - (diff / max);
        fieldCount++;
      }
    }
  }

  return fieldCount > 0 ? totalScore / fieldCount : 0;
}

/**
 * Vérifie si deux produits sont des doublons
 */
export function isDuplicate(
  product1: Product,
  product2: Product,
  threshold: number = DEFAULT_CONFLICT_RESOLUTION.deduplicationThreshold
): boolean {
  // Si même EAN, c'est un doublon évident
  if (product1.ean === product2.ean) {
    return true;
  }

  // Sinon, on calcule la similarité
  const similarity = calculateSimilarity(product1, product2);
  return similarity >= threshold;
}

/**
 * Résout un conflit entre un produit local et un produit distant
 */
export function resolveConflict(
  local: Product,
  remote: OFFProduct | Product,
  strategy: ConflictStrategy = 'newest_wins'
): Product {
  // Convertir remote en Product si c'est un OFFProduct
  const remoteProduct = 'code' in remote ? mapOFFToProduct(remote) as Product : remote;

  // Si le produit local a été modifié manuellement, priorité locale
  if (local.metadata?.manuallyEdited) {
    return {
      ...local,
      metadata: {
        ...local.metadata,
        lastSync: new Date().toISOString(),
      },
    };
  }

  switch (strategy) {
    case 'local_wins':
      return local;

    case 'remote_wins':
      return {
        ...remoteProduct,
        id: local.id ?? remoteProduct.id ?? remoteProduct.ean, // Conserver un ID déterministe
        metadata: {
          ...remoteProduct.metadata,
          lastSync: new Date().toISOString(),
        },
      };

    case 'newest_wins': {
      const localDate = local.metadata?.lastSync ? new Date(local.metadata.lastSync) : new Date(0);
      const remoteDate = remoteProduct.metadata?.lastSync ? new Date(remoteProduct.metadata.lastSync) : new Date();

      if (remoteDate > localDate) {
        return {
          ...remoteProduct,
          id: local.id ?? remoteProduct.id ?? remoteProduct.ean,
          metadata: {
            ...remoteProduct.metadata,
            lastSync: new Date().toISOString(),
          },
        };
      }
      return local;
    }

    case 'manual':
    default:
      // En mode manuel, on fusionne intelligemment
      return mergeProducts(local, remoteProduct);
  }
}

/**
 * Fusionne deux produits en gardant les meilleures données de chaque
 */
export function mergeProducts(local: Product, remote: Product): Product {
  return {
    id: local.id ?? remote.id ?? local.ean ?? remote.ean,
    ean: local.ean || remote.ean,
    nom: remote.nom || local.nom,
    marque: remote.marque || local.marque,
    categorie: remote.categorie || local.categorie,
    contenance: remote.contenance || local.contenance,
    unite: remote.unite || local.unite,
    imageUrl: remote.imageUrl || local.imageUrl,
    metadata: {
      ...local.metadata,
      ...remote.metadata,
      lastSync: new Date().toISOString(),
    },
  };
}

/**
 * Déduplique une liste de produits
 */
export function deduplicateProducts(
  products: Product[],
  threshold: number = DEFAULT_CONFLICT_RESOLUTION.deduplicationThreshold
): Product[] {
  const uniqueProducts: Product[] = [];
  const processedEans = new Set<string>();

  for (const product of products) {
    // Si déjà traité, skip
    if (processedEans.has(product.ean)) {
      continue;
    }

    // Chercher des doublons
    let isDupe = false;
    for (const unique of uniqueProducts) {
      if (isDuplicate(product, unique, threshold)) {
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      uniqueProducts.push(product);
      processedEans.add(product.ean);
    }
  }

  return uniqueProducts;
}

/**
 * Trouve les conflits dans une liste de produits
 */
export function findConflicts(
  localProducts: Product[],
  remoteProducts: Product[],
  threshold: number = DEFAULT_CONFLICT_RESOLUTION.deduplicationThreshold
): Array<{ local: Product; remote: Product; similarity: number }> {
  const conflicts: Array<{ local: Product; remote: Product; similarity: number }> = [];

  for (const remote of remoteProducts) {
    for (const local of localProducts) {
      if (local.ean === remote.ean || isDuplicate(local, remote, threshold)) {
        const similarity = calculateSimilarity(local, remote);
        conflicts.push({ local, remote, similarity });
      }
    }
  }

  return conflicts;
}

/**
 * Résout tous les conflits automatiquement
 */
export function resolveAllConflicts(
  conflicts: Array<{ local: Product; remote: Product; similarity: number }>,
  strategy: ConflictStrategy = 'newest_wins'
): Product[] {
  return conflicts.map(conflict => 
    resolveConflict(conflict.local, conflict.remote, strategy)
  );
}

/**
 * Export du service
 */
export const conflictResolverService = {
  resolveConflict,
  mergeProducts,
  calculateSimilarity,
  isDuplicate,
  deduplicateProducts,
  findConflicts,
  resolveAllConflicts,
  DEFAULT_CONFLICT_RESOLUTION,
};

export default conflictResolverService;
