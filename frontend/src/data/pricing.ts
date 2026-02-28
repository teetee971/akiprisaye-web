export type BillingPeriod = 'monthly' | 'yearly';

export type PlanId = 'free' | 'pro' | 'business';
export type AddonId =
  | 'addon_api'
  | 'addon_ocr'
  | 'addon_exports'
  | 'addon_team'
  | 'addon_multi_territories'
  | 'addon_priority_support';

export type FeatureKey =
  | 'f_scan'
  | 'f_prices_view'
  | 'f_contribute'
  | 'f_api_access'
  | 'f_ocr_receipts'
  | 'f_exports'
  | 'f_history'
  | 'f_alerts'
  | 'f_multi_territories'
  | 'f_team'
  | 'f_sla_support';

export interface Money {
  currency: 'EUR';
  amountCents: number;
}

export interface PlanPricing {
  monthly: Money;
  yearly: Money;
  yearlyDiscountLabel?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  recommended?: boolean;
  pricing: PlanPricing;
  ctaLabel: string;
  ctaHref: string;
  includedAddonIds?: AddonId[];
  featureKeys: FeatureKey[];
  limits: {
    scansPerMonth?: number;
    exportsPerMonth?: number;
    teamSeats?: number;
    territories?: number;
  };
}

export interface Addon {
  id: AddonId;
  name: string;
  description: string;
  pricing: {
    monthly: Money;
    yearly: Money;
  };
  appliesTo: PlanId[];
}

export const FEATURES: Record<FeatureKey, { label: string; description?: string }> = {
  f_scan: { label: 'Scan produits (EAN)', description: 'Scan et recherche produit.' },
  f_prices_view: { label: 'Accès aux prix et agrégats', description: 'Derniers prix, min/max/médiane.' },
  f_contribute: { label: 'Contribution citoyenne', description: 'Ajout de prix (modéré) + historique.' },
  f_api_access: { label: 'Accès API', description: 'Endpoints de consultation (selon plan).' },
  f_ocr_receipts: { label: 'OCR tickets', description: 'Extraction de prix via tickets.' },
  f_exports: { label: 'Exports CSV/JSON', description: 'Exports pour analyses.' },
  f_history: { label: 'Historique avancé', description: 'Historique étendu et tendances.' },
  f_alerts: { label: 'Alertes prix', description: 'Alertes sur variations / seuils.' },
  f_multi_territories: { label: 'Multi-territoires', description: 'Comparaison entre territoires.' },
  f_team: { label: 'Équipe & rôles', description: 'Plusieurs comptes + permissions.' },
  f_sla_support: { label: 'Support prioritaire / SLA', description: 'Support accéléré.' },
};

const EUR = (amountCents: number): Money => ({ currency: 'EUR', amountCents });

/**
 * Convention "2 mois off" : annuel = 10 x mensuel (et non 12).
 * => le prix annuel est un total payé en 1 fois.
 * => on calcule aussi un "équivalent mensuel" = annuel / 12 pour l’affichage.
 */
