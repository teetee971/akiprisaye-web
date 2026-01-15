/**
 * Types pour l'API Gateway & Authentification
 * 
 * Définit les structures de données pour:
 * - API Keys
 * - Permissions
 * - Usage tracking
 * - Subscription tiers
 */

import { ApiKey, ApiPermission, SubscriptionTier } from '@prisma/client';

/**
 * API Key avec la clé secrète (retournée une seule fois à la création)
 */
export interface ApiKeyWithSecret extends ApiKey {
  secret: string;
}

/**
 * Statistiques d'usage d'une API key
 */
export interface UsageStats {
  totalRequests: number;
  period: 'day' | 'week' | 'month';
  byEndpoint: {
    endpoint: string;
    _count: number;
    _avg: {
      responseTime: number | null;
    };
  }[];
}

/**
 * Configuration des rate limits par niveau d'abonnement
 */
export interface RateLimitConfig {
  requestsPerDay: number;
  requestsPerHour: number;
  requestsPerMinute: number;
}

/**
 * Configuration d'un plan d'abonnement
 */
export interface SubscriptionPlanConfig {
  tier: SubscriptionTier;
  name: string;
  features: {
    apiRateLimit: number;
    apiKeysCount: number;
    analyticsAccess: boolean;
    exportAccess: boolean;
    prioritySupport: boolean;
  };
  price: {
    monthly: number; // en centimes
    yearly: number;  // en centimes
  };
}

/**
 * Plans d'abonnement disponibles
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlanConfig> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Gratuit',
    features: {
      apiRateLimit: 100,
      apiKeysCount: 1,
      analyticsAccess: false,
      exportAccess: false,
      prioritySupport: false,
    },
    price: {
      monthly: 0,
      yearly: 0,
    },
  },
  [SubscriptionTier.CITIZEN_PREMIUM]: {
    tier: SubscriptionTier.CITIZEN_PREMIUM,
    name: 'Citoyen Premium',
    features: {
      apiRateLimit: 1000,
      apiKeysCount: 3,
      analyticsAccess: false,
      exportAccess: true,
      prioritySupport: false,
    },
    price: {
      monthly: 990,  // 9.90€
      yearly: 9900,  // 99€ (2 mois gratuits)
    },
  },
  [SubscriptionTier.SME]: {
    tier: SubscriptionTier.SME,
    name: 'PME',
    features: {
      apiRateLimit: 5000,
      apiKeysCount: 5,
      analyticsAccess: true,
      exportAccess: true,
      prioritySupport: false,
    },
    price: {
      monthly: 4900,   // 49€
      yearly: 49000,   // 490€ (1 mois gratuit)
    },
  },
  [SubscriptionTier.BUSINESS_PRO]: {
    tier: SubscriptionTier.BUSINESS_PRO,
    name: 'Business Pro',
    features: {
      apiRateLimit: 50000,
      apiKeysCount: 10,
      analyticsAccess: true,
      exportAccess: true,
      prioritySupport: true,
    },
    price: {
      monthly: 19900,  // 199€
      yearly: 199000,  // 1990€ (1 mois gratuit)
    },
  },
  [SubscriptionTier.INSTITUTIONAL]: {
    tier: SubscriptionTier.INSTITUTIONAL,
    name: 'Institutionnel',
    features: {
      apiRateLimit: 500000,
      apiKeysCount: 50,
      analyticsAccess: true,
      exportAccess: true,
      prioritySupport: true,
    },
    price: {
      monthly: 99900,   // 999€
      yearly: 999000,   // 9990€ (1 mois gratuit)
    },
  },
};

/**
 * Permissions par défaut selon le niveau d'abonnement
 */
export const DEFAULT_PERMISSIONS: Record<SubscriptionTier, ApiPermission[]> = {
  [SubscriptionTier.FREE]: [
    ApiPermission.READ_COMPARATORS,
    ApiPermission.READ_PRICES,
    ApiPermission.READ_TERRITORIES,
  ],
  [SubscriptionTier.CITIZEN_PREMIUM]: [
    ApiPermission.READ_COMPARATORS,
    ApiPermission.READ_PRICES,
    ApiPermission.READ_TERRITORIES,
    ApiPermission.WRITE_CONTRIBUTIONS,
    ApiPermission.EXPORT_DATA,
  ],
  [SubscriptionTier.SME]: [
    ApiPermission.READ_COMPARATORS,
    ApiPermission.READ_PRICES,
    ApiPermission.READ_TERRITORIES,
    ApiPermission.READ_ANALYTICS,
    ApiPermission.WRITE_CONTRIBUTIONS,
    ApiPermission.EXPORT_DATA,
  ],
  [SubscriptionTier.BUSINESS_PRO]: [
    ApiPermission.READ_COMPARATORS,
    ApiPermission.READ_PRICES,
    ApiPermission.READ_TERRITORIES,
    ApiPermission.READ_ANALYTICS,
    ApiPermission.WRITE_CONTRIBUTIONS,
    ApiPermission.EXPORT_DATA,
  ],
  [SubscriptionTier.INSTITUTIONAL]: [
    ApiPermission.READ_COMPARATORS,
    ApiPermission.READ_PRICES,
    ApiPermission.READ_TERRITORIES,
    ApiPermission.READ_ANALYTICS,
    ApiPermission.WRITE_CONTRIBUTIONS,
    ApiPermission.EXPORT_DATA,
    ApiPermission.ADMIN,
  ],
};
