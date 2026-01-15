import { useMemo } from 'react';
import type { Product } from '../types';

/**
 * Hook to extract unique filter values from products
 */
export function useFilters(products: Product[]) {
  // Extract unique categories
  const categories = useMemo(() => 
    [...new Set(products.map(p => p.category))].sort(),
    [products]
  );

  // Extract unique brands
  const brands = useMemo(() =>
    [...new Set(products.map(p => p.brand))].sort(),
    [products]
  );

  // Calculate price range
  const priceRange: [number, number] = useMemo(() => {
    if (products.length === 0) return [0, 100];
    const prices = products.map(p => p.basePrice);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  return { categories, brands, priceRange };
}
