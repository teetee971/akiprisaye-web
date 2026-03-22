/**
 * Non-regression tests for MarketplaceService
 * Validates offer retrieval, purchase flow, and buyer/offerId field mapping.
 */

import { MarketplaceService } from '../MarketplaceService.js';
import { CreditsService } from '../CreditsService.js';
import { PrismaClient, EntityStatus } from '@prisma/client';

jest.mock('@prisma/client');
jest.mock('../CreditsService.js');

describe('MarketplaceService', () => {
  let marketplaceService: MarketplaceService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockCreditsService: jest.Mocked<CreditsService>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockCreditsService = new CreditsService(mockPrisma) as jest.Mocked<CreditsService>;
    marketplaceService = new MarketplaceService(mockPrisma, mockCreditsService);
  });

  describe('getOffers', () => {
    it('returns only ACTIVE offers with stock > 0', async () => {
      const mockOffers = [
        {
          id: 'offer-1',
          type: 'premium_subscription',
          title: 'Premium 1 mois',
          description: 'Accès premium pendant 1 mois',
          price: 100,
          quantity: 5,
          status: EntityStatus.ACTIVE,
          sellerId: 'seller-1',
          productId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'offer-2',
          type: 'donation',
          title: 'Don association',
          description: null,
          price: 50,
          quantity: 0, // out of stock — must be excluded
          status: EntityStatus.ACTIVE,
          sellerId: 'seller-1',
          productId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplaceOffer = {
        findMany: jest.fn().mockResolvedValue(mockOffers),
      };

      const offers = await marketplaceService.getOffers();

      expect(offers).toHaveLength(1);
      expect(offers[0].id).toBe('offer-1');
      expect(offers[0].stock).toBeGreaterThan(0);
    });

    it('maps offer fields to MarketplaceOffer interface correctly', async () => {
      const mockOffer = {
        id: 'offer-abc',
        type: 'cash',
        title: 'Retrait cash',
        description: 'Retrait en espèces',
        price: 200,
        quantity: 10,
        status: EntityStatus.ACTIVE,
        sellerId: 'seller-2',
        productId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplaceOffer = {
        findMany: jest.fn().mockResolvedValue([mockOffer]),
      };

      const [offer] = await marketplaceService.getOffers();

      expect(offer.id).toBe('offer-abc');
      expect(offer.name).toBe('Retrait cash');
      expect(offer.creditCost).toBe(200);
      expect(offer.available).toBe(true);
    });
  });

  describe('purchaseOffer', () => {
    it('throws when offer is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplaceOffer = {
        findUnique: jest.fn().mockResolvedValue(null),
      };

      await expect(
        marketplaceService.purchaseOffer('user-1', 'non-existent-offer')
      ).rejects.toThrow('Offer not available');
    });

    it('throws when offer is out of stock', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplaceOffer = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'offer-1',
          title: 'Premium',
          price: 100,
          quantity: 0,
          status: 'ACTIVE',
          type: 'premium_subscription',
        }),
      };

      await expect(
        marketplaceService.purchaseOffer('user-1', 'offer-1')
      ).rejects.toThrow('Out of stock');
    });

    it('maps buyerId to userId in the returned purchase', async () => {
      const userId = 'buyer-user-id';
      const offerId = 'offer-123';

      const mockOffer = {
        id: offerId,
        title: 'Premium',
        price: 100,
        quantity: 3,
        status: 'ACTIVE',
        type: 'premium_subscription',
      };

      const mockPurchase = {
        id: 'purchase-abc',
        buyerId: userId,
        offerId,
        quantity: 1,
        totalPrice: 100,
        status: 'COMPLETED',
        createdAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplaceOffer = {
        findUnique: jest.fn().mockResolvedValue(mockOffer),
        update: jest.fn().mockResolvedValue(mockOffer),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplacePurchase = {
        create: jest.fn().mockResolvedValue(mockPurchase),
        update: jest.fn().mockResolvedValue(mockPurchase),
      };

      mockPrisma.$transaction = jest.fn().mockImplementation(async (fn) => fn(mockPrisma));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(mockCreditsService as any, 'getBalance').mockResolvedValue({
        userId,
        total: 500,
        pending: 0,
        lifetime: 500,
        redeemed: 0,
        updatedAt: new Date(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(mockCreditsService as any, 'spendCredits').mockResolvedValue({
        id: 'tx-1',
        userId,
        type: 'spend' as const,
        amount: -100,
        source: { type: 'marketplace' as const, verified: false },
        description: 'Marketplace: Premium',
        balance: 0,
        createdAt: new Date(),
      });

      const purchase = await marketplaceService.purchaseOffer(userId, offerId);

      // buyerId in DB must be surfaced as userId in the DTO
      expect(purchase.userId).toBe(userId);
      expect(purchase.offerId).toBe(offerId);
      expect(purchase.status).toBe('completed');
    });
  });

  describe('getPurchaseHistory', () => {
    it('returns purchases mapped with userId from buyerId', async () => {
      const userId = 'user-xyz';
      const mockPurchases = [
        {
          id: 'p-1',
          buyerId: userId,
          offerId: 'offer-1',
          quantity: 1,
          totalPrice: 100,
          status: 'COMPLETED',
          createdAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).marketplacePurchase = {
        findMany: jest.fn().mockResolvedValue(mockPurchases),
      };

      const history = await marketplaceService.getPurchaseHistory(userId);

      expect(history).toHaveLength(1);
      expect(history[0].userId).toBe(userId);
      expect(history[0].creditCost).toBe(100);
    });
  });
});
