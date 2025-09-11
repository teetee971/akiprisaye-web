import { useMemo } from 'react';
import { useProducts } from '@/context/ProductsContext';
import type { Store, Product, Territory } from '@shared/schema';

export interface StoreMetrics {
  storeId: string;
  storeName: string;
  totalProducts: number;
  averagePrice: number;
  territoryCount: number;
  priceCompetitiveness: number; // 0-100 score
  productDiversity: number; // Number of unique categories
  priceStability: number; // Based on price variations
  territorialCoverage: number; // Percentage of territories covered
  overallScore: number; // Calculated final score
}

export interface RankingData {
  metrics: StoreMetrics[];
  territoryAnalysis: Record<string, {
    averagePrice: number;
    storeCount: number;
    productCount: number;
  }>;
  categoryAnalysis: Record<string, {
    averagePrice: number;
    storeCount: number;
    productCount: number;
  }>;
}

interface StoreMetricsProps {
  selectedTerritory?: string;
  selectedCategory?: string;
  children: (data: RankingData) => React.ReactNode;
}

export default function StoreMetrics({ 
  selectedTerritory, 
  selectedCategory, 
  children 
}: StoreMetricsProps) {
  const { products, stores, territories, loading } = useProducts();

  const rankingData = useMemo((): RankingData => {
    if (loading || !products.length || !stores.length) {
      return {
        metrics: [],
        territoryAnalysis: {},
        categoryAnalysis: {}
      };
    }

    // Filter products based on selected filters
    let filteredProducts = products;
    if (selectedTerritory) {
      filteredProducts = filteredProducts.filter(p => p.territory === selectedTerritory);
    }
    if (selectedCategory) {
      filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
    }

    // Calculate overall market metrics for comparison
    const allPrices = filteredProducts.map(p => p.price);
    const marketAveragePrice = allPrices.length > 0 
      ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
      : 0;
    
    const totalTerritories = territories.length;
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

    // Calculate metrics for each store
    const storeMetrics: StoreMetrics[] = stores.map(store => {
      // Get products for this store
      const storeProducts = filteredProducts.filter(p => p.store === store.id);
      
      if (storeProducts.length === 0) {
        return {
          storeId: store.id,
          storeName: store.name,
          totalProducts: 0,
          averagePrice: 0,
          territoryCount: 0,
          priceCompetitiveness: 0,
          productDiversity: 0,
          priceStability: 0,
          territorialCoverage: 0,
          overallScore: 0
        };
      }

      // Basic metrics
      const totalProducts = storeProducts.length;
      const averagePrice = storeProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts;
      
      // Territory coverage
      const storeTerritoriesInData = Array.from(new Set(
        products.filter(p => p.store === store.id).map(p => p.territory)
      ));
      const territoryCount = storeTerritoriesInData.length;
      const territorialCoverage = (territoryCount / totalTerritories) * 100;

      // Product diversity (unique categories)
      const storeCategories = Array.from(new Set(storeProducts.map(p => p.category)));
      const productDiversity = storeCategories.length;

      // Price competitiveness (lower average price = higher score)
      const priceCompetitiveness = marketAveragePrice > 0 
        ? Math.max(0, Math.min(100, ((marketAveragePrice - averagePrice) / marketAveragePrice) * 100 + 50))
        : 50;

      // Price stability (based on price history variations)
      const priceStability = calculatePriceStability(storeProducts);

      // Overall score calculation (weighted combination)
      const baseScore = store.averageScore * 20; // Convert from 0-5 to 0-100 scale
      const priceScore = priceCompetitiveness * 0.25;
      const diversityScore = Math.min(100, (productDiversity / uniqueCategories.length) * 100) * 0.15;
      const coverageScore = territorialCoverage * 0.15;
      const stabilityScore = priceStability * 0.15;
      const availabilityScore = store.availabilityScore * 20 * 0.15;
      const stabilityIndexScore = store.stabilityScore * 20 * 0.15;

      const overallScore = baseScore + priceScore + diversityScore + coverageScore + 
                          stabilityScore + availabilityScore + stabilityIndexScore;

      return {
        storeId: store.id,
        storeName: store.name,
        totalProducts,
        averagePrice,
        territoryCount,
        priceCompetitiveness,
        productDiversity,
        priceStability,
        territorialCoverage,
        overallScore: Math.min(100, Math.max(0, overallScore))
      };
    });

    // Sort by overall score
    storeMetrics.sort((a, b) => b.overallScore - a.overallScore);

    // Territory analysis
    const territoryAnalysis: Record<string, any> = {};
    territories.forEach(territory => {
      const territoryProducts = filteredProducts.filter(p => p.territory === territory.name);
      const territoryStores = Array.from(new Set(territoryProducts.map(p => p.store)));
      
      territoryAnalysis[territory.name] = {
        averagePrice: territoryProducts.length > 0 
          ? territoryProducts.reduce((sum, p) => sum + p.price, 0) / territoryProducts.length
          : 0,
        storeCount: territoryStores.length,
        productCount: territoryProducts.length
      };
    });

    // Category analysis
    const categoryAnalysis: Record<string, any> = {};
    uniqueCategories.forEach(category => {
      const categoryProducts = filteredProducts.filter(p => p.category === category);
      const categoryStores = Array.from(new Set(categoryProducts.map(p => p.store)));
      
      categoryAnalysis[category] = {
        averagePrice: categoryProducts.length > 0 
          ? categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length
          : 0,
        storeCount: categoryStores.length,
        productCount: categoryProducts.length
      };
    });

    return {
      metrics: storeMetrics,
      territoryAnalysis,
      categoryAnalysis
    };
  }, [products, stores, territories, selectedTerritory, selectedCategory, loading]);

  return <>{children(rankingData)}</>;
}

