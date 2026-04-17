/**
 * Manual Fallback Source
 *
 * Dernier recours quand aucune source automatique n'a trouvé d'image fiable.
 *
 * Ce module ne cherche PAS d'image — il crée une entrée dans la review queue
 * pour validation manuelle.
 *
 * Cas traités:
 * - Produit ambigu (patterns connus: hitcoko, museau de bœuf, etc.)
 * - Score insuffisant sur toutes les autres sources
 * - Aucun résultat trouvé
 * - Catégorie non alimentaire (hors périmètre OFF)
 *
 * Le résultat est toujours needsReview=true, image=null.
 */

import type {
  ImageCandidate,
  ImageSourceAdapter,
  ProductDescriptor,
} from '../../types/product-image';

// ─────────────────────────────────────────────────────────────────────────────
// Patterns de produits à placer systématiquement en revue manuelle
// ─────────────────────────────────────────────────────────────────────────────

const ALWAYS_REVIEW_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /sucre\s+b[âa]tonnets/i, reason: 'Produit très spécifique, peu couvert par OFF' },
  { pattern: /museau\s+de?\s+b[œoe]uf/i, reason: 'Charcuterie traiteur — faible couverture OFF' },
  { pattern: /saucisson\s+ail/i, reason: 'Charcuterie générique — marque absente' },
  { pattern: /fromage\s+past[a-z]*\s+noix/i, reason: 'Fromage spécifique — libellé incomplet' },
  { pattern: /parmigiano\s+r[âa]p[eé]/i, reason: 'Fromage AOP — plusieurs marques possibles' },
  { pattern: /emmental\s+r[âa]p[eé]/i, reason: 'Fromage générique — marque absente' },
  { pattern: /hitcoko/i, reason: 'Marque inconnue / peu courante' },
];

/**
 * Retourne true et la raison si le produit doit être mis en revue directement.
 */
export function shouldForceManualReview(label: string): { force: boolean; reason: string } {
  for (const { pattern, reason } of ALWAYS_REVIEW_PATTERNS) {
    if (pattern.test(label)) {
      return { force: true, reason };
    }
  }
  return { force: false, reason: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual fallback adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adaptateur fallback manuel.
 *
 * Ne cherche PAS d'image. Retourne toujours [].
 * La review queue est gérée par le resolver en aval quand tous les autres
 * adaptateurs ont échoué.
 *
 * Cet adaptateur sert de marqueur de fin de chaîne pour le resolver.
 */
export const manualFallbackSource: ImageSourceAdapter = {
  name: 'ManualFallback',

  async search(_product: ProductDescriptor): Promise<ImageCandidate[]> {
    // Intentionnellement vide — le fallback est déclenché par le resolver
    // quand chooseBestImage() ne trouve rien de fiable.
    return [];
  },
};

/** Source de données pour la documentation des produits ambigus */
export const AMBIGUOUS_PRODUCTS_DOC = ALWAYS_REVIEW_PATTERNS.map((e) => ({
  pattern: e.pattern.source,
  reason: e.reason,
}));
