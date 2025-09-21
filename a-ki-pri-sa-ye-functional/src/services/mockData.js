// Mock data for development/testing
export const MOCK_PRODUCTS = {
  guadeloupe: [
    {
      id: "GUA-0001",
      name: "Baguette tradition 250g",
      prices: [
        { store: "Carrefour Les Abymes", price: 1.20, storeCity: "Les Abymes", brand: "Carrefour", updatedAt: "2025-01-15" },
        { store: "Super U Baie-Mahault", price: 1.15, storeCity: "Baie-Mahault", brand: "U", updatedAt: "2025-01-15" },
        { store: "Leader Price Pointe-à-Pitre", price: 1.10, storeCity: "Pointe-à-Pitre", brand: "Leader Price", updatedAt: "2025-01-15" }
      ],
      category: "Boulangerie",
      brand: "Tradition"
    },
    {
      id: "GUA-0002",
      name: "Lait UHT demi-écrémé 1L",
      prices: [
        { store: "Super U Baie-Mahault", price: 1.15, storeCity: "Baie-Mahault", brand: "U", updatedAt: "2025-01-15" },
        { store: "Carrefour Destreland", price: 1.25, storeCity: "Baie-Mahault", brand: "Carrefour", updatedAt: "2025-01-15" },
        { store: "Leader Price Pointe-à-Pitre", price: 1.05, storeCity: "Pointe-à-Pitre", brand: "Leader Price", updatedAt: "2025-01-15" }
      ],
      category: "Produits laitiers",
      brand: "Lactel"
    },
    {
      id: "GUA-0003",
      name: "Riz long grain 1kg",
      prices: [
        { store: "Carrefour Destreland", price: 1.95, storeCity: "Baie-Mahault", brand: "Carrefour", updatedAt: "2025-01-15" },
        { store: "Super U Le Gosier", price: 1.89, storeCity: "Le Gosier", brand: "U", updatedAt: "2025-01-15" },
        { store: "Carrefour Les Abymes", price: 2.10, storeCity: "Les Abymes", brand: "Carrefour", updatedAt: "2025-01-15" }
      ],
      category: "Épicerie",
      brand: "Uncle Ben's"
    },
    {
      id: "GUA-0004",
      name: "Banane locale (kg)",
      prices: [
        { store: "Marché de Pointe-à-Pitre", price: 2.20, storeCity: "Pointe-à-Pitre", brand: "Local", updatedAt: "2025-01-15" },
        { store: "Super U Baie-Mahault", price: 2.45, storeCity: "Baie-Mahault", brand: "U", updatedAt: "2025-01-15" },
        { store: "Carrefour Destreland", price: 2.35, storeCity: "Baie-Mahault", brand: "Carrefour", updatedAt: "2025-01-15" }
      ],
      category: "Fruits et légumes",
      brand: "Antilles"
    },
    {
      id: "GUA-0005",
      name: "Café moulu 250g",
      prices: [
        { store: "Super U Baie-Mahault", price: 3.80, storeCity: "Baie-Mahault", brand: "U", updatedAt: "2025-01-15" },
        { store: "Carrefour Les Abymes", price: 4.10, storeCity: "Les Abymes", brand: "Carrefour", updatedAt: "2025-01-15" },
        { store: "Leader Price Pointe-à-Pitre", price: 3.65, storeCity: "Pointe-à-Pitre", brand: "Leader Price", updatedAt: "2025-01-15" }
      ],
      category: "Épicerie",
      brand: "Carte Noire"
    }
  ],
  martinique: [
    {
      id: "MAR-0001",
      name: "Baguette tradition 250g",
      prices: [
        { store: "Carrefour Fort-de-France", price: 1.25, storeCity: "Fort-de-France", brand: "Carrefour", updatedAt: "2025-01-15" },
        { store: "Super U Lamentin", price: 1.18, storeCity: "Le Lamentin", brand: "U", updatedAt: "2025-01-15" }
      ],
      category: "Boulangerie",
      brand: "Tradition"
    },
    {
      id: "MAR-0002",
      name: "Rhum vieux 70cl",
      prices: [
        { store: "Distillerie Saint-James", price: 28.50, storeCity: "Sainte-Marie", brand: "Saint-James", updatedAt: "2025-01-15" },
        { store: "Carrefour Fort-de-France", price: 32.90, storeCity: "Fort-de-France", brand: "Carrefour", updatedAt: "2025-01-15" }
      ],
      category: "Spiritueux",
      brand: "Saint-James"
    }
  ]
};

// Fonction pour simuler une recherche dans les données mock
export function searchMockProducts(query = '', territory = 'guadeloupe') {
  const products = MOCK_PRODUCTS[territory] || [];
  
  if (!query.trim()) {
    return products;
  }
  
  const needle = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(needle) ||
    product.category.toLowerCase().includes(needle) ||
    product.brand.toLowerCase().includes(needle) ||
    product.prices.some(price => 
      price.store.toLowerCase().includes(needle) ||
      price.brand.toLowerCase().includes(needle)
    )
  );
}