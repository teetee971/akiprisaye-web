/**
 * ProductCardSkeleton Component
 * 
 * Skeleton loading state for product cards
 * Matches the structure of ProductCard for smooth transitions
 */

import { Shimmer } from '@/components/Loading/Shimmer';

export function ProductCardSkeleton() {
  return (
    <div 
      className="product-card-skeleton border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
      role="status"
      aria-label="Chargement du produit"
    >
      {/* Image placeholder */}
      <Shimmer className="w-full h-48 rounded-md" />
      
      {/* Title */}
      <Shimmer className="h-6 w-3/4 rounded" />
      
      {/* Brand */}
      <Shimmer className="h-4 w-1/2 rounded" />
      
      {/* Price */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-8 w-24 rounded" />
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>
      
      {/* Tags */}
      <div className="flex gap-2">
        <Shimmer className="h-6 w-16 rounded-full" />
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