// Helper function to calculate price stability
function calculatePriceStability(products: Product[]): number {
  if (products.length === 0) return 0;

  let totalVariability = 0;
  let productCount = 0;

  products.forEach(product => {
    if (product.priceHistory && product.priceHistory.length > 1) {
      const prices = product.priceHistory.map(h => h.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // Calculate coefficient of variation (std dev / mean)
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgPrice > 0 ? stdDev / avgPrice : 0;
      
      // Convert to stability score (lower variation = higher stability)
      const stabilityScore = Math.max(0, 100 - (coefficientOfVariation * 100));
      totalVariability += stabilityScore;
      productCount++;
    }
  });

  return productCount > 0 ? totalVariability / productCount : 75; // Default stability score
}

// Helper hook for easy access to ranking data
export function useStoreRanking(selectedTerritory?: string, selectedCategory?: string) {
  const { products, stores, territories, loading } = useProducts();
  
  return useMemo(() => {
    if (loading || !products.length || !stores.length) {
      return {
        metrics: [],
        territoryAnalysis: {},
        categoryAnalysis: {},
        loading: true
      };
    }

    // This replicates the logic from StoreMetrics component
    // Could be extracted to a shared utility if needed
    let filteredProducts = products;
    if (selectedTerritory) {
      filteredProducts = filteredProducts.filter(p => p.territory === selectedTerritory);
    }
    if (selectedCategory) {
      filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
    }

    const allPrices = filteredProducts.map(p => p.price);
    const marketAveragePrice = allPrices.length > 0 
      ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
      : 0;
    
    const totalTerritories = territories.length;
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

    const storeMetrics: StoreMetrics[] = stores.map(store => {
      const storeProducts = filteredProducts.filter(p => p.store === store.id);
      
      if (storeProducts.length === 0) {
        return {
          storeId: store.id,
          storeName: store.name,
          totalProducts: 0,
          averagePrice: 0,
          territoryCount: 0,
          priceCompetitiveness: 0,
          productDiversity: 0,
          priceStability: 0,
          territorialCoverage: 0,
          overallScore: 0
        };
      }

      const totalProducts = storeProducts.length;
      const averagePrice = storeProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts;
      
      const storeTerritoriesInData = Array.from(new Set(
        products.filter(p => p.store === store.id).map(p => p.territory)
      ));
      const territoryCount = storeTerritoriesInData.length;
      const territorialCoverage = (territoryCount / totalTerritories) * 100;

      const storeCategories = Array.from(new Set(storeProducts.map(p => p.category)));
      const productDiversity = storeCategories.length;

      const priceCompetitiveness = marketAveragePrice > 0 
        ? Math.max(0, Math.min(100, ((marketAveragePrice - averagePrice) / marketAveragePrice) * 100 + 50))
        : 50;

      const priceStability = calculatePriceStability(storeProducts);

      const baseScore = store.averageScore * 20;
      const priceScore = priceCompetitiveness * 0.25;
      const diversityScore = Math.min(100, (productDiversity / uniqueCategories.length) * 100) * 0.15;
      const coverageScore = territorialCoverage * 0.15;
      const stabilityScoreCalc = priceStability * 0.15;
      const availabilityScore = store.availabilityScore * 20 * 0.15;
      const stabilityIndexScore = store.stabilityScore * 20 * 0.15;

      const overallScore = baseScore + priceScore + diversityScore + coverageScore + 
                          stabilityScoreCalc + availabilityScore + stabilityIndexScore;

      return {
        storeId: store.id,
        storeName: store.name,
        totalProducts,
        averagePrice,
        territoryCount,
        priceCompetitiveness,
        productDiversity,
        priceStability,
        territorialCoverage,
        overallScore: Math.min(100, Math.max(0, overallScore))
      };
    }).sort((a, b) => b.overallScore - a.overallScore);

    return {
      metrics: storeMetrics,
      territoryAnalysis: {},
      categoryAnalysis: {},
      loading: false
    };
  }, [products, stores, territories, selectedTerritory, selectedCategory, loading]);
}