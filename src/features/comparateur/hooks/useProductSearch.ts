import { useState, useEffect } from 'react';
import type { Product, Filters } from '../types';

/**
 * Hook for searching and filtering products
 */
export function useProductSearch(products: Product[]) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let result = [...products];

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(p => filters.categories?.includes(p.category));
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      result = result.filter(p => 
        p.basePrice >= minPrice && 
        p.basePrice <= maxPrice
      );
    }

    // Apply brand filter
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter(p => filters.brands?.includes(p.brand));
    }

    // Apply territory filter (if products have territory data)
    if (filters.territories && filters.territories.length > 0) {
      // This would need to be implemented based on territory-specific product data
      // For now, we'll skip this as the base products don't have territory info
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.basePrice - b.basePrice;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'brand':
          comparison = a.brand.localeCompare(b.brand);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredProducts(result);
  }, [products, filters, sortBy, sortOrder]);

  return { 
    filteredProducts, 
    setFilters, 
    setSortBy, 
    setSortOrder,
    filters,
    sortBy,
    sortOrder
  };
}
