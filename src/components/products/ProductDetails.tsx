/**
 * ProductDetails Component
 * Mobile-first product information display with citizen data badges
 * Part of PR #2 - Product Enrichment UI
 * 
 * Consumes: ProductResult from eanProductService (PR #1)
 * Does NOT include: Scanning, OCR, camera features (reserved for PR #3)
 */

import { useState, useEffect } from 'react';
import type { ProductViewModel, UserPhoto } from '../types/productViewModel';
import { getProductSubtitle, getTraceabilityText, hasCompleteInfo } from '../services/productViewModelService';
import { getProductImageOrFallback } from '../utils/productImageFallback';

interface ProductDetailsProps {
  product: ProductViewModel;
  onClose?: () => void;
  onReportError?: () => void;
}

export default function ProductDetails({ product, onClose, onReportError }: ProductDetailsProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('');
  const [imageFallbackAttempted, setImageFallbackAttempted] = useState(false);

  // Get image with fallback on mount and when product changes
  useEffect(() => {
    const imageUrl = getProductImageOrFallback(product.imageUrl, {
      category: product.categorie,
      productName: product.nom
    });
    setDisplayImageUrl(imageUrl);
    setImageFallbackAttempted(false); // Reset fallback flag when product changes
  }, [product.imageUrl, product.categorie, product.nom]);

  // Status badge styling
  const statusBadgeClass = 
    product.statusColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
    product.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  const isComplete = hasCompleteInfo(product);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header with close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Fiche Produit
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Disclaimer Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-blue-900 dark:text-blue-200 mb-1">
                Données observées et agrégées
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Ces informations sont issues de données publiques et contributions citoyennes. Aucune interprétation, recommandation ou conseil n'est fourni. Vérifiez toujours les informations sur l'emballage du produit.
              </p>
            </div>
          </div>
        </div>

        {/* Product Image or Placeholder */}
        <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={product.nom}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if image fails to load - but only attempt once to prevent infinite loops
                if (!imageFallbackAttempted) {
                  setImageFallbackAttempted(true);
                  const fallbackUrl = getProductImageOrFallback(null, {
                    category: product.categorie,
                    productName: product.nom
                  });
                  e.currentTarget.src = fallbackUrl;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm font-medium">Aucune image disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Identity Section */}
        <div className="space-y-3">
          {/* Product Name */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.nom}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {getProductSubtitle(product)}
            </p>
          </div>

          {/* EAN Code */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
              EAN
            </span>
            <code className="font-mono text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {product.ean}
            </code>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${statusBadgeClass}`}>
              {product.statusColor === 'green' && '✓'}
              {product.statusColor === 'yellow' && '⚠'}
              {product.statusColor === 'gray' && '○'}
              {product.statusLabel}
            </span>
            
            {/* Citizen Data Badge */}
            {product.isCitizenData && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Données citoyennes
              </span>
            )}
          </div>
        </div>

        {/* Product Details Grid */}
        {isComplete && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            {product.prix && (
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Prix
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {product.prix}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Marque
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {product.marque}
              </p>
            </div>
            
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Catégorie
              </p>
              <p className="text-base text-gray-900 dark:text-white">
                {product.categorie}
              </p>
            </div>
            
            {product.contenance && (
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Contenance
                </p>
                <p className="text-base text-gray-900 dark:text-white">
                  {product.contenance}
                </p>
              </div>
            )}
          </div>
        )}

        {/* User Photos Gallery (if any) */}
        {product.userPhotos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photos ajoutées par les utilisateurs
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              {product.userPhotos.slice(0, 6).map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedPhotoIndex(index);
                    setShowPhotoGallery(true);
                  }}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 hover:opacity-75 transition-opacity"
                >
                  <img
                    src={photo.thumbnail || photo.url}
                    alt={`Photo utilisateur ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            
            {product.userPhotos.length > 6 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{product.userPhotos.length - 6} autres photos
              </p>
            )}
          </div>
        )}

        {/* Traceability Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Traçabilité
          </h4>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{getTraceabilityText(product)}</span>
            </p>
          </div>
        </div>

        {/* Report Error Link */}
        {onReportError && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={onReportError}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Signaler une erreur
            </button>
          </div>
        )}
      </div>

      {/* Photo Gallery Modal (simple implementation) */}
      {showPhotoGallery && product.userPhotos.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhotoGallery(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowPhotoGallery(false)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              aria-label="Fermer"
            >
              ×
            </button>
            <img
              src={product.userPhotos[selectedPhotoIndex].url}
              alt={`Photo ${selectedPhotoIndex + 1}`}
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {product.userPhotos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {product.userPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhotoIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full ${
                      index === selectedPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Photo ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
