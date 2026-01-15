/**
 * Offres pré-configurées du marketplace
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { MarketplaceOffer } from '../types/credits.js';

/**
 * Offres par défaut du marketplace
 * Note: Les IDs et dates sont ajoutés à la création
 */
export const DEFAULT_MARKETPLACE_OFFERS: Omit<MarketplaceOffer, 'id' | 'createdAt'>[] = [
  {
    type: 'premium_subscription',
    name: '1 mois Premium gratuit',
    description: 'Débloquez toutes les fonctionnalités premium pendant 1 mois',
    imageUrl: '/assets/premium-badge.png',
    creditCost: 100,
    monetaryValue: 499, // 4.99€
    available: true,
  },
  {
    type: 'donation',
    name: 'Don 10€ Croix-Rouge',
    description: 'Soutenez la Croix-Rouge dans les territoires ultramarins',
    imageUrl: '/assets/red-cross.png',
    creditCost: 100,
    monetaryValue: 1000, // 10€
    available: true,
    donationTarget: 'Croix-Rouge Française',
  },
  {
    type: 'donation',
    name: 'Don 10€ Secours Populaire',
    description: 'Aidez les familles en difficulté',
    imageUrl: '/assets/secours-populaire.png',
    creditCost: 100,
    monetaryValue: 1000, // 10€
    available: true,
    donationTarget: 'Secours Populaire',
  },
  {
    type: 'donation',
    name: 'Don 10€ Restos du Cœur',
    description: 'Combattez la précarité alimentaire',
    imageUrl: '/assets/restos-du-coeur.png',
    creditCost: 100,
    monetaryValue: 1000, // 10€
    available: true,
    donationTarget: 'Restos du Cœur',
  },
  {
    type: 'cash',
    name: 'Retrait 10€',
    description: 'Échangez vos crédits contre de l\'argent (virement bancaire)',
    creditCost: 100,
    monetaryValue: 1000, // 10€
    available: true,
  },
  {
    type: 'cash',
    name: 'Retrait 50€',
    description: 'Échangez vos crédits contre de l\'argent (virement bancaire)',
    creditCost: 500,
    monetaryValue: 5000, // 50€
    available: true,
  },
  {
    type: 'cash',
    name: 'Retrait 100€',
    description: 'Échangez vos crédits contre de l\'argent (virement bancaire)',
    creditCost: 1000,
    monetaryValue: 10000, // 100€
    available: true,
  },
  {
    type: 'partner_product',
    name: 'Bon d\'achat 20€ Carrefour',
    description: 'Utilisable dans tous les Carrefour DOM-TOM',
    creditCost: 180, // Légère décote
    monetaryValue: 2000, // 20€
    available: true,
    partnerId: 'carrefour',
  },
  {
    type: 'partner_product',
    name: 'Bon d\'achat 20€ Super U',
    description: 'Utilisable dans tous les Super U DOM-TOM',
    creditCost: 180, // Légère décote
    monetaryValue: 2000, // 20€
    available: true,
    partnerId: 'super_u',
  },
  {
    type: 'partner_product',
    name: 'Bon d\'achat 50€ Leclerc',
    description: 'Utilisable dans tous les Leclerc DOM-TOM',
    creditCost: 450, // Légère décote
    monetaryValue: 5000, // 50€
    available: true,
    partnerId: 'leclerc',
  },
];

/**
 * Helper pour récupérer les offres par type
 */
export function getOffersByType(
  type: MarketplaceOffer['type']
): Omit<MarketplaceOffer, 'id' | 'createdAt'>[] {
  return DEFAULT_MARKETPLACE_OFFERS.filter(offer => offer.type === type);
}

/**
 * Helper pour récupérer les offres disponibles
 */
export function getAvailableOffers(): Omit<MarketplaceOffer, 'id' | 'createdAt'>[] {
  return DEFAULT_MARKETPLACE_OFFERS.filter(offer => offer.available);
}
