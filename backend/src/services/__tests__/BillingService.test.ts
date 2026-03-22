/**
 * Non-regression tests for BillingService
 * Validates invoice creation, nullable payment method, and billing cycle behaviour.
 */

import { BillingService } from '../BillingService.js';

// The BillingService relies on InvoiceModel (in-memory store) and PlanService.
// We keep the real implementations so the tests exercise the full call chain
// without a database dependency.

describe('BillingService', () => {
  const baseSubscription = {
    id: 'sub-001',
    userId: 'user-test-001',
    plan: 'CITIZEN' as const,
    status: 'active' as const,
    billingCycle: 'monthly' as const,
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('generateInvoice', () => {
    it('creates an invoice with a positive total for a valid plan/cycle', async () => {
      const invoice = await BillingService.generateInvoice(baseSubscription, 'GUADELOUPE');

      expect(invoice.id).toBeDefined();
      expect(invoice.userId).toBe(baseSubscription.userId);
      expect(invoice.plan).toBe('CITIZEN');
      expect(invoice.billingCycle).toBe('monthly');
      expect(invoice.subtotal).toBeGreaterThan(0);
      expect(invoice.total).toBeGreaterThanOrEqual(invoice.subtotal);
    });

    it('includes VAT fields on the invoice', async () => {
      const invoice = await BillingService.generateInvoice(baseSubscription, 'MARTINIQUE');

      expect(typeof invoice.vatRate).toBe('number');
      expect(invoice.vatAmount).toBeGreaterThanOrEqual(0);
      expect(invoice.total).toBe(
        parseFloat((invoice.subtotal + invoice.vatAmount).toFixed(2))
      );
    });

    it('throws for quote-based plans (null price)', async () => {
      const quoteSub = {
        ...baseSubscription,
        plan: 'ENTERPRISE' as const,
        billingCycle: 'monthly' as const, // ENTERPRISE monthly is null
      };

      await expect(
        BillingService.generateInvoice(quoteSub, 'FRANCE_HEXAGONALE')
      ).rejects.toThrow();
    });

    it('invoice number follows INV-YYYY- format', async () => {
      const invoice = await BillingService.generateInvoice(baseSubscription, 'LA_REUNION');
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-/);
    });

    it('paymentMethod is undefined on a fresh invoice (nullable)', async () => {
      const invoice = await BillingService.generateInvoice(baseSubscription, 'MAYOTTE');
      expect(invoice.paymentMethod).toBeUndefined();
    });
  });

  describe('getBillingHistory', () => {
    it('returns an array (may be empty for unknown user)', async () => {
      const history = await BillingService.getBillingHistory('no-such-user');
      expect(Array.isArray(history)).toBe(true);
    });

    it('returns invoices for a user who has one', async () => {
      // Generate an invoice first so there is data in the in-memory store
      const invoice = await BillingService.generateInvoice(
        { ...baseSubscription, userId: 'user-history-test' },
        'GUADELOUPE'
      );

      const history = await BillingService.getBillingHistory('user-history-test');
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history.find((i) => i.id === invoice.id)).toBeDefined();
    });
  });

  describe('billing cycle', () => {
    it('yearly billing produces a lower monthly cost than monthly billing', async () => {
      const monthlyInvoice = await BillingService.generateInvoice(
        { ...baseSubscription, billingCycle: 'monthly' },
        'GUADELOUPE'
      );
      const yearlyInvoice = await BillingService.generateInvoice(
        { ...baseSubscription, billingCycle: 'yearly' },
        'GUADELOUPE'
      );

      // Yearly subtotal is paid at once but should be less than 12× monthly
      expect(yearlyInvoice.subtotal).toBeLessThan(monthlyInvoice.subtotal * 12);
    });
  });
});
