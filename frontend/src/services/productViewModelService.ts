/**
 * Product View Model Service
 * Transforms ProductResult from eanProductService into UI-ready ProductViewModel
 * Part of PR #2 - Product Enrichment UI
 */

import type { ProductResult } from '../types/ean';
import type { ProductViewModel } from '../types/productViewModel';
import { TERRITOIRE_LABELS, SOURCE_LABELS, STATUS_LABELS } from '../types/productViewModel';
import { isConfirmedProduct, isPartialProduct, isNonReferencedProduct } from './eanProductService';

/**
 * Transform ProductResult to ProductViewModel for UI display
 *
 * @param product - Product result from eanProductService
 * @returns View model ready for UI rendering
 */
export function toProductViewModel(product: ProductResult): ProductViewModel {
  // Determine status color based on product status
  const statusColor =
    product.status === 'confirmé' ? 'green' : product.status === 'partiel' ? 'yellow' : 'gray';

  // Check if data comes from citizen observations
  const isCitizenData = product.traceability.source === 'observation_citoyenne';

  // Format price if available
  let prix: string | undefined;
  if (isConfirmedProduct(product) && product.prix !== undefined) {
    prix = `${product.prix.toFixed(2)} ${product.devise || '€'}`;
  }

  // Format date
  const dateObservation = new Date(product.traceability.dateObservation).toLocaleDateString(
    'fr-FR',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return {
    // Core identity
    ean: product.ean,
    nom: product.nom || 'Produit inconnu',
    marque: isConfirmedProduct(product) ? product.marque : 'Non spécifiée',
    categorie: isConfirmedProduct(product) ? product.categorie : 'Non spécifiée',

    // Product details
    contenance: isConfirmedProduct(product) ? product.contenance : undefined,
    prix,

    // Status & reliability
    status: product.status,
    statusLabel: STATUS_LABELS[product.status],
    statusColor,
    isCitizenData,

    // Traceability display
    source: product.traceability.source,
    sourceLabel: SOURCE_LABELS[product.traceability.source],
    territoire: product.traceability.territoire,
    territoireLabel: TERRITOIRE_LABELS[product.traceability.territoire],
    magasin: product.traceability.magasin,
    dateObservation,

    // Visual
    imageUrl: isConfirmedProduct(product) ? product.imageUrl : undefined,
    hasImage: isConfirmedProduct(product) && !!product.imageUrl,

    // User photos (empty for now, will be populated from separate service)
    userPhotos: [],
  };
}

/**
 * Get badge text for product status
 */
export function getStatusBadgeText(status: ProductViewModel['status']): string {
  return STATUS_LABELS[status];
}

/**
 * Get accessibility label for product status
 */
export function getStatusAriaLabel(viewModel: ProductViewModel): string {
  if (viewModel.isCitizenData) {
    return `${viewModel.statusLabel} - Données citoyennes`;
  }
  return viewModel.statusLabel;
}

/**
 * Check if product has complete information for display
 */
export function hasCompleteInfo(viewModel: ProductViewModel): boolean {
  return (
    viewModel.status === 'confirmé' &&
    viewModel.marque !== 'Non spécifiée' &&
    viewModel.categorie !== 'Non spécifiée'
  );
}

/**
 * Get display-ready product subtitle
 * Format: "Marque • Catégorie • Contenance"
 */
export function getProductSubtitle(viewModel: ProductViewModel): string {
  const parts: string[] = [];

  if (viewModel.marque && viewModel.marque !== 'Non spécifiée') {
    parts.push(viewModel.marque);
  }

  if (viewModel.categorie && viewModel.categorie !== 'Non spécifiée') {
    parts.push(viewModel.categorie);
  }

  if (viewModel.contenance) {
    parts.push(viewModel.contenance);
  }

  return parts.join(' • ') || 'Informations non disponibles';
}

/**
 * Get traceability info text
 * Format: "Source • Territoire • Date"
 */
export function getTraceabilityText(viewModel: ProductViewModel): string {
  const parts: string[] = [viewModel.sourceLabel, viewModel.territoireLabel];

  if (viewModel.magasin) {
    parts.push(viewModel.magasin);
  }

  return `${parts.join(' • ')} • ${viewModel.dateObservation}`;
}
