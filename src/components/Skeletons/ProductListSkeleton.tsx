/**
 * ProductListSkeleton Component
 * 
 * Grid of product card skeletons with optional stagger animation
 * for a more polished loading experience
 */

import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductListSkeletonProps {
  count?: number;
  stagger?: boolean;
}

export function ProductListSkeleton({ count = 6, stagger = true }: ProductListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={stagger ? 'animate-fadeIn' : ''}
          style={stagger ? { animationDelay: `${index * 100}ms` } : {}}
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
