export type AisleType =
  | 'Frais'
  | 'Épicerie'
  | 'Boissons'
  | 'Hygiène'
  | 'Fruits & Légumes'
  | 'Surgelés'
  | 'Divers';

// Ordre logique de parcours d'un supermarché standard
export const AISLE_ORDER: AisleType[] = [
  'Fruits & Légumes',
  'Frais',
  'Épicerie',
  'Surgelés',
  'Boissons',
  'Hygiène',
  'Divers',
];

const CATEGORY_MAP: Record<string, AisleType> = {
  fruits: 'Fruits & Légumes',
  legumes: 'Fruits & Légumes',
  lait: 'Frais',
  fromage: 'Frais',
  viande: 'Frais',
  yaourt: 'Frais',
  conserves: 'Épicerie',
  riz: 'Épicerie',
  pates: 'Épicerie',
  biscuits: 'Épicerie',
  soda: 'Boissons',
  eau: 'Boissons',
  jus: 'Boissons',
  savon: 'Hygiène',
  shampooing: 'Hygiène',
  dentifrice: 'Hygiène',
  glaces: 'Surgelés',
  pizza: 'Surgelés',
};

export const getAisleFromCategory = (category?: string): AisleType => {
  if (!category) return 'Divers';
  const cleanCat = category.toLowerCase();

  for (const [key, aisle] of Object.entries(CATEGORY_MAP)) {
    if (cleanCat.includes(key)) return aisle;
  }

  return 'Divers';
};

// La fonction magique qui trie ta liste
export const sortItemsByAisle = (items: any[]) => {
  return [...items].sort((a, b) => {
    const aisleA = getAisleFromCategory(a.category);
    const aisleB = getAisleFromCategory(b.category);
    return AISLE_ORDER.indexOf(aisleA) - AISLE_ORDER.indexOf(aisleB);
  });
};
