import { CatalogueItemRaw } from '../services/catalogueService';

// Type principal
export type CatalogueItem = {
  _id: string;
  category: string;
  name: string;
  brand: string;
  ean: string;
  currentPrice?: number;
  historicalPrice?: number;
  stores: Store[];
  ingredients: Ingredient[];
  imageUrl?: string;
  reliabilityScore?: 'ReliabilityScore';
  qualityLabel?: 'QualityLabel';
}

// Types pour les comparateurs
export type SortConfig = {
  sortBy: 'price' | 'station' | 'city';
  sortDirection: 'asc' | 'desc';
}

export interface ShareProps {
  title: string;
  description?: string;
  onExportCSV?: () => void;
  onShare?: () => void;
}
