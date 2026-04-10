/**
 * Unit tests for SumUpWebhookHandler
 */

import crypto from 'crypto';

const mockUpdateMany = jest.fn().mockResolvedValue({ count: 1 });

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    subscription: { updateMany: mockUpdateMany },
  })),
}));

import { SumUpWebhookHandler } from './sumupWebhookHandler';

describe('SumUpWebhookHandler', () => {
  let handler: SumUpWebhookHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new SumUpWebhookHandler();
  });

  describe('verifySignature', () => {
    afterEach(() => {
      delete process.env.SUMUP_WEBHOOK_SECRET;
    });

    it('should return true when SUMUP_WEBHOOK_SECRET is not configured', () => {
      delete process.env.SUMUP_WEBHOOK_SECRET;
      const result = handler.verifySignature(Buffer.from('payload'), 'anysig');
      expect(result).toBe(true);
    });

    it('should verify a correct HMAC-SHA256 signature', () => {
      process.env.SUMUP_WEBHOOK_SECRET = 'test-secret';
      const payload = Buffer.from('{"event":"test"}');
      const expectedSig = crypto
        .createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      expect(handler.verifySignature(payload, expectedSig)).toBe(true);
    });

    it('should reject an incorrect signature', () => {
      process.env.SUMUP_WEBHOOK_SECRET = 'test-secret';
      const wrongSig = '0'.repeat(64);
      expect(handler.verifySignature(Buffer.from('payload'), wrongSig)).toBe(false);
    });

    it('should reject a malformed (non-hex) signature without throwing', () => {
      process.env.SUMUP_WEBHOOK_SECRET = 'test-secret';
      expect(handler.verifySignature(Buffer.from('payload'), 'not-hex!!!')).toBe(false);
    });

    it('should reject a signature of odd length without throwing', () => {
      process.env.SUMUP_WEBHOOK_SECRET = 'test-secret';
      expect(handler.verifySignature(Buffer.from('payload'), 'abc')).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    it('should update subscription to ACTIVE on payment.succeeded', async () => {
      await handler.handleWebhook({
        id: 'evt_001',
        event_type: 'payment.succeeded',
        timestamp: new Date().toISOString(),
        payload: {
          checkout_reference: 'akiprisaye-user001-citizen_premium-123',
          amount: 4.99,
          currency: 'EUR',
        },
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sumupPaymentId: 'akiprisaye-user001-citizen_premium-123' },
          data: { status: 'ACTIVE' },
        })
      );
    });

    it('should update subscription to INACTIVE on payment.failed', async () => {
      await handler.handleWebhook({
        id: 'evt_002',
        event_type: 'payment.failed',
        timestamp: new Date().toISOString(),
        payload: {
          checkout_reference: 'akiprisaye-user001-citizen_premium-123',
          failure_reason: 'INSUFFICIENT_FUNDS',
        },
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sumupPaymentId: 'akiprisaye-user001-citizen_premium-123' },
          data: { status: 'INACTIVE' },
        })
      );
    });

    it('should update subscription status on subscription.renewed', async () => {
      const nextDate = '2027-05-07T00:00:00.000Z';
      await handler.handleWebhook({
        id: 'evt_003',
        event_type: 'subscription.renewed',
        timestamp: new Date().toISOString(),
        payload: {
          subscription_id: 'sub_abc',
          next_renewal_date: nextDate,
        },
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sumupSubscriptionId: 'sub_abc' },
          data: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });

    it('should cancel subscription on subscription.canceled', async () => {
      await handler.handleWebhook({
        id: 'evt_004',
        event_type: 'subscription.canceled',
        timestamp: new Date().toISOString(),
        payload: { subscription_id: 'sub_xyz' },
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sumupSubscriptionId: 'sub_xyz' },
          data: { status: 'CANCELED' },
        })
      );
    });

    it('should handle unknown event type without throwing', async () => {
      await expect(
        handler.handleWebhook({
          id: 'evt_005',
          event_type: 'unknown.event' as never,
          timestamp: new Date().toISOString(),
          payload: {},
        })
      ).resolves.not.toThrow();

      expect(mockUpdateMany).not.toHaveBeenCalled();
    });
  });
});
