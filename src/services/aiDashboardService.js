import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Get today's baskets filtered by territory
 */
export async function getTodayBaskets(territory) {
  if (!db) return [];
  const col = collection(db, 'ti_panie');
  const snap = await getDocs(col);
  const today = new Date().toDateString();
  const list = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => {
      const updatedDate = b.updatedAt?.seconds
        ? new Date(b.updatedAt.seconds * 1000)
        : new Date(b.updatedAt || Date.now());
      return updatedDate.toDateString() === today;
    })
    .filter((b) => !territory || b.territory === territory);
  return list;
}

/**
 * Get forecast data filtered by territory
 */
export async function getForecast(territory) {
  if (!db) return [];
  try {
    const col = collection(db, 'ti_panie_forecast');
    const snap = await getDocs(col);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => !territory || d.territory === territory);
  } catch (error) {
    // Collection might not exist yet, return empty array
    console.warn('Forecast collection not found, returning empty data');
    return [];
  }
}

/**
 * Compute KPIs from baskets and forecast data
 */
export function computeKpis({ baskets = [], forecast = [] }) {
  const total = baskets.length;
  
  // Calculate total savings
  const totalSavings = baskets.reduce((acc, b) => {
    const savings = (b.estimatedValue || 0) - (b.price || 0);
    return acc + (savings > 0 ? savings : 0);
  }, 0);

  // Calculate average stock
  const avgStock = (arr) => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + (b.stock || 0), 0) / arr.length;
  };
  
  const stockAvg = avgStock(baskets);

  // Count rupture alerts (forecast < 30% of average stock)
  const alerts = forecast.filter((f) => (f.forecast || 0) < stockAvg * 0.3).length;

  // Count in-stock baskets
  const inStock = baskets.filter((b) => (b.stock || 0) > 0).length;

  // Calculate rupture rate
  const ruptureRate = total > 0 ? ((total - inStock) / total) * 100 : 0;

  return {
    totalBaskets: total,
    totalSavings: totalSavings.toFixed(2),
    ruptureRate: ruptureRate.toFixed(1),
    alertsCount: alerts,
    inStockCount: inStock,
  };
}

/**
 * Generate AI recommendations based on data analysis
 */
export function generateRecommendations({ baskets = [], forecast = [], kpis = {} }) {
  const recommendations = [];

  // Check rupture rate
  if (parseFloat(kpis.ruptureRate) > 20) {
    recommendations.push({
      priority: 'high',
      type: 'stock',
      message: `Taux de rupture élevé (${kpis.ruptureRate}%). Prévoir un réassort urgent.`,
    });
  }

  // Check low stock items
  const lowStock = baskets.filter((b) => (b.stock || 0) > 0 && (b.stock || 0) < 5);
  if (lowStock.length > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'stock',
      message: `${lowStock.length} panier(s) avec stock faible (<5 unités). Prévoir réapprovisionnement.`,
    });
  }

  // Check forecast alerts
  if (kpis.alertsCount > 0) {
    recommendations.push({
      priority: 'high',
      type: 'forecast',
      message: `${kpis.alertsCount} rupture(s) probable(s) dans les 48h selon IA. Anticiper les commandes.`,
    });
  }

  // Check savings opportunity
  if (parseFloat(kpis.totalSavings) > 100) {
    recommendations.push({
      priority: 'low',
      type: 'economy',
      message: `Économies potentielles de ${kpis.totalSavings}€ aujourd'hui. Communiquer auprès des utilisateurs.`,
    });
  }

  // Default recommendation if none
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      type: 'info',
      message: 'Situation normale. Continuer le suivi quotidien des stocks.',
    });
  }

  return recommendations;
}

/**
 * Prepare chart data for 7-day trend
 */
export function prepareChartData(forecast = []) {
  // Group by date
  const byDate = {};
  forecast.forEach((f) => {
    const date = f.date || new Date().toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { stock: 0, sales: 0, forecast: 0, count: 0 };
    }
    byDate[date].stock += f.stock || 0;
    byDate[date].sales += f.sales || 0;
    byDate[date].forecast += f.forecast || 0;
    byDate[date].count += 1;
  });

  // Sort dates and prepare arrays
  const dates = Object.keys(byDate).sort();
  const stockData = dates.map((d) => Math.round(byDate[d].stock / byDate[d].count));
  const salesData = dates.map((d) => Math.round(byDate[d].sales / byDate[d].count));
  const forecastData = dates.map((d) => Math.round(byDate[d].forecast / byDate[d].count));

  return {
    labels: dates.map((d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Stock actuel',
        data: stockData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Ventes',
        data: salesData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Prévision IA',
        data: forecastData,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };
}
