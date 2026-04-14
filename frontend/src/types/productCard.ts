export interface ProductNutriments {
  energy_100g: number | null;
  fat_100g: number | null;
  saturatedFat_100g: number | null;
  carbohydrates_100g: number | null;
  sugars_100g: number | null;
  fiber_100g: number | null;
  proteins_100g: number | null;
  salt_100g: number | null;
}

export interface ProductCard {
  barcode: string;
  title: string;
  brand?: string;
  quantity?: string;
  categories?: string[];
  images: Array<{ type: 'front' | 'ingredients' | 'nutrition' | 'other'; url: string }>;
  nutriscore?: string;
  ecoscore?: string;
  ingredientsText?: string;
  novaGroup?: number;
  nutriments?: ProductNutriments;
  source: 'open_food_facts';
  updatedAt: string;
}
