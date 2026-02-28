export type ProductOverride = {
  productName: string;
  brand: string;
  quantity?: string;
  ingredientsText?: string;
  nutritionPer100g?: {
    energyKj?: number;
    energyKcal?: number;
    fat?: number;
    saturatedFat?: number;
    carbs?: number;
    sugars?: number;
    fiber?: number;
    protein?: number;
    salt?: number;
  };
  categories?: string[];
};

export const productOverrides: Record<string, ProductOverride> = {
  '3179142767304': {
    productName: 'Levure du Boulanger – Levée rapide',
    brand: 'Vahiné',
    quantity: '27,6 g (6 sachets de 4,6 g)',
    ingredientsText: 'Levure de boulangerie déshydratée, émulsifiant : E491, antioxydant : E300.',
    nutritionPer100g: {
      energyKj: 1489,
      energyKcal: 355,
      fat: 5.7,
      saturatedFat: 0.9,
      carbs: 19,
      sugars: 14,
      fiber: 27,
      protein: 44,
      salt: 0.3,
    },
    categories: ['boulangerie', 'levure', 'aide à la pâtisserie'],
  },
};

export function getProductOverride(barcode: string): ProductOverride | null {
  return productOverrides[barcode] ?? null;
}
