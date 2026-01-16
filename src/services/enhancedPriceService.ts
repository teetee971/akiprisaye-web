/**
 * Enhanced Price Service v1.0.0
 * 
 * Implements:
 * - Product search with normalization
 * - Fuzzy matching with synonyms
 * - Reliability-based ranking
 * - Price comparison with transparency
 * - Territory-based data loading (optimized for performance)
 */

import type {
  EnhancedPriceData,
  CanonicalProduct,
  ProductSearchResult,
  EnhancedPriceComparison,
  EnhancedSearchFilters,
  PriceObservationEnhanced,
} from '../types/enhancedPrice';
import { TERRITORY_FILENAMES } from '../config/territoryFilenames';

// Cache for loaded territory data
const territoryDataCache = new Map<string, EnhancedPriceData>();

/**
 * Load territory-specific price data (optimized)
 * Uses split JSON files when available, falls back to full file
 */
async function loadTerritoryData(territory?: string): Promise<EnhancedPriceData> {
  // If no territory specified or 'ALL', load full file
  if (!territory || territory === 'ALL') {
    const response = await fetch('/data/expanded-prices.json');
    if (!response.ok) {
      // Fallback to smaller database
      const fallbackResponse = await fetch('/data/enhanced-prices.json');
      if (!fallbackResponse.ok) {
        throw new Error('Failed to fetch price data');
      }
      return await fallbackResponse.json();
    }
    return await response.json();
  }

  // Check cache first
  if (territoryDataCache.has(territory)) {
    return territoryDataCache.get(territory)!;
  }

  // Try to load territory-specific file
  const filename = TERRITORY_FILENAMES[territory];
  if (filename) {
    try {
      const response = await fetch(`/data/territories/${filename}`);
      if (response.ok) {
        const data = await response.json();
        territoryDataCache.set(territory, data);
        return data;
      }
    } catch (error) {
      console.warn(
        `Failed to load territory-specific data for ${territory}, falling back to full file.`,
        `To resolve: Run 'npm run split-prices' to generate territory files, or check file paths.`,
        error
      );
    }
  }

  // Fallback: load full file and filter
  const response = await fetch('/data/expanded-prices.json');
  if (!response.ok) {
    const fallbackResponse = await fetch('/data/enhanced-prices.json');
    if (!fallbackResponse.ok) {
      throw new Error('Failed to fetch price data');
    }
    return await fallbackResponse.json();
  }
  
  return await response.json();
}

/**
 * Normalize text for search matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, '')     // Remove special chars
    .trim();
}

/**
 * Calculate relevance score for search
 */
function calculateRelevance(
  product: CanonicalProduct,
  query: string
): { score: number; matchedFields: string[] } {
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/);
  
  let score = 0;
  const matchedFields: string[] = [];
  
  // Exact name match (highest priority)
  if (product.normalizedName === normalizedQuery) {
    score += 100;
    matchedFields.push('name_exact');
  }
  // Name contains query
  else if (product.normalizedName.includes(normalizedQuery)) {
    score += 80;
    matchedFields.push('name_partial');
  }
  // Name contains all query words
  else if (queryWords.every(word => product.normalizedName.includes(word))) {
    score += 60;
    matchedFields.push('name_words');
  }
  
  // Brand match
  if (product.normalizedBrand === normalizedQuery) {
    score += 40;
    matchedFields.push('brand_exact');
  } else if (product.normalizedBrand.includes(normalizedQuery)) {
    score += 30;
    matchedFields.push('brand_partial');
  }
  
  // Synonym match
  const normalizedSynonyms = product.synonyms.map(s => normalizeText(s));
  if (normalizedSynonyms.some(syn => syn === normalizedQuery)) {
    score += 50;
    matchedFields.push('synonym_exact');
  } else if (normalizedSynonyms.some(syn => syn.includes(normalizedQuery))) {
    score += 35;
    matchedFields.push('synonym_partial');
  }
  
  // EAN match
  if (product.ean.includes(query)) {
    score += 90;
    matchedFields.push('ean');
  }
  
  // Category match
  if (normalizeText(product.category).includes(normalizedQuery)) {
    score += 20;
    matchedFields.push('category');
  }
  
  return { score, matchedFields };
}

