// API Base URL configuration
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchProducts() {
  const r = await fetch('/data/products.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('Impossible de récupérer les produits');
  return r.json();
}

/**
 * Fetch prices for a specific territory from the real API
 * @param {string} territory - Territory code (e.g., 'guadeloupe')
 * @param {Object} options - Optional query parameters
 * @returns {Promise<Object>} API response with prices data
 */
export async function fetchPrices(territory = 'guadeloupe', options = {}) {
  const params = new URLSearchParams({
    territory,
    limit: options.limit || 20,
    offset: options.offset || 0,
    ...(options.q && { q: options.q }),
    ...(options.sort && { sort: options.sort })
  });

  const url = `${API_BASE}/prices?${params}`;
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch territories list from API
 * @returns {Promise<Object>} API response with territories data
 */
export async function fetchTerritories() {
  const response = await fetch(`${API_BASE}/territories`, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Erreur lors du chargement des territoires: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Search and compare prices across territories for price comparison
 * @param {string} query - Search query for products
 * @param {string} territory - Primary territory for comparison
 * @returns {Promise<Array>} Formatted comparison data
 */
export async function fetchPriceComparison(query = '', territory = 'guadeloupe') {
  try {
    // Try the real API first (for production/deployed environments)
    if (API_BASE !== '/api') {
      const data = await fetchPrices(territory, { q: query, limit: 50 });
      
      // Transform the API data to match the webapp expected format
      const items = (data.data || []).map(item => ({
        id: item.id,
        name: item.title,
        price_dom: item.price, // DOM price from API
        price_hex: item.price * 0.8, // Estimated mainland price (20% less)
        store: item.store,
        storeCity: item.storeCity,
        brand: item.brand,
        territory: data.territory,
        updatedAt: item.updatedAt
      }));
      
      return { items, total: data.count, territory: data.territory };
    }
  } catch (error) {
    console.warn('Real API not available, using mock data:', error.message);
  }

  // Fallback to mock data for development
  try {
    const mockData = await fetchMockComparisonData();
    const filteredItems = query 
      ? mockData.items.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase())
        )
      : mockData.items;
    
    return { 
      items: filteredItems, 
      total: filteredItems.length, 
      territory 
    };
  } catch (error) {
    console.warn('Mock data fetch failed:', error.message);
    return { items: [], total: 0, territory };
  }
}

/**
 * Fetch mock comparison data for development
 * @returns {Promise<Object>} Mock data with comparison prices
 */
async function fetchMockComparisonData() {
  // Use mock data that matches the webapp structure
  const mockItems = [
    {
      id: "lait-1l",
      name: "Lait UHT 1L",
      price_dom: 1.45,
      price_hex: 1.12,
      store: "Carrefour Les Abymes",
      storeCity: "Les Abymes",
      brand: "Carrefour",
      territory: "guadeloupe",
      updatedAt: "2025-01-15"
    },
    {
      id: "pates-500g",
      name: "Pâtes 500g",
      price_dom: 1.36,
      price_hex: 0.98,
      store: "Super U Baie-Mahault", 
      storeCity: "Baie-Mahault",
      brand: "U",
      territory: "guadeloupe",
      updatedAt: "2025-01-15"
    },
    {
      id: "riz-1kg",
      name: "Riz 1kg",
      price_dom: 2.30,
      price_hex: 1.85,
      store: "Leader Price Pointe-à-Pitre",
      storeCity: "Pointe-à-Pitre", 
      brand: "Leader Price",
      territory: "guadeloupe",
      updatedAt: "2025-01-15"
    },
    {
      id: "baguette-250g",
      name: "Baguette tradition 250g",
      price_dom: 1.20,
      price_hex: 0.95,
      store: "Carrefour Destreland",
      storeCity: "Baie-Mahault",
      brand: "Carrefour", 
      territory: "guadeloupe",
      updatedAt: "2025-01-15"
    },
    {
      id: "banane-kg",
      name: "Banane locale (kg)",
      price_dom: 2.20,
      price_hex: 3.50,
      store: "Carrefour Les Abymes",
      storeCity: "Les Abymes",
      brand: "Carrefour",
      territory: "guadeloupe", 
      updatedAt: "2025-01-15"
    }
  ];

  return { items: mockItems };
}
