/**
 * b2bOfferEngine.ts — B2B commercial offer classification (V6)
 */

export type B2BOfferTier = 'starter' | 'pro' | 'premium';

export interface B2BAccount {
  type: 'retailer-small' | 'retailer-regional' | 'retailer-national' | 'brand';
  territories?: number;
  productCount?: number;
}

export interface B2BOffer {
  tier: B2BOfferTier;
  name: string;
  price: string;
  perks: string[];
  targetScope: string;
}

const OFFERS: Record<B2BOfferTier, B2BOffer> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    price: '99€ / mois',
    perks: [
      'Badge "Enseigne partenaire"',
      'Priorité classement local',
      'Lien direct vers votre site',
    ],
    targetScope: '1 territoire, < 5 points de vente',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: '249€ / mois',
    perks: [
      'Tout Starter',
      'Rapport mensuel prix concurrents',
      'Top 3 garanti sur vos catégories',
      'Alerte concurrents',
    ],
    targetScope: "jusqu'à 3 territoires, 5–20 points de vente",
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    price: 'Sur devis',
    perks: [
      'Tout Pro',
      'Page enseigne dédiée',
      'Accès API données',
      'Dashboard B2B personnalisé',
      'Support dédié',
    ],
    targetScope: 'tous territoires, enseigne nationale ou groupement',
  },
};

export function buildB2BOffer(account: B2BAccount): B2BOffer {
  if (account.type === 'retailer-national' || account.type === 'brand') return OFFERS.premium;
  if (account.type === 'retailer-regional' || (account.territories ?? 1) > 1) return OFFERS.pro;
  return OFFERS.starter;
}

export function getAllOffers(): B2BOffer[] {
  return [OFFERS.starter, OFFERS.pro, OFFERS.premium];
}