/**
 * Search products with enhanced matching
 */
export async function searchProducts(
  filters: EnhancedSearchFilters
): Promise<ProductSearchResult[]> {
  try {
    // Load data optimized for territory
    const data = await loadTerritoryData(filters.territory);
    return processSearchFilters(data.products, filters);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Process search filters on products
 */
function processSearchFilters(
  products: CanonicalProduct[],
  filters: EnhancedSearchFilters
): ProductSearchResult[] {
  let filteredProducts = [...products];
  
  // Filter by territory
  if (filters.territory) {
    filteredProducts = filteredProducts.filter(p =>
      p.prices.some(price => price.territory === filters.territory)
    );
  }
  
  // Filter by category
  if (filters.category) {
    filteredProducts = filteredProducts.filter(p => p.category === filters.category);
  }
  
  // Filter by brand
  if (filters.brand) {
    const normalizedBrand = normalizeText(filters.brand);
    filteredProducts = filteredProducts.filter(p => p.normalizedBrand === normalizedBrand);
  }
  
  // Filter by price age
  if (filters.maxPriceAge) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.maxPriceAge);
    const cutoffISO = cutoffDate.toISOString();
    
    filteredProducts = filteredProducts.filter(p =>
      p.prices.some(price => price.observedAt >= cutoffISO)
    );
  }
  
  // Filter by minimum reliability
  if (filters.minReliability !== undefined) {
    filteredProducts = filteredProducts.filter(p =>
      p.prices.some(price => price.reliability.score >= filters.minReliability)
    );
  }
  
  // Search by query
  let results: ProductSearchResult[] = [];
  
  if (filters.query && filters.query.trim().length >= 2) {
    const searchResults = filteredProducts.map(product => {
      const { score, matchedFields } = calculateRelevance(product, filters.query!);
      return {
        product,
        relevanceScore: score,
        matchedFields,
      };
    });
    
    // Filter out non-matches
    results = searchResults.filter(r => r.relevanceScore > 0);
  } else {
    // No query, return all filtered products
    results = filteredProducts.map(product => ({
      product,
      relevanceScore: 0,
      matchedFields: [],
    }));
  }
  
  // Sort results
  const sortBy = filters.sortBy || 'relevance';
  const sortOrder = filters.sortOrder || 'desc';
  
  results.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'relevance':
        comparison = b.relevanceScore - a.relevanceScore;
        break;
        
      case 'price': {
        const pricesA = a.product.prices.filter(p => 
          !filters.territory || p.territory === filters.territory
        );
        const pricesB = b.product.prices.filter(p => 
          !filters.territory || p.territory === filters.territory
        );
        
        const minPriceA = pricesA.length > 0 
          ? Math.min(...pricesA.map(p => p.price))
          : Infinity;
        const minPriceB = pricesB.length > 0
          ? Math.min(...pricesB.map(p => p.price))
          : Infinity;
        
        comparison = minPriceA - minPriceB;
        break;
      }
        
      case 'reliability': {
        const avgReliabilityA = a.product.prices.reduce((sum, p) => 
          sum + p.reliability.score, 0) / a.product.prices.length;
        const avgReliabilityB = b.product.prices.reduce((sum, p) => 
          sum + p.reliability.score, 0) / b.product.prices.length;
        
        comparison = avgReliabilityB - avgReliabilityA;
        break;
      }
        
      case 'date': {
        const latestDateA = Math.max(
          ...a.product.prices.map(p => new Date(p.observedAt).getTime())
        );
        const latestDateB = Math.max(
          ...b.product.prices.map(p => new Date(p.observedAt).getTime())
        );
        
        comparison = latestDateB - latestDateA;
        break;
      }
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return results;
}

/**
 * Get product by EAN
 */
export async function getProductByEAN(ean: string, territory?: string): Promise<CanonicalProduct | null> {
  try {
    const data = await loadTerritoryData(territory);
    return data.products.find(p => p.ean === ean) || null;
  } catch (error) {
    console.error('Error fetching product by EAN:', error);
    return null;
  }
}

/**
 * Compare prices for a product across stores
 */
