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
    beforeEach(() => {
      // earnCredits calls isFirstContributionToday which uses creditTransaction.findFirst
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditTransaction = {
        findFirst: jest.fn().mockResolvedValue(null), // first contribution of the day
      };
    });

    it('devrait créer une transaction de gain de crédits', async () => {
      const userId = 'test-user-id';
      const contributionType = 'price_contribution';
      const contributionId = 'contrib-123';
      
      const mockTransaction = {
        id: 'tx-123',
        userId,
        type: 'EARN',
        amount: 5,
        description: `Contribution: ${contributionType}`,
        metadata: null,
        createdAt: new Date(),
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
        description: 'Contribution: price_contribution',
        metadata: JSON.stringify({ verified: true }),
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
      // Schema-aligned: creditBalance has `balance` field (not `total`)
      const mockDbBalance = {
        id: 'balance-123',
        userId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockDbBalance),
      };
      
      const balance = await creditsService.getBalance(userId);
      
      expect(balance).toBeDefined();
      expect(balance.userId).toBe(userId);
      expect(balance.total).toBe(100);
    });

    it('devrait créer une nouvelle balance si elle n\'existe pas', async () => {
      const userId = 'new-user-id';
      const newDbBalance = {
        id: 'balance-new',
        userId,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(newDbBalance),
      };
      
      const balance = await creditsService.getBalance(userId);
      
      expect(balance).toBeDefined();
      expect(balance.total).toBe(0);
    });

    it('balance est nulle/undefined → retourne 0', async () => {
      const userId = 'ghost-user';
      const newDbBalance = {
        id: 'balance-ghost',
        userId,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(newDbBalance),
      };

      const balance = await creditsService.getBalance(userId);
      expect(balance.total).toBe(0);
      expect(balance.pending).toBe(0);
    });
  });

  describe('spendCredits', () => {
    it('devrait dépenser des crédits si la balance est suffisante', async () => {
      const userId = 'test-user-id';
      const mockDbBalance = {
        id: 'balance-123',
        userId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransaction = {
        id: 'tx-spend',
        userId,
        type: 'SPEND',
        amount: -50,
        description: 'Test purchase',
        metadata: null,
        createdAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockDbBalance),
      };
      
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
      const mockDbBalance = {
        id: 'balance-123',
        userId,
        balance: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockDbBalance),
      };
      
      await expect(
        creditsService.spendCredits(userId, 50, 'Test purchase')
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('amount ≤ 0 → lance une erreur', async () => {
      await expect(
        creditsService.spendCredits('user-id', 0, 'Test')
      ).rejects.toThrow('Amount must be positive');
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
          description: 'Test earn',
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          userId,
          type: 'SPEND',
          amount: -5,
          description: 'Test spend',
          metadata: null,
          createdAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditTransaction = {
        findMany: jest.fn().mockResolvedValue(mockTransactions),
      };
      
      const history = await creditsService.getTransactionHistory(userId);
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('earn');
      expect(history[1].type).toBe('spend');
    });
  });

  describe('redeemCredits', () => {
    it('lance InsufficientCreditsError si balance insuffisante', async () => {
      const userId = 'user-low';
      const mockDbBalance = {
        id: 'balance-low',
        userId,
        balance: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockDbBalance),
      };

      await expect(
        creditsService.redeemCredits(userId, 200, 'bank_transfer', { iban: 'FR76...' })
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('lance une erreur si en dessous du minimum de rachat', async () => {
      const userId = 'user-min';
      const mockDbBalance = {
        id: 'balance-min',
        userId,
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrisma as any).creditBalance = {
        findUnique: jest.fn().mockResolvedValue(mockDbBalance),
      };

      // MIN_REDEMPTION_CREDITS = 100, request only 50
      await expect(
        creditsService.redeemCredits(userId, 50, 'paypal', { email: 'user@example.com' })
      ).rejects.toThrow('Minimum redemption');
    });
  });
});
