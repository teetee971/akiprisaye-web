/**
 * Tests unitaires pour CreditsService
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { CreditsService } from '../CreditsService.js';
import { PrismaClient } from '@prisma/client';
import { InsufficientCreditsError } from '../../../types/credits.js';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('CreditsService', () => {
  let creditsService: CreditsService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    creditsService = new CreditsService(mockPrisma);
  });

  describe('earnCredits', () => {
    it('devrait créer une transaction de gain de crédits', async () => {
      const userId = 'test-user-id';
      const contributionType = 'price_contribution';
      const contributionId = 'contrib-123';
      
      const mockTransaction = {
        id: 'tx-123',
        userId,
        type: 'EARN',
        amount: 5,
        source: JSON.stringify({
          type: 'contribution',
          contributionType,
          contributionId,
          verified: false,
        }),
        description: `Contribution: ${contributionType}`,
        metadata: null,
        balance: 5,
        createdAt: new Date(),
      };
      
      const mockBalance = {
        userId,
        total: 5,
        pending: 0,
        lifetime: 5,
        redeemed: 0,
        updatedAt: new Date(),
      };

      // Mock transaction DB
      mockPrisma.$transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      const result = await creditsService.earnCredits(
        userId,
        contributionType,
        contributionId
      );
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.amount).toBe(5);
      expect(result.type).toBe('earn');
    });

    it('devrait appliquer les multiplicateurs correctement', async () => {
      const userId = 'test-user-id';
      
      const mockTransaction = {
        id: 'tx-123',
        userId,
        type: 'EARN',
        amount: 10, // 5 * 2.0 (verified multiplier)
        source: JSON.stringify({
          type: 'contribution',
          contributionType: 'price_contribution',
          contributionId: 'contrib-123',
          verified: true,
        }),
        description: 'Contribution: price_contribution',
        metadata: JSON.stringify({ verified: true }),
        balance: 10,
        createdAt: new Date(),
      };

      mockPrisma.$transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      const result = await creditsService.earnCredits(
        userId,
        'price_contribution',
        'contrib-123',
        { verified: true }
      );
      
      expect(result.amount).toBe(10);
    });

    it('devrait lancer une erreur pour un type de contribution inconnu', async () => {
      await expect(
        creditsService.earnCredits('user-id', 'unknown_type', 'contrib-123')
      ).rejects.toThrow('Unknown contribution type');
    });
  });

  describe('getBalance', () => {
    it('devrait retourner la balance existante', async () => {
      const userId = 'test-user-id';
      const mockBalance = {
        id: 'balance-123',
        userId,
        total: 100,
        pending: 10,
        lifetime: 200,
        redeemed: 50,
        updatedAt: new Date(),
      };

      mockPrisma.creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockBalance),
      } as any;
      
      const balance = await creditsService.getBalance(userId);
      
      expect(balance).toBeDefined();
      expect(balance.userId).toBe(userId);
      expect(balance.total).toBe(100);
      expect(balance.lifetime).toBe(200);
    });

    it('devrait créer une nouvelle balance si elle n\'existe pas', async () => {
      const userId = 'new-user-id';
      const newBalance = {
        id: 'balance-new',
        userId,
        total: 0,
        pending: 0,
        lifetime: 0,
        redeemed: 0,
        updatedAt: new Date(),
      };

      mockPrisma.creditBalance = {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(newBalance),
      } as any;
      
      const balance = await creditsService.getBalance(userId);
      
      expect(balance).toBeDefined();
      expect(balance.total).toBe(0);
      expect(balance.lifetime).toBe(0);
    });
  });

  describe('spendCredits', () => {
    it('devrait dépenser des crédits si la balance est suffisante', async () => {
      const userId = 'test-user-id';
      const mockBalance = {
        id: 'balance-123',
        userId,
        total: 100,
        pending: 0,
        lifetime: 100,
        redeemed: 0,
        updatedAt: new Date(),
      };

      const mockTransaction = {
        id: 'tx-spend',
        userId,
        type: 'SPEND',
        amount: -50,
        source: JSON.stringify({ type: 'marketplace' }),
        description: 'Test purchase',
        metadata: null,
        balance: 50,
        createdAt: new Date(),
      };

      mockPrisma.creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockBalance),
      } as any;
      
      mockPrisma.$transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      const result = await creditsService.spendCredits(
        userId,
        50,
        'Test purchase'
      );
      
      expect(result).toBeDefined();
      expect(result.amount).toBe(-50);
      expect(result.type).toBe('spend');
    });

    it('devrait lancer InsufficientCreditsError si balance insuffisante', async () => {
      const userId = 'test-user-id';
      const mockBalance = {
        id: 'balance-123',
        userId,
        total: 10,
        pending: 0,
        lifetime: 10,
        redeemed: 0,
        updatedAt: new Date(),
      };

      mockPrisma.creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockBalance),
      } as any;
      
      await expect(
        creditsService.spendCredits(userId, 50, 'Test purchase')
      ).rejects.toThrow(InsufficientCreditsError);
    });
  });

  describe('getTransactionHistory', () => {
    it('devrait retourner l\'historique des transactions', async () => {
      const userId = 'test-user-id';
      const mockTransactions = [
        {
          id: 'tx-1',
          userId,
          type: 'EARN',
          amount: 10,
          source: JSON.stringify({ type: 'contribution' }),
          description: 'Test earn',
          metadata: null,
          balance: 10,
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          userId,
          type: 'SPEND',
          amount: -5,
          source: JSON.stringify({ type: 'marketplace' }),
          description: 'Test spend',
          metadata: null,
          balance: 5,
          createdAt: new Date(),
        },
      ];

      mockPrisma.creditTransaction = {
        findMany: jest.fn().mockResolvedValue(mockTransactions),
      } as any;
      
      const history = await creditsService.getTransactionHistory(userId);
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('earn');
      expect(history[1].type).toBe('spend');
    });
  });
});
