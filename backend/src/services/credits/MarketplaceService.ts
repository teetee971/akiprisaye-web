/**
 * Service de gestion du marketplace de crédits
 * A KI PRI SA YÉ - Version 1.0.0
 * 
 * Gère:
 * - Offres disponibles (premium, donations, produits partenaires, cash)
 * - Achat d'offres avec crédits
 * - Fulfillment automatique selon type d'offre
 * - Gestion du stock
 * 
 * Types d'offres:
 * - premium_subscription: Activation abonnement premium
 * - donation: Don à une ONG
 * - partner_product: Code promo partenaire
 * - cash: Retrait d'argent
 */

import { PrismaClient, EntityStatus, Prisma } from '@prisma/client';
import {
  MarketplaceOffer,
  MarketplacePurchase,
  InsufficientCreditsError,
} from '../../types/credits.js';
import { CreditsService } from './CreditsService.js';

export class MarketplaceService {
  private prisma: PrismaClient;
  private creditsService: CreditsService;

  constructor(prisma: PrismaClient, creditsService: CreditsService) {
    this.prisma = prisma;
    this.creditsService = creditsService;
  }

  /**
   * Récupérer les offres disponibles
   * 
   * @param filters - Filtres optionnels
   * @returns Liste des offres
   */
  async getOffers(filters?: {
    type?: string;
    available?: boolean;
  }): Promise<MarketplaceOffer[]> {
    const where: Prisma.marketplaceOfferWhereInput = {
      status: EntityStatus.ACTIVE,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    const offers = await this.prisma.marketplaceOffer.findMany({
      where,
      orderBy: { price: 'asc' },
    });

    // Filter offers with stock > 0
    return offers
      .filter(offer => offer.quantity > 0)
      .map(offer => ({
        id: offer.id,
        type: (offer.type || 'other').toLowerCase() as 'premium_subscription' | 'donation' | 'partner_product' | 'cash' | 'other',
        name: offer.title,
        description: offer.description || '',
        imageUrl: undefined,
        creditCost: Math.round(offer.price),
        monetaryValue: Math.round(offer.price),
        available: offer.status === EntityStatus.ACTIVE,
        stock: offer.quantity,
        createdAt: offer.createdAt,
      }));
  }

  /**
   * Acheter une offre avec crédits
   * 
   * @param userId - ID de l'utilisateur
   * @param offerId - ID de l'offre
   * @returns Achat créé
   */
  async purchaseOffer(
    userId: string,
    offerId: string
  ): Promise<MarketplacePurchase> {
    const offer = await this.prisma.marketplaceOffer.findUnique({
      where: { id: offerId },
    });
    
    if (!offer || offer.status !== 'ACTIVE') {
      throw new Error('Offer not available');
    }
    
    // Vérifier stock
    if (offer.quantity <= 0) {
      throw new Error('Out of stock');
    }
    
    const creditCost = Math.round(offer.price);
    
    // Vérifier balance
    const balance = await this.creditsService.getBalance(userId);
    if (balance.total < creditCost) {
      throw new InsufficientCreditsError(
        `Insufficient credits. Available: ${balance.total}, Required: ${creditCost}`
      );
    }
    
    const result = await this.prisma.$transaction(async (tx) => {
      // Dépenser crédits
      await this.creditsService.spendCredits(
        userId,
        creditCost,
        `Marketplace: ${offer.title}`,
        { offerId }
      );
      
      // Créer achat
      const purchase = await tx.marketplacePurchase.create({
        data: {
          buyerId: userId,
          offerId,
          quantity: 1,
          totalPrice: creditCost,
          status: 'PENDING',
        },
      });
      
      // Décrémenter stock
      await tx.marketplaceOffer.update({
        where: { id: offerId },
        data: { quantity: { decrement: 1 } },
      });
      
      // Compléter l'achat
      const updatedPurchase = await tx.marketplacePurchase.update({
        where: { id: purchase.id },
        data: { status: 'COMPLETED' },
      });
      
      return updatedPurchase;
    });
    
    // Note: Notification sera gérée par le système de notifications externe
    
    return {
      id: result.id,
      userId: result.buyerId,
      offerId: result.offerId,
      creditCost: result.totalPrice,
      status: result.status.toLowerCase() as 'pending' | 'completed' | 'failed' | 'cancelled',
      createdAt: result.createdAt,
    };
  }

  /**
   * Obtenir l'historique des achats d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre max de résultats
   * @returns Liste des achats
   */
  async getPurchaseHistory(
    userId: string,
    limit: number = 50
  ): Promise<MarketplacePurchase[]> {
    const purchases = await this.prisma.marketplacePurchase.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return purchases.map(p => ({
      id: p.id,
      userId: p.buyerId,
      offerId: p.offerId,
      creditCost: p.totalPrice,
      status: p.status.toLowerCase() as 'pending' | 'completed' | 'failed' | 'cancelled',
      createdAt: p.createdAt,
    }));
  }
}
