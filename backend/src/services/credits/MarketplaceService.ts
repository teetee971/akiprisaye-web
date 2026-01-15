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

import { PrismaClient } from '@prisma/client';
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
    type?: 'PREMIUM_SUBSCRIPTION' | 'DONATION' | 'PARTNER_PRODUCT' | 'CASH' | 'OTHER';
    available?: boolean;
  }): Promise<MarketplaceOffer[]> {
    const now = new Date();
    
    const offers = await this.prisma.marketplaceOffer.findMany({
      where: {
        type: filters?.type,
        available: filters?.available !== false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { creditCost: 'asc' },
    });
    
    // Filtrer ceux avec stock > 0
    return offers
      .filter(offer => offer.stock === null || offer.stock > 0)
      .map(offer => ({
        id: offer.id,
        type: offer.type.toLowerCase() as 'premium_subscription' | 'donation' | 'partner_product' | 'cash' | 'other',
        name: offer.name,
        description: offer.description,
        imageUrl: offer.imageUrl || undefined,
        creditCost: offer.creditCost,
        monetaryValue: offer.monetaryValue,
        available: offer.available,
        stock: offer.stock || undefined,
        partnerId: offer.partnerId || undefined,
        donationTarget: offer.donationTarget || undefined,
        createdAt: offer.createdAt,
        expiresAt: offer.expiresAt || undefined,
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
    
    if (!offer || !offer.available) {
      throw new Error('Offer not available');
    }
    
    // Vérifier expiration
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      throw new Error('Offer expired');
    }
    
    // Vérifier stock
    if (offer.stock !== null && offer.stock <= 0) {
      throw new Error('Out of stock');
    }
    
    // Vérifier balance
    const balance = await this.creditsService.getBalance(userId);
    if (balance.total < offer.creditCost) {
      throw new InsufficientCreditsError(
        `Insufficient credits. Available: ${balance.total}, Required: ${offer.creditCost}`
      );
    }
    
    const result = await this.prisma.$transaction(async (tx) => {
      // Dépenser crédits
      await this.creditsService.spendCredits(
        userId,
        offer.creditCost,
        `Marketplace: ${offer.name}`,
        { offerId }
      );
      
      // Créer achat
      const purchase = await tx.marketplacePurchase.create({
        data: {
          userId,
          offerId,
          creditCost: offer.creditCost,
          status: 'PENDING',
        },
      });
      
      // Décrémenter stock
      if (offer.stock !== null) {
        await tx.marketplaceOffer.update({
          where: { id: offerId },
          data: { stock: { decrement: 1 } },
        });
      }
      
      // Traiter l'achat selon type
      const fulfillmentData = await this.fulfillPurchase(purchase, offer, tx);
      
      // Mettre à jour avec fulfillment data
      const updatedPurchase = await tx.marketplacePurchase.update({
        where: { id: purchase.id },
        data: {
          fulfillmentData: fulfillmentData ? JSON.stringify(fulfillmentData) : null,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      
      return updatedPurchase;
    });
    
    // Note: Notification sera gérée par le système de notifications externe
    // await notificationService.send(userId, { type: 'marketplace_purchase', ... });
    
    return {
      id: result.id,
      userId: result.userId,
      offerId: result.offerId,
      creditCost: result.creditCost,
      status: result.status.toLowerCase() as 'pending' | 'completed' | 'failed' | 'cancelled',
      fulfillmentData: result.fulfillmentData ? JSON.parse(result.fulfillmentData) : undefined,
      createdAt: result.createdAt,
      completedAt: result.completedAt || undefined,
    };
  }

  /**
   * Traiter un achat selon son type
   * (Méthode privée)
   * 
   * @param purchase - Achat à traiter
   * @param offer - Offre achetée
   * @param tx - Transaction Prisma
   * @returns Données de fulfillment
   */
  private async fulfillPurchase(
    purchase: { id: string; userId: string; offerId: string; creditCost: number },
    offer: {
      id: string;
      type: string;
      name: string;
      partnerId: string | null;
      donationTarget: string | null;
      monetaryValue: number;
    },
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
  ): Promise<Record<string, unknown> | null> {
    switch (offer.type) {
      case 'PREMIUM_SUBSCRIPTION':
        // Note: L'activation d'abonnement sera gérée par SubscriptionService
        // Pour l'instant, on retourne juste les détails
        return {
          type: 'premium_subscription',
          message: 'Premium subscription will be activated',
          duration: '1 month',
        };
        
      case 'DONATION':
        // Créer enregistrement de don
        await tx.donation.create({
          data: {
            userId: purchase.userId,
            target: offer.donationTarget || 'Unknown',
            amount: offer.monetaryValue,
            method: 'credits',
            status: 'completed',
          },
        });
        
        return {
          type: 'donation',
          target: offer.donationTarget,
          amount: offer.monetaryValue / 100, // Convertir en euros
          message: `Don de ${offer.monetaryValue / 100}€ effectué à ${offer.donationTarget}`,
        };
        
      case 'PARTNER_PRODUCT':
        // Générer code promo partenaire
        // Note: Intégration avec partenaires sera faite séparément
        const voucherCode = this.generateVoucherCode(offer.partnerId || 'PARTNER');
        
        return {
          type: 'partner_product',
          partnerId: offer.partnerId,
          voucherCode,
          value: offer.monetaryValue / 100,
          message: `Code promo: ${voucherCode}`,
        };
        
      case 'CASH':
        // Créer demande de retrait
        await this.creditsService.redeemCredits(
          purchase.userId,
          purchase.creditCost,
          'bank_transfer',
          { purchaseId: purchase.id }
        );
        
        return {
          type: 'cash',
          amount: offer.monetaryValue / 100,
          message: `Demande de retrait de ${offer.monetaryValue / 100}€ créée`,
        };
        
      default:
        return null;
    }
  }

  /**
   * Générer un code promo unique
   * (Méthode privée)
   * 
   * @param partnerId - ID du partenaire
   * @returns Code promo
   */
  private generateVoucherCode(partnerId: string): string {
    const prefix = partnerId.toUpperCase().substring(0, 4);
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${random}`;
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
      where: { userId },
      include: {
        offer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return purchases.map(p => ({
      id: p.id,
      userId: p.userId,
      offerId: p.offerId,
      creditCost: p.creditCost,
      status: p.status.toLowerCase() as 'pending' | 'completed' | 'failed' | 'cancelled',
      fulfillmentData: p.fulfillmentData ? JSON.parse(p.fulfillmentData) : undefined,
      createdAt: p.createdAt,
      completedAt: p.completedAt || undefined,
    }));
  }
}
