/**
 * Billing Service
 * Handles invoice generation, PDF creation, and billing history
 */

import { InvoiceModel, type Invoice, type CreateInvoiceDTO } from '../models/Invoice.js';
import type { Subscription } from '../models/Subscription.js';
import { getTerritoryPrice } from './PlanService.js';

export class BillingService {
  /**
   * Generate invoice for subscription
   */
  static async generateInvoice(
    subscription: Subscription,
    territory: string
  ): Promise<Invoice> {
    const subtotal = getTerritoryPrice(
      subscription.plan,
      subscription.billingCycle,
      territory
    );

    if (subtotal === null || subtotal === undefined || subtotal <= 0) {
      throw new Error('Cannot generate invoice for quote-based plans or invalid pricing');
    }

    const invoiceData: CreateInvoiceDTO = {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      billingCycle: subscription.billingCycle,
      territory,
      subtotal,
    };

    return InvoiceModel.create(invoiceData);
  }

  /**
   * Get billing history for user
   */
  static async getBillingHistory(userId: string): Promise<Invoice[]> {
    return InvoiceModel.findByUserId(userId);
  }

  /**
   * Generate PDF invoice (simplified - in production use proper PDF library)
   */
  static async generatePDF(invoiceId: string): Promise<string> {
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // In production, use a library like PDFKit or Puppeteer
    // This is a simplified text representation
    const pdf = this.generateInvoiceText(invoice);
    
    // Return as base64 (in production, return actual PDF buffer)
    return Buffer.from(pdf).toString('base64');
  }

  /**
   * Generate invoice text content
   */
  private static generateInvoiceText(invoice: Invoice): string {
    return `
═══════════════════════════════════════════════════════════
                    A KI PRI SA YÉ
         Service Numérique d'Intérêt Public Payant
═══════════════════════════════════════════════════════════

FACTURE N° ${invoice.invoiceNumber}

Date d'émission : ${invoice.issueDate.toLocaleDateString('fr-FR')}
Date d'échéance : ${invoice.dueDate.toLocaleDateString('fr-FR')}
Statut : ${this.getStatusLabel(invoice.status)}

───────────────────────────────────────────────────────────
DÉTAILS DE L'ABONNEMENT
───────────────────────────────────────────────────────────

Plan : ${invoice.plan}
Cycle de facturation : ${invoice.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
Territoire : ${invoice.territory}

───────────────────────────────────────────────────────────
MONTANT
───────────────────────────────────────────────────────────

Sous-total HT :                          ${invoice.subtotal.toFixed(2)} €
TVA (${(invoice.vatRate * 100).toFixed(1)}%) :                                ${invoice.vatAmount.toFixed(2)} €
                                        ─────────────────
TOTAL TTC :                              ${invoice.total.toFixed(2)} €

───────────────────────────────────────────────────────────
${invoice.paidDate ? `Payé le ${invoice.paidDate.toLocaleDateString('fr-FR')} via ${this.getPaymentMethodLabel(invoice.paymentMethod)}` : 'En attente de paiement'}

───────────────────────────────────────────────────────────
MENTIONS LÉGALES
───────────────────────────────────────────────────────────

✅ Données réelles, traçables, auditées
✅ Facturation claire, contractuelle et automatisée
✅ IA responsable (pas de promesses irréalistes)

Service conforme aux principes d'intérêt public.
Aucune donnée falsifiée ou simulée.

═══════════════════════════════════════════════════════════
    `;
  }

  private static getStatusLabel(status: Invoice['status']): string {
    const labels: Record<Invoice['status'], string> = {
      draft: 'Brouillon',
      pending: 'En attente',
      paid: 'Payée',
      failed: 'Échec',
      refunded: 'Remboursée',
    };
    return labels[status];
  }

  private static getPaymentMethodLabel(method?: Invoice['paymentMethod']): string {
    if (!method) return 'Non spécifié';
    
    const labels: Record<Invoice['paymentMethod'], string> = {
      card: 'Carte bancaire',
      bank_transfer: 'Virement bancaire',
      institutional_deferred: 'Paiement institutionnel différé',
    };
    return labels[method];
  }

  /**
   * Calculate next billing date
   */
  static calculateNextBillingDate(
    currentDate: Date,
    billingCycle: 'monthly' | 'yearly'
  ): Date {
    const nextDate = new Date(currentDate);
    
    if (billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    return nextDate;
  }

  /**
   * Process recurring billing for subscription
   */
  static async processRecurringBilling(
    subscription: Subscription,
    territory: string
  ): Promise<Invoice> {
    // Generate new invoice
    const invoice = await this.generateInvoice(subscription, territory);
    
    // In production, trigger payment provider to charge the customer
    // For now, just return the invoice
    return invoice;
  }

  /**
   * Get invoice summary for user
   */
  static async getInvoiceSummary(userId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    failed: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    const invoices = await InvoiceModel.findByUserId(userId);
    
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    
    const summary = {
      total: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
    
    for (const invoice of invoices) {
      summary.total++;
      totalAmount += invoice.total;
      
      if (invoice.status === 'paid') {
        summary.paid++;
        paidAmount += invoice.total;
      } else if (invoice.status === 'pending') {
        summary.pending++;
        pendingAmount += invoice.total;
      } else if (invoice.status === 'failed') {
        summary.failed++;
      }
    }
    
    return {
      ...summary,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
    };
  }
}

export default BillingService;
