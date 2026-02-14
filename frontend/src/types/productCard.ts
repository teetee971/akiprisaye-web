export interface ProductCard {
  barcode: string;
  title: string;
  brand?: string;
  quantity?: string;
  categories?: string[];
  images: Array<{ type: 'front' | 'ingredients' | 'nutrition' | 'other'; url: string }>;
  source: 'open_food_facts';
  updatedAt: string;
}
