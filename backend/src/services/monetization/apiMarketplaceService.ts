/**
 * API Marketplace Service
 *
 * Gestion des clés API commerciales, rate limiting, usage tracking et facturation métrée.
 * Tiers : Starter (1k req/day, 50€/mois), Professional (10k, 200€/mois), Enterprise (illimité).
 */

import crypto from 'crypto';

export type ApiTier = 'starter' | 'professional' | 'enterprise';

export interface MarketplaceApiKey {
  id: string;
  clientId: string;
  secret: string;
  tier: ApiTier;
  rateLimit: number;  // requests/day
  monthlyBudget: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface UsageRecord {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  cost: number;
  timestamp: Date;
}

export interface ApiTierConfig {
  tier: ApiTier;
  rateLimitPerDay: number;
  monthlyPrice: number;
  costPerRequest: number;
  label: string;
  features: string[];
}

export const API_TIER_CONFIGS: Record<ApiTier, ApiTierConfig> = {
  starter: {
    tier: 'starter',
    rateLimitPerDay: 1000,
    monthlyPrice: 50,
    costPerRequest: 0.05,
    label: 'Starter',
    features: ['1 000 requêtes/jour', 'Endpoints publics', 'JSON API', 'Support email'],
  },
  professional: {
    tier: 'professional',
    rateLimitPerDay: 10000,
    monthlyPrice: 200,
    costPerRequest: 0.03,
    label: 'Professionnel',
    features: ['10 000 requêtes/jour', 'Tous les endpoints', 'Historique 12 mois', 'Webhooks', 'Support prioritaire'],
  },
  enterprise: {
    tier: 'enterprise',
    rateLimitPerDay: -1, // unlimited
    monthlyPrice: 0, // custom pricing
    costPerRequest: 0.01,
    label: 'Enterprise',
    features: ['Illimité', 'SLA 99,9%', 'IP whitelist', 'Support dédié', 'Prix personnalisé'],
  },
};

export class ApiMarketplaceService {
  /**
   * Generate a new marketplace API key pair.
   */
  static generateApiKey(tier: ApiTier = 'starter'): { clientId: string; secret: string } {
    const clientId = `aki_${crypto.randomBytes(12).toString('hex')}`;
    const secret = `sk_${crypto.randomBytes(24).toString('hex')}`;
    return { clientId, secret };
  }

  /**
   * Hash an API secret for secure storage using a password KDF (scrypt).
   */
  static hashSecret(secret: string, salt: string): string {
    return crypto.scryptSync(secret, salt, 32).toString('hex');
  }

  /**
   * Normalize endpoint paths so premium route matching is consistent
   * whether callers pass `/v1/...` or `/api/v1/...`.
   */
  private static normalizeEndpointPath(endpoint: string): string {
    const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return normalized.startsWith('/api/') ? normalized.slice(4) : normalized;
  }

  /**
   * Calculate the cost of a single API request.
   */
  static computeRequestCost(tier: ApiTier, endpoint: string): number {
    const config = API_TIER_CONFIGS[tier];
    const normalizedEndpoint = this.normalizeEndpointPath(endpoint);
    // Premium endpoints (predictions, reports) cost 3×
    const premiumEndpoints = ['/v1/prices/predict', '/v1/reports'];
    const isPremium = premiumEndpoints.some((ep) => normalizedEndpoint.startsWith(ep));
    return isPremium ? config.costPerRequest * 3 : config.costPerRequest;
  }

  /**
   * Check if an API key has exceeded its daily rate limit.
   */
  static isRateLimited(tier: ApiTier, usedToday: number): boolean {
    const config = API_TIER_CONFIGS[tier];
    if (config.rateLimitPerDay === -1) return false; // enterprise: unlimited
    return usedToday >= config.rateLimitPerDay;
  }

  /**
   * Compute monthly invoice total from usage events.
   */
  static computeMonthlyBill(tier: ApiTier, totalRequests: number): number {
    const config = API_TIER_CONFIGS[tier];
    if (tier === 'enterprise') {
      // Enterprise billed by actual usage
      return totalRequests * config.costPerRequest;
    }
    // Flat monthly fee
    return config.monthlyPrice;
  }

  /**
   * Get all tier configurations.
   */
  static getTierConfigs(): ApiTierConfig[] {
    return Object.values(API_TIER_CONFIGS);
  }

  /**
   * Validate an API key format.
   */
  static isValidKeyFormat(key: string): boolean {
    return /^aki_[a-f0-9]{24}$/.test(key);
  }

  /**
   * Generate SDK installation instructions.
   */
  static getSdkInstructions(): Record<string, string> {
    return {
      nodejs: 'npm install akiprisaye-api',
      python: 'pip install akiprisaye',
      curl: 'curl -H "Authorization: Bearer <API_KEY>" https://api.akiprisaye.re/v1/prices',
    };
  }
}
