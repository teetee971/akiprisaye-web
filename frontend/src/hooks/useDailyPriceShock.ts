/**
 * ⑭ RÉSUMÉ DES HAUSSES DU JOUR
 * Hook pour analyser les hausses récentes de prix
 */

import { useState, useEffect } from 'react';

export interface PriceShock {
  productName: string;
  priceIncrease: number; // en euros
  percentageIncrease: number; // en %
  territory: string;
  isConfirmed: boolean; // fiabilité >= 80%
  currentPrice: number;
  previousPrice: number;
  category?: string;
}

interface DailyShockData {
  shocks: PriceShock[];
  lastUpdate: string;
  territoryAnalyzed: string;
}

export function useDailyPriceShock(territory: string = 'GP') {
  const [data, setData] = useState<DailyShockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger les données
        const [productsRes, servicesRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/expanded-prices.json`),
          fetch(`${import.meta.env.BASE_URL}data/services-prices.json`),
        ]);

        if (!productsRes.ok || !servicesRes.ok) {
          throw new Error('Impossible de charger les données');
        }

        const productsData = await productsRes.json();
        const servicesData = await servicesRes.json();

        // Analyser les hausses
        const shocks = analyzeRecentShocks(productsData, servicesData, territory);

        setData({
          shocks: shocks.slice(0, 5), // Top 5
          lastUpdate: new Date().toISOString(),
          territoryAnalyzed: territory,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyze();
  }, [territory]);

  return { data, loading, error };
}

/**
 * Analyse les hausses récentes dans les données
 */
function analyzeRecentShocks(
  productsData: any,
  servicesData: any,
  territory: string
): PriceShock[] {
  const shocks: PriceShock[] = [];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Analyser les produits
  if (productsData?.products) {
    productsData.products.forEach((product: any) => {
      if (product.territory !== territory) return;

      const priceHistory = product.priceHistory || [];
      if (priceHistory.length < 2) return;

      // Trier par date décroissante
      const sorted = [...priceHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const latest = sorted[0];
      const previous = sorted[1];

      // Vérifier si dans les 7 derniers jours
      const latestDate = new Date(latest.date).getTime();
      if (latestDate < sevenDaysAgo) return;

      const currentPrice = latest.price;
      const previousPrice = previous.price;

      if (currentPrice > previousPrice) {
        const increase = currentPrice - previousPrice;
        const percentIncrease = (increase / previousPrice) * 100;

        // Fiabilité basée sur nombre d'observations
        const observations = latest.observations || 1;
        const stores = latest.stores || 1;
        const isConfirmed = observations >= 3 && stores >= 2;

        shocks.push({
          productName: product.name || 'Produit inconnu',
          priceIncrease: increase,
          percentageIncrease: percentIncrease,
          territory: territory,
          isConfirmed,
          currentPrice,
          previousPrice,
          category: product.category,
        });
      }
    });
  }

  // Analyser les services
  if (servicesData?.services) {
    servicesData.services.forEach((service: any) => {
      if (service.territory !== territory) return;

      const priceHistory = service.priceHistory || [];
      if (priceHistory.length < 2) return;

      const sorted = [...priceHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const latest = sorted[0];
      const previous = sorted[1];

      const latestDate = new Date(latest.date).getTime();
      if (latestDate < sevenDaysAgo) return;

      const currentPrice = latest.price;
      const previousPrice = previous.price;

      if (currentPrice > previousPrice) {
        const increase = currentPrice - previousPrice;
        const percentIncrease = (increase / previousPrice) * 100;

        shocks.push({
          productName: service.name || 'Service inconnu',
          priceIncrease: increase,
          percentageIncrease: percentIncrease,
          territory: territory,
          isConfirmed: true, // Services = données officielles
          currentPrice,
          previousPrice,
          category: 'Services',
        });
      }
    });
  }

  // Trier par impact (% × €)
  return shocks.sort((a, b) => {
    const impactA = a.percentageIncrease * a.priceIncrease;
    const impactB = b.percentageIncrease * b.priceIncrease;
    return impactB - impactA;
  });
}
