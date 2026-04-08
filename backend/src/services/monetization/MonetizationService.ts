/**
 * MonetizationService — Orchestration centrale du moteur de revenus
 *
 * Agrège les métriques de tous les flux de revenus :
 * API Marketplace, Data Licensing, Sponsored Content, Affiliate, White-Label,
 * SMS/Push Premium, B2B2C, Corporate, Premium Reports, Geolocation, SaaS, Dynamic Pricing.
 */

export interface RevenueStream {
  name: string;
  key: string;
  dailyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  status: 'active' | 'planned' | 'beta';
  description: string;
}

export interface MonetizationSummary {
  streams: RevenueStream[];
  totalDailyRevenue: number;
  totalMonthlyRevenue: number;
  totalYearlyRevenue: number;
  generatedAt: string;
}

const REVENUE_STREAMS: RevenueStream[] = [
  {
    name: 'Abonnements SumUp',
    key: 'subscriptions',
    dailyRevenue: 100,
    monthlyRevenue: 3000,
    yearlyRevenue: 36000,
    status: 'active',
    description: '4 plans × ~25 utilisateurs',
  },
  {
    name: 'API Marketplace',
    key: 'api_marketplace',
    dailyRevenue: 166,
    monthlyRevenue: 5000,
    yearlyRevenue: 60000,
    status: 'beta',
    description: '100 commerces × 1k requêtes/jour',
  },
  {
    name: 'Data Licensing',
    key: 'data_licensing',
    dailyRevenue: 50,
    monthlyRevenue: 1500,
    yearlyRevenue: 18000,
    status: 'beta',
    description: '2 rapports/jour × 25€',
  },
  {
    name: 'Sponsored Content',
    key: 'sponsored_content',
    dailyRevenue: 130,
    monthlyRevenue: 3900,
    yearlyRevenue: 46800,
    status: 'planned',
    description: '2 sponsors × 1.3k + search ads',
  },
  {
    name: 'Affiliate Links',
    key: 'affiliate',
    dailyRevenue: 75,
    monthlyRevenue: 2250,
    yearlyRevenue: 27000,
    status: 'active',
    description: '50 conversions × 1.50€',
  },
  {
    name: 'White-Label',
    key: 'white_label',
    dailyRevenue: 83,
    monthlyRevenue: 2500,
    yearlyRevenue: 30000,
    status: 'planned',
    description: '5 clients × 500€/mois',
  },
  {
    name: 'SMS/Push Premium',
    key: 'sms_push',
    dailyRevenue: 33,
    monthlyRevenue: 1000,
    yearlyRevenue: 12000,
    status: 'planned',
    description: '1000 users × 0.10€',
  },
  {
    name: 'Corporate B2B',
    key: 'corporate',
    dailyRevenue: 166,
    monthlyRevenue: 5000,
    yearlyRevenue: 60000,
    status: 'planned',
    description: '10 clients × 500€/mois',
  },
  {
    name: 'Premium Reports',
    key: 'premium_reports',
    dailyRevenue: 20,
    monthlyRevenue: 600,
    yearlyRevenue: 7200,
    status: 'beta',
    description: '100 reports × 2€',
  },
  {
    name: 'Geolocation Alerts',
    key: 'geolocation',
    dailyRevenue: 66,
    monthlyRevenue: 2000,
    yearlyRevenue: 24000,
    status: 'planned',
    description: '2000€/mois',
  },
  {
    name: 'SaaS Marketplace',
    key: 'saas_marketplace',
    dailyRevenue: 333,
    monthlyRevenue: 10000,
    yearlyRevenue: 120000,
    status: 'planned',
    description: '10k€/mois',
  },
  {
    name: 'B2B2C Integration',
    key: 'b2b2c',
    dailyRevenue: 1666,
    monthlyRevenue: 50000,
    yearlyRevenue: 600000,
    status: 'planned',
    description: '50k€/mois potentiel',
  },
];

export class MonetizationService {
  static getSummary(): MonetizationSummary {
    const totalDailyRevenue = REVENUE_STREAMS.reduce((sum, s) => sum + s.dailyRevenue, 0);
    const totalMonthlyRevenue = REVENUE_STREAMS.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const totalYearlyRevenue = REVENUE_STREAMS.reduce((sum, s) => sum + s.yearlyRevenue, 0);

    return {
      streams: REVENUE_STREAMS,
      totalDailyRevenue,
      totalMonthlyRevenue,
      totalYearlyRevenue,
      generatedAt: new Date().toISOString(),
    };
  }

  static getStreamByKey(key: string): RevenueStream | undefined {
    return REVENUE_STREAMS.find((s) => s.key === key);
  }

  static getActiveStreams(): RevenueStream[] {
    return REVENUE_STREAMS.filter((s) => s.status === 'active');
  }

  static getBetaStreams(): RevenueStream[] {
    return REVENUE_STREAMS.filter((s) => s.status === 'beta');
  }

  static getPlannedStreams(): RevenueStream[] {
    return REVENUE_STREAMS.filter((s) => s.status === 'planned');
  }
}
