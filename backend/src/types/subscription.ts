/**
 * Subscription Types and Interfaces
 * Système d'Abonnements & Paiements - A KI PRI SA YÉ
 * 
 * Modèle économique éthique:
 * - FREE: Toujours gratuit pour citoyens contributeurs
 * - CITIZEN_PREMIUM: 4.99€/mois - fonctionnalités avancées
 * - SME_FREEMIUM: 29€/mois - PME locales
 * - BUSINESS_PRO: 79€/mois - Grandes entreprises
 * - INSTITUTIONAL: Sur devis - Collectivités
 * - RESEARCH: Sur devis - Recherche académique
 *
 * Intégration paiement: SumUp Pro
 */

export enum SubscriptionTier {
  FREE = 'free',
  CITIZEN_PREMIUM = 'citizen_premium',
  SME_FREEMIUM = 'sme_freemium',
  BUSINESS_PRO = 'business_pro',
  INSTITUTIONAL = 'institutional',
  RESEARCH = 'research'
}

// ---- SumUp-specific types ----

/**
 * SumUp Customer response.
 * The API response has customer_id at top level.
 * personal_details holds the email/name (as sent in the request body).
 */
export interface SumUpCustomer {
  customer_id: string;
  personal_details?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface SumUpCheckout {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code: string;
  description: string;
  return_url?: string;
  redirect_url?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface SumUpSubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELED' | 'PENDING';
  interval: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  next_renewal_date?: string;
}

export interface SumUpWebhookEvent {
  id: string;
  event_type: SumUpWebhookEventType;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type SumUpWebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.renewed'
  | 'subscription.canceled';

// ---- Plan mapping ----

/** Maps a SubscriptionTier to a SumUp plan key used for checkout descriptions */
export const SUMUP_PLAN_KEYS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'free',
  [SubscriptionTier.CITIZEN_PREMIUM]: 'citizen_premium',
  [SubscriptionTier.SME_FREEMIUM]: 'sme_freemium',
  [SubscriptionTier.BUSINESS_PRO]: 'business_pro',
  [SubscriptionTier.INSTITUTIONAL]: 'institutional',
  [SubscriptionTier.RESEARCH]: 'research',
};

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  
  pricing: {
    monthly: number;      // Prix mensuel en EUR
    yearly: number;       // Prix annuel en EUR (2 mois offerts)
    currency: 'EUR';
    /** SumUp plan identifier key (used in checkout descriptions) */
    sumupPlanKey: string;
  };
  
  features: {
    // Accès base
    comparators: boolean;              // Accès 29 comparateurs
    contributions: boolean;            // Contribuer données
    
    // API
    apiAccess: boolean;                // Accès API REST
    apiRateLimit: number;              // Requêtes/jour (0 = pas d'accès)
    webhooks: boolean;                 // Webhooks temps réel
    
    // Alertes
    alerts: number;                    // Nombre alertes max (-1 = illimité)
    advancedAlerts: boolean;           // Alertes conditions multiples
    smsAlerts: boolean;                // Alertes SMS
    
    // Exports
    exports: number;                   // Exports/mois (-1 = illimité)
    exportFormats: string[];           // ['csv', 'pdf', 'excel']
    bulkExport: boolean;               // Export en masse
    
    // Analytics
    analytics: boolean;                // Dashboards analytics
    advancedAnalytics: boolean;        // Prévisions, ML
    competitorTracking: boolean;       // Suivi concurrence
    marketReports: boolean;            // Rapports marché
    customReports: boolean;            // Rapports sur mesure
    
    // Visibilité (pour entreprises)
    businessProfile: boolean;          // Profil entreprise
    featuredListing: boolean;          // Mise en avant
    badge: string | null;              // Badge spécial
    responseToReviews: boolean;        // Répondre avis
    
    // Support
    support: 'community' | 'email' | 'priority' | 'dedicated';
    responseTime: string;              // "48h", "24h", "4h", "1h"
    
    // Divers
    adFree: boolean;                   // Sans pub
    whiteLabel: boolean;               // White-label API
    dataRetention: number;             // Mois historique (-1 = illimité)
  };
  
  limits?: {
    users?: number;                    // Utilisateurs (pour orga) (-1 = illimité)
    apiKeys?: number;                  // API keys max
    customDomains?: number;            // Domaines personnalisés
  };
  
  recommended?: boolean;               // Badge "Recommandé"
  popular?: boolean;                   // Badge "Populaire"
}

export interface Subscription {
  id: string;
  userId: string;
  planId: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  
  trialEnd?: Date;
  
  sumupSubscriptionId?: string;
  sumupCustomerId?: string;
  sumupPaymentId?: string;
  
  billingCycle?: 'monthly' | 'yearly';
  nextRenewalDate?: Date;
  affiliateSource?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  receiptUrl?: string;
  createdAt: Date;
}

export interface CreateSubscriptionParams {
  userId: string;
  planId: SubscriptionTier;
  paymentMethodId: string | null;  // Null si FREE
  interval: 'monthly' | 'yearly';
  affiliateSource?: string;
}

/** Returned by createSubscription — includes checkoutId for paid plans */
export interface CreateSubscriptionResult {
  subscription: Subscription;
  /** Present for paid plans: the SumUp checkout ID to mount in the payment widget */
  checkoutId?: string;
}

export interface ChangeSubscriptionParams {
  subscriptionId: string;
  newPlanId: SubscriptionTier;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  immediately: boolean;
}

export interface CheckFeatureAccessParams {
  userId: string;
  feature: keyof SubscriptionPlan['features'];
}