export const ADDONS: Addon[] = [
  {
    id: 'addon_api',
    name: 'Pack API',
    description: 'Clés API + quota élargi + endpoints premium.',
    pricing: { monthly: EUR(1900), yearly: EUR(1900 * 10) },
    appliesTo: ['free', 'pro', 'business'],
  },
  {
    id: 'addon_ocr',
    name: 'OCR Tickets',
    description: 'Import tickets + extraction + contrôle qualité.',
    pricing: { monthly: EUR(2900), yearly: EUR(2900 * 10) },
    appliesTo: ['pro', 'business'],
  },
  {
    id: 'addon_exports',
    name: 'Exports avancés',
    description: 'Exports complets + scheduling + formats enrichis.',
    pricing: { monthly: EUR(900), yearly: EUR(900 * 10) },
    appliesTo: ['pro', 'business'],
  },
  {
    id: 'addon_team',
    name: 'Sièges équipe supplémentaires',
    description: 'Ajoute des sièges au-delà du plan.',
    pricing: { monthly: EUR(700), yearly: EUR(700 * 10) },
    appliesTo: ['business'],
  },
  {
    id: 'addon_multi_territories',
    name: 'Multi-territoires',
    description: 'Comparaison & dashboards multi territoires.',
    pricing: { monthly: EUR(1200), yearly: EUR(1200 * 10) },
    appliesTo: ['pro', 'business'],
  },
  {
    id: 'addon_priority_support',
    name: 'Support prioritaire',
    description: 'SLA et assistance accélérée.',
    pricing: { monthly: EUR(1500), yearly: EUR(1500 * 10) },
    appliesTo: ['pro', 'business'],
  },
];

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    tagline: 'Découvrir et contribuer.',
    pricing: { monthly: EUR(0), yearly: EUR(0) },
    ctaLabel: 'Commencer',
    ctaHref: '/signup',
    featureKeys: ['f_scan', 'f_prices_view', 'f_contribute'],
    limits: { scansPerMonth: 60, exportsPerMonth: 0, territories: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pour pros, associations, médias, analystes.',
    recommended: true,
    pricing: {
      monthly: EUR(4900),
      yearly: EUR(4900 * 10),
      yearlyDiscountLabel: '2 mois off',
    },
    ctaLabel: 'Choisir Pro',
    ctaHref: '/checkout?plan=pro',
    includedAddonIds: [],
    featureKeys: ['f_scan', 'f_prices_view', 'f_contribute', 'f_history', 'f_alerts', 'f_api_access'],
    limits: { scansPerMonth: 1000, exportsPerMonth: 10, territories: 3 },
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Pour équipes et exploitation intensive.',
    pricing: {
      monthly: EUR(9900),
      yearly: EUR(9900 * 10),
      yearlyDiscountLabel: '2 mois off',
    },
    ctaLabel: 'Choisir Business',
    ctaHref: '/checkout?plan=business',
    includedAddonIds: [],
    featureKeys: [
      'f_scan',
      'f_prices_view',
      'f_contribute',
      'f_history',
      'f_alerts',
      'f_api_access',
      'f_exports',
      'f_multi_territories',
      'f_team',
      'f_sla_support',
    ],
    limits: { scansPerMonth: undefined, exportsPerMonth: 100, teamSeats: 5, territories: 9 },
  },
];

export const FAQ = [
  {
    q: 'Je peux commencer gratuitement ?',
    a: 'Oui. Le plan Gratuit permet de scanner, consulter des agrégats et contribuer. Tu passes en Pro/Business quand tu veux.',
  },
  {
    q: 'Mensuel vs Annuel : c’est quoi la différence ?',
    a: 'L’annuel applique une remise (équivalent ~2 mois off). Les fonctionnalités restent identiques.',
  },
  {
    q: 'Les options sont obligatoires ?',
    a: 'Non. Les options servent à débloquer des capacités (API/OCR/exports/support) selon tes besoins.',
  },
  {
    q: 'Paiement plus tard : ça casse la page ?',
    a: 'Non. Les boutons pointent déjà vers /checkout. Tu brancheras Stripe/PayPal ensuite sans refaire l’UI.',
  },
];

export function moneyCents(value: Money): number {
  return value.amountCents;
}

export function formatMoneyEURFromCents(cents: number): string {
  if (cents === 0) return '0 €';
  const value = cents / 100;
  // Affichage propre (fr-FR), sans décimales si entier, sinon 2
  const isInt = Math.abs(value - Math.round(value)) < 1e-9;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: isInt ? 0 : 2,
  }).format(value);
}

export function formatPlanPrice(plan: Plan, period: BillingPeriod): string {
  const cents = period === 'monthly' ? plan.pricing.monthly.amountCents : plan.pricing.yearly.amountCents;
  return formatMoneyEURFromCents(cents);
}

export function formatAddonPrice(addon: Addon, period: BillingPeriod): string {
  const cents = period === 'monthly' ? addon.pricing.monthly.amountCents : addon.pricing.yearly.amountCents;
  return formatMoneyEURFromCents(cents);
}

/** Équivalent mensuel sur annuel: total annuel / 12 */
export function formatMonthlyEquivalentFromYearlyCents(yearlyTotalCents: number): string {
  if (yearlyTotalCents === 0) return '0 €';
  const monthlyEqCents = Math.round(yearlyTotalCents / 12);
  return formatMoneyEURFromCents(monthlyEqCents);
}
