import { db } from '../lib/firebase';
import { collection, getDocs, type DocumentData } from 'firebase/firestore';
import { logError, logWarn } from '../utils/logger';

export type AlertLevel = 'critical' | 'moderate' | 'good';

export interface TiPanieBasketForecast {
  id: string;
  territory?: string;
  date?: string;
  stock?: number;
  sales?: number;
  forecast?: number;
  [key: string]: unknown;
}

export interface TiPanieBasketItem {
  id: string;
  territory?: string;
  updatedAt?: { seconds: number } | string | number;
  price?: number;
  estimatedValue?: number;
  stock?: number;
  [key: string]: unknown;
}

export interface AIDashboardKpis {
  totalBaskets: number;
  totalSavings: string;
  ruptureRate: string;
  alertsCount: number;
  inStockCount: number;
}

export interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'stock' | 'forecast' | 'economy' | 'info';
  message: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  borderDash?: number[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Get today's Ti-Panié baskets filtered by territory.
 */
export async function getTodayBaskets(territory?: string): Promise<TiPanieBasketItem[]> {
  if (!db) return [];
  try {
    const col = collection(db, 'ti_panie');
    const snap = await getDocs(col);
    const today = new Date().toDateString();

    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as TiPanieBasketItem)
      .filter((b) => {
        const raw = b.updatedAt;
        const updatedDate =
          raw && typeof raw === 'object' && 'seconds' in raw
            ? new Date((raw as { seconds: number }).seconds * 1000)
            : new Date((raw as string | number | undefined) ?? Date.now());
        return updatedDate.toDateString() === today;
      })
      .filter((b) => !territory || b.territory === territory);
  } catch (error) {
    logError('getTodayBaskets error', error);
    return [];
  }
}

/**
 * Get forecast data filtered by territory.
 */
export async function getForecast(territory?: string): Promise<TiPanieBasketForecast[]> {
  if (!db) return [];
  try {
    const col = collection(db, 'ti_panie_forecast');
    const snap = await getDocs(col);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as TiPanieBasketForecast)
      .filter((d) => !territory || d.territory === territory);
  } catch {
    logWarn('Forecast collection not found, returning empty data');
    return [];
  }
}

/**
 * Compute KPIs from baskets and forecast data.
 */
export function computeKpis(params: {
  baskets?: TiPanieBasketItem[];
  forecast?: TiPanieBasketForecast[];
}): AIDashboardKpis {
  const { baskets = [], forecast = [] } = params;
  const total = baskets.length;

  const totalSavings = baskets.reduce((acc, b) => {
    const savings = (b.estimatedValue ?? 0) - (b.price ?? 0);
    return acc + (savings > 0 ? savings : 0);
  }, 0);

  const stockAvg =
    baskets.length > 0 ? baskets.reduce((a, b) => a + (b.stock ?? 0), 0) / baskets.length : 0;

  const alerts = forecast.filter((f) => (f.forecast ?? 0) < stockAvg * 0.3).length;
  const inStock = baskets.filter((b) => (b.stock ?? 0) > 0).length;
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
 * Generate AI recommendations based on data analysis.
 */
export function generateRecommendations(params: {
  baskets?: TiPanieBasketItem[];
  forecast?: TiPanieBasketForecast[];
  kpis?: Partial<AIDashboardKpis>;
}): AIRecommendation[] {
  const { baskets = [], forecast: _forecast = [], kpis = {} } = params;
  const recommendations: AIRecommendation[] = [];

  if (parseFloat(kpis.ruptureRate ?? '0') > 20) {
    recommendations.push({
      priority: 'high',
      type: 'stock',
      message: `Taux de rupture élevé (${kpis.ruptureRate}%). Prévoir un réassort urgent.`,
    });
  }

  const lowStock = baskets.filter((b) => (b.stock ?? 0) > 0 && (b.stock ?? 0) < 5);
  if (lowStock.length > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'stock',
      message: `${lowStock.length} panier(s) avec stock faible (<5 unités). Prévoir réapprovisionnement.`,
    });
  }

  if ((kpis.alertsCount ?? 0) > 0) {
    recommendations.push({
      priority: 'high',
      type: 'forecast',
      message: `${kpis.alertsCount} rupture(s) probable(s) dans les 48h selon prévisions. Anticiper les commandes.`,
    });
  }

  if (parseFloat(kpis.totalSavings ?? '0') > 100) {
    recommendations.push({
      priority: 'low',
      type: 'economy',
      message: `Économies potentielles de ${kpis.totalSavings}€ aujourd'hui. Communiquer auprès des utilisateurs.`,
    });
  }

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
 * Prepare chart data for 7-day trend visualization.
 */
export function prepareChartData(forecast: TiPanieBasketForecast[] = []): ChartData {
  const byDate: Record<string, { stock: number; sales: number; forecast: number; count: number }> =
    {};

  for (const f of forecast) {
    const date = f.date ?? new Date().toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { stock: 0, sales: 0, forecast: 0, count: 0 };
    }
    byDate[date].stock += f.stock ?? 0;
    byDate[date].sales += f.sales ?? 0;
    byDate[date].forecast += f.forecast ?? 0;
    byDate[date].count += 1;
  }

  const dates = Object.keys(byDate).sort();

  return {
    labels: dates.map((d) =>
      new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    ),
    datasets: [
      {
        label: 'Stock actuel',
        data: dates.map((d) => Math.round(byDate[d].stock / byDate[d].count)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Ventes',
        data: dates.map((d) => Math.round(byDate[d].sales / byDate[d].count)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Prévision',
        data: dates.map((d) => Math.round(byDate[d].forecast / byDate[d].count)),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };
}
