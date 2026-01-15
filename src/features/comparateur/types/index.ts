/**
 * Comparateur Hub Types
 * Type definitions for the price comparison hub
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  ean?: string;
  basePrice: number;
  unit: string;
  synonyms?: string[];
  category: string;
}

export interface ProductMetadata {
  version: string;
  territories: string[];
  productCount: number;
  storeCount: number;
  categories: string[];
  coverage: Record<string, string>;
}

export interface ProductDataResponse {
  metadata: ProductMetadata;
  products: Product[];
}

export interface Filters {
  categories?: string[];
  territories?: string[];
  priceRange?: [number, number];
  brands?: string[];
}

export interface SearchBarProps {
  products: Product[];
  onSearch: (results: Product[]) => void;
  placeholder?: string;
}

export interface FilterPanelProps {
  categories: string[];
  territories: string[];
  brands: string[];
  onFilterChange: (filters: Filters) => void;
}

export interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  showCompareButton?: boolean;
}

export interface ProductListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export interface SortOptionsProps {
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
}
