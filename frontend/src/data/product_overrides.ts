export interface ProductOverride {
  ean: string;
  productName: string;
  brand?: string;
  quantity?: string;
  nutriScore?: string;
  ingredientsText?: string;
  nutritionPer100g?: {
    energyKj?: number;
    energyKcal?: number;
    carbs?: number;
    sugars?: number;
  };
  nutritionPreparedPer100g?: {
    energyKj?: number;
    energyKcal?: number;
    carbs?: number;
    sugars?: number;
  };
  categories?: string[];
}

export const PRODUCT_OVERRIDES: ProductOverride[] = [
  {
    ean: '3560070894222',
    productName: 'Sirop / Siroop Cerise / Kers',
    brand: 'Carrefour Classic’',
    quantity: '75 cl',
    nutriScore: 'C',
    ingredientsText:
      'Sucre, sirop de glucose-fructose, jus de fruits à base de concentrés 26 % (cerise 12 %, citron, sureau), eau, arôme, acidifiant : acide citrique.',
    nutritionPer100g: {
      energyKj: 1332,
      energyKcal: 313,
      carbs: 77,
      sugars: 73,
    },
    nutritionPreparedPer100g: {
      energyKj: 103,
      energyKcal: 24,
      carbs: 6.0,
      sugars: 5.6,
    },
    categories: ['Boissons', 'Sirops', 'Sirop de fruits'],
  },
];

export function getProductOverrideByEan(ean: string): ProductOverride | null {
  return PRODUCT_OVERRIDES.find((entry) => entry.ean === ean) ?? null;
}
