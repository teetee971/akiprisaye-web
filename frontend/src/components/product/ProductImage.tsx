 
/**
 * Product Image Component - Mobile Optimized for Samsung S24+
 * 
 * Features:
 * - Responsive images with srcset
 * - Lazy loading for performance
 * - Category-based fallback placeholders
 * - Optimized for high-DPI screens (516 DPI on S24+)
 * - Automatic image enrichment from Open Food Facts
 */

import { useState, useEffect } from 'react';
import type { ProductImages } from '../../types/enhancedPrice';
import { createFallbackImage, generateLoadingPlaceholder, generateErrorPlaceholder } from '../../services/productImageFallback';
import type { ProductCategory } from '../../types/product';

interface ProductImageProps {
  images?: ProductImages;
  productName: string;
  category?: ProductCategory | string;
  barcode?: string;
  size?: 'thumbnail' | 'card' | 'full';
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}

export default function ProductImage({
  images,
  productName,
  category,
  barcode,
  size = 'card',
  className = '',
  alt,
  loading = 'lazy',
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  
  // Generate fallback image on mount or when category changes
  useEffect(() => {
    if (!images || imageError) {
      const fallback = createFallbackImage(category, productName);
      setFallbackImage(size === 'thumbnail' ? fallback.thumbnailUrl : fallback.url);
    }
  }, [images, imageError, category, productName, size]);
  
  // Get appropriate image URL based on size
  const getImageUrl = () => {
    if (!images || imageError) {
      return fallbackImage || images?.fallback || generateErrorPlaceholder();
    }
    
    switch (size) {
      case 'thumbnail':
        return images.thumbnail;
      case 'card':
        return images.card;
      case 'full':
        return images.full;
      default:
        return images.card;
    }
  };
  
  // Build srcset for responsive images
  const getSrcSet = () => {
    if (!images || imageError || !images.srcset) {
      return undefined;
    }
    
    return images.srcset
      .map(src => `${src.url} ${src.descriptor}`)
      .join(', ');
  };
  
  // Handle image load error
  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
  };
  
  // Handle image load success
  const handleLoad = () => {
    setImageLoaded(true);
  };
  
  const imageUrl = getImageUrl();
  const srcset = getSrcSet();
  const imageAlt = alt || productName;
  const fetchPriority = loading === 'eager' ? 'high' : 'auto';
  
  // Size classes for different display modes
  const sizeClasses = {
    thumbnail: 'w-20 h-20',
    card: 'w-full h-48 md:h-56',
    full: 'w-full h-auto',
  };
  
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div className={`absolute inset-0 ${sizeClasses[size]}`}>
          <img
            src={generateLoadingPlaceholder(size === 'thumbnail' ? 100 : 200)}
            alt="Chargement..."
            className="w-full h-full object-contain"
          />
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={imageUrl}
        srcSet={srcset}
        alt={imageAlt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        onError={handleError}
        onLoad={handleLoad}
        className={`${sizeClasses[size]} object-contain transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Attribution badge (for Open Food Facts images) */}
      {images && !imageError && images.source === 'openfoodfacts' && (size === 'full' || size === 'card') && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span role="img" aria-label="Photo">📸</span>
          <span>Open Food Facts</span>
        </div>
      )}
      
      {/* Fallback indicator */}
      {imageError && fallbackImage && size !== 'thumbnail' && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span role="img" aria-label="Catégorie">🏷️</span>
          <span>Image par catégorie</span>
        </div>
      )}
    </div>
  );
}