export async function comparePrices(
  ean: string,
  territory: string
): Promise<EnhancedPriceComparison | null> {
  try {
    const product = await getProductByEAN(ean);
    if (!product) {
      return null;
    }
    
    // Load stores database
    let storesData: any = null;
    try {
      const storesResponse = await fetch('/data/stores-database.json');
      if (storesResponse.ok) {
        storesData = await storesResponse.json();
      }
    } catch (err) {
      console.warn('Could not load stores database:', err);
    }
    
    // Filter prices for territory
    const territoryPrices = product.prices.filter(p => p.territory === territory);
    
    if (territoryPrices.length === 0) {
      return null;
    }
    
    // Sort by price (cheapest first)
    const sortedPrices = [...territoryPrices].sort((a, b) => a.price - b.price);
    
    // Calculate statistics
    const prices = sortedPrices.map(p => p.price);
    const cheapestPrice = Math.min(...prices);
    const mostExpensivePrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const priceRange = mostExpensivePrice - cheapestPrice;
    const priceRangePercentage = cheapestPrice > 0 
      ? (priceRange / cheapestPrice) * 100 
      : 0;
    
    // Build comparison with store data
    const pricesByStore = sortedPrices.map((price, index) => {
      // Find store in stores database
      const store = storesData?.stores?.find((s: any) => s.id === price.storeId);
      
      return {
        storeName: price.storeName,
        storeChain: price.storeChain,
        storeId: price.storeId,
        price: price.price,
        observedAt: price.observedAt,
        source: price.source,
        reliability: price.reliability,
        rank: index + 1,
        differenceFromCheapest: {
          absolute: Math.round((price.price - cheapestPrice) * 100) / 100,
          percentage: cheapestPrice > 0 
            ? Math.round(((price.price - cheapestPrice) / cheapestPrice) * 10000) / 100
            : 0,
        },
        store: {
          address: store?.address,
          lat: store?.lat,
          lon: store?.lon,
        },
      };
    });
    
    // Build legacy prices array for backward compatibility
    const pricesWithRank = sortedPrices.map((price, index) => ({
      storeName: price.storeName,
      storeChain: price.storeChain,
      price: price.price,
      observedAt: price.observedAt,
      source: price.source,
      reliability: price.reliability,
      rank: index + 1,
      differenceFromCheapest: {
        absolute: Math.round((price.price - cheapestPrice) * 100) / 100,
        percentage: cheapestPrice > 0 
          ? Math.round(((price.price - cheapestPrice) / cheapestPrice) * 10000) / 100
          : 0,
      },
    }));
    
    // Calculate metadata
    const dates = sortedPrices.map(p => p.observedAt);
    const avgReliability = sortedPrices.reduce((sum, p) => 
      sum + p.reliability.score, 0) / sortedPrices.length;
    
    return {
      product: {
        canonicalId: product.canonicalId,
        name: product.name,
        brand: product.brand,
        format: product.format,
        ean: product.ean,
      },
      territory,
      pricesByStore,
      prices: pricesWithRank,
      statistics: {
        cheapestPrice: Math.round(cheapestPrice * 100) / 100,
        mostExpensivePrice: Math.round(mostExpensivePrice * 100) / 100,
        averagePrice: Math.round(averagePrice * 100) / 100,
        priceRange: Math.round(priceRange * 100) / 100,
        priceRangePercentage: Math.round(priceRangePercentage * 100) / 100,
      },
      metadata: {
        totalStores: sortedPrices.length,
        mostRecentUpdate: dates.sort().reverse()[0],
        oldestUpdate: dates.sort()[0],
        averageReliability: Math.round(avgReliability),
      },
    };
  } catch (error) {
    console.error('Error comparing prices:', error);
    return null;
  }
}

/**
 * Get available categories
 */
export async function getCategories(territory?: string): Promise<string[]> {
  try {
    const data = await loadTerritoryData(territory);
    const categories = new Set(data.products.map(p => p.category));
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get available brands
 */
export async function getBrands(territory?: string): Promise<string[]> {
  try {
    const data = await loadTerritoryData(territory);
    const brands = new Set(data.products.map(p => p.brand));
    return Array.from(brands).sort();
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}
