/**
 * Subscription Plans Configuration
 * Configuration complète des 6 tiers d'abonnement
 * 
 * Principes éthiques:
 * ✅ Transparent : Prix clairs, pas de frais cachés
 * ✅ Équitable : Ceux qui bénéficient économiquement paient
 * ✅ Flexible : Annulation facile, pas d'engagement
 * ✅ Sécurisé : Paiements Stripe PCI-DSS compliant
 */

import { SubscriptionTier, type SubscriptionPlan } from '../types/subscription.js';

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.FREE]: {
    id: SubscriptionTier.FREE,
    name: 'Gratuit',
    tagline: 'Pour tous les citoyens ultramarins',
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'EUR',
      stripePriceId: '',  // Pas de Stripe
      stripeProductId: ''
    },
    features: {
      comparators: true,
      contributions: true,
      
      apiAccess: false,
      apiRateLimit: 0,
      webhooks: false,
      
      alerts: 3,
      advancedAlerts: false,
      smsAlerts: false,
      
      exports: 5,
      exportFormats: ['csv', 'pdf'],
      bulkExport: false,
      
      analytics: false,
      advancedAnalytics: false,
      competitorTracking: false,
      marketReports: false,
      customReports: false,
      
      businessProfile: false,
      featuredListing: false,
      badge: null,
      responseToReviews: false,
      
      support: 'community',
      responseTime: '48h',
      
      adFree: false,
      whiteLabel: false,
      dataRetention: 3
    }
  },
  
  [SubscriptionTier.CITIZEN_PREMIUM]: {
    id: SubscriptionTier.CITIZEN_PREMIUM,
    name: 'Citoyen Premium',
    tagline: 'Fonctionnalités avancées pour optimiser votre budget',
    pricing: {
      monthly: 4.99,
      yearly: 49.90,  // ~4.16€/mois
      currency: 'EUR',
      stripePriceId: process.env.STRIPE_PRICE_CITIZEN_PREMIUM || '',
      stripeProductId: process.env.STRIPE_PRODUCT_CITIZEN_PREMIUM || ''
    },
    features: {
      comparators: true,
      contributions: true,
      
      apiAccess: true,
      apiRateLimit: 1000,
      webhooks: false,
      
      alerts: 20,
      advancedAlerts: true,
      smsAlerts: true,
      
      exports: 50,
      exportFormats: ['csv', 'pdf', 'excel'],
      bulkExport: false,
      
      analytics: true,
      advancedAnalytics: false,
      competitorTracking: false,
      marketReports: false,
      customReports: false,
      
      businessProfile: false,
      featuredListing: false,
      badge: '⭐ Premium',
      responseToReviews: false,
      
      support: 'email',
      responseTime: '24h',
      
      adFree: true,
      whiteLabel: false,
      dataRetention: 12
    },
    popular: true
  },
  
  [SubscriptionTier.SME_FREEMIUM]: {
    id: SubscriptionTier.SME_FREEMIUM,
    name: 'PME Locale',
    tagline: 'Visibilité et outils pour petites entreprises',
    pricing: {
      monthly: 29,
      yearly: 290,  // ~24€/mois
      currency: 'EUR',
      stripePriceId: process.env.STRIPE_PRICE_SME || '',
      stripeProductId: process.env.STRIPE_PRODUCT_SME || ''
    },
    features: {
      comparators: true,
      contributions: true,
      
      apiAccess: true,
      apiRateLimit: 5000,
      webhooks: false,
      
      alerts: 50,
      advancedAlerts: true,
      smsAlerts: true,
      
      exports: 200,
      exportFormats: ['csv', 'pdf', 'excel'],
      bulkExport: false,
      
      analytics: true,
      advancedAnalytics: false,
      competitorTracking: true,
      marketReports: false,
      customReports: false,
      
      businessProfile: true,
      featuredListing: true,
      badge: '🌿 Local',
      responseToReviews: true,
      
      support: 'priority',
      responseTime: '4h',
      
      adFree: true,
      whiteLabel: false,
      dataRetention: 24
    },
    limits: {
      users: 3,
      apiKeys: 2
    }
  },
  
  [SubscriptionTier.BUSINESS_PRO]: {
    id: SubscriptionTier.BUSINESS_PRO,
    name: 'Business Pro',
    tagline: 'Insights marché et API complète',
    pricing: {
      monthly: 299,
      yearly: 2990,  // ~249€/mois
      currency: 'EUR',
      stripePriceId: process.env.STRIPE_PRICE_BUSINESS || '',
      stripeProductId: process.env.STRIPE_PRODUCT_BUSINESS || ''
    },
    features: {
      comparators: true,
      contributions: true,
      
      apiAccess: true,
      apiRateLimit: 50000,
      webhooks: true,
      
      alerts: -1,  // Illimité
      advancedAlerts: true,
      smsAlerts: true,
      
      exports: -1,  // Illimité
      exportFormats: ['csv', 'pdf', 'excel', 'json'],
      bulkExport: true,
      
      analytics: true,
      advancedAnalytics: true,
      competitorTracking: true,
      marketReports: true,
      customReports: false,
      
      businessProfile: true,
      featuredListing: true,
      badge: '💼 Pro',
      responseToReviews: true,
      
      support: 'priority',
      responseTime: '2h',
      
      adFree: true,
      whiteLabel: false,
      dataRetention: 60
    },
    limits: {
      users: 10,
      apiKeys: 5
    },
    recommended: true
  },
  
  [SubscriptionTier.INSTITUTIONAL]: {
    id: SubscriptionTier.INSTITUTIONAL,
    name: 'Institutionnel',
    tagline: 'Solution complète pour collectivités et organismes publics',
    pricing: {
      monthly: 1500,
      yearly: 15000,  // ~1250€/mois
      currency: 'EUR',
      stripePriceId: process.env.STRIPE_PRICE_INSTITUTIONAL || '',
      stripeProductId: process.env.STRIPE_PRODUCT_INSTITUTIONAL || ''
    },
    features: {
      comparators: true,
      contributions: true,
      
      apiAccess: true,
      apiRateLimit: 500000,
      webhooks: true,
      
      alerts: -1,
      advancedAlerts: true,
      smsAlerts: true,
      
      exports: -1,
      exportFormats: ['csv', 'pdf', 'excel', 'json', 'xml'],
      bulkExport: true,
      
      analytics: true,
      advancedAnalytics: true,
      competitorTracking: true,
      marketReports: true,
      customReports: true,
      
      businessProfile: true,
      featuredListing: true,
      badge: '🏛️ Institutionnel',
      responseToReviews: true,
      
      support: 'dedicated',
      responseTime: '1h',
      
      adFree: true,
      whiteLabel: true,
      dataRetention: -1  // Illimité
    },
    limits: {
      users: -1,  // Illimité
      apiKeys: 20
    }
  },
  
  [SubscriptionTier.RESEARCH]: {
    id: SubscriptionTier.RESEARCH,
    name: 'Recherche',
    tagline: 'Accès données pour recherche académique',
    pricing: {
      monthly: 0,  // Sur devis
      yearly: 0,
      currency: 'EUR',
      stripePriceId: '',
      stripeProductId: ''
    },
    features: {
      comparators: true,
      contributions: false,
      
      apiAccess: true,
      apiRateLimit: 100000,
      webhooks: false,
      
      alerts: 10,
      advancedAlerts: false,
      smsAlerts: false,
      
      exports: -1,
      exportFormats: ['csv', 'json', 'xml'],
      bulkExport: true,
      
      analytics: true,
      advancedAnalytics: true,
      competitorTracking: false,
      marketReports: false,
      customReports: false,
      
      businessProfile: false,
      featuredListing: false,
      badge: '🎓 Recherche',
      responseToReviews: false,
      
      support: 'email',
      responseTime: '24h',
      
      adFree: true,
      whiteLabel: false,
      dataRetention: -1
    },
    limits: {
      users: 5,
      apiKeys: 3
    }
  }
};

/**
 * Get subscription plan by ID
 */
export function getSubscriptionPlan(planId: SubscriptionTier): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId] || null;
}

/**
 * Get all subscription plans
 */
export function getAllSubscriptionPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Get price for a plan and billing cycle
 */
export function getPlanPrice(planId: SubscriptionTier, interval: 'month' | 'year'): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) return 0;
  
  return interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly;
}

/**
 * Check if a feature is available in a plan
 */
export function hasFeature(
  planId: SubscriptionTier,
  feature: keyof SubscriptionPlan['features']
): boolean {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) return false;
  
  const featureValue = plan.features[feature];
  
  // Handle boolean features
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  
  // Handle numeric features (-1 means unlimited, 0 means none, > 0 means available)
  if (typeof featureValue === 'number') {
    return featureValue !== 0;
  }
  
  // Handle array features (non-empty means available)
  if (Array.isArray(featureValue)) {
    return featureValue.length > 0;
  }
  
  return false;
}

export default SUBSCRIPTION_PLANS;
