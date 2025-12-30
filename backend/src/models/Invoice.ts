/**
 * Invoice Model
 * Manages billing invoices with VAT calculation per territory
 */

import type { Plan, BillingCycle } from './Subscription.js';

export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  invoiceNumber: string; // Format: INV-YYYY-NNNNNN
  plan: Plan;
  billingCycle: BillingCycle;
  territory: string;
  
  // Pricing
  subtotal: number; // Amount before VAT
  vatRate: number; // VAT percentage (varies by territory)
  vatAmount: number; // Calculated VAT
  total: number; // Final amount
  
  // Status
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Dates
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  
  // Payment
  paymentMethod?: 'card' | 'bank_transfer' | 'institutional_deferred';
  paymentProviderId?: string;
  paymentProviderInvoiceId?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceDTO {
  subscriptionId: string;
  userId: string;
  plan: Plan;
  billingCycle: BillingCycle;
  territory: string;
  subtotal: number;
}

// In-memory store for demo (replace with actual database)
const invoices: Map<string, Invoice> = new Map();
let invoiceCounter = 1;

export class InvoiceModel {
  /**
   * Create a new invoice
   */
  static async create(data: CreateInvoiceDTO): Promise<Invoice> {
    const id = `inv_${Date.now()}`;
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30); // Payment due in 30 days
    
    // Generate invoice number
    const year = now.getFullYear();
    const number = String(invoiceCounter++).padStart(6, '0');
    const invoiceNumber = `INV-${year}-${number}`;
    
    // Calculate VAT
    const vatRate = this.getVATRate(data.territory);
    const vatAmount = Math.round(data.subtotal * vatRate) / 100;
    const total = data.subtotal + vatAmount;
    
    const invoice: Invoice = {
      id,
      ...data,
      invoiceNumber,
      vatRate,
      vatAmount,
      total,
      status: 'pending',
      issueDate: now,
      dueDate,
      createdAt: now,
      updatedAt: now,
    };
    
    invoices.set(id, invoice);
    return invoice;
  }

  /**
   * Get VAT rate by territory
   * DOM-ROM territories have specific VAT rates
   */
  static getVATRate(territory: string): number {
    const vatRates: Record<string, number> = {
      // DOM-ROM-COM VAT rates (simplified)
      'GP': 0.085,  // Guadeloupe: 8.5%
      'MQ': 0.085,  // Martinique: 8.5%
      'GF': 0.0,    // Guyane: 0%
      'RE': 0.085,  // Réunion: 8.5%
      'YT': 0.0,    // Mayotte: 0%
      'PM': 0.0,    // Saint-Pierre-et-Miquelon: 0%
      'BL': 0.0,    // Saint-Barthélemy: 0%
      'MF': 0.0,    // Saint-Martin: 0%
      'WF': 0.0,    // Wallis-et-Futuna: 0%
      'PF': 0.16,   // Polynésie française: 16%
      'NC': 0.11,   // Nouvelle-Calédonie: 11%
      'TF': 0.0,    // Terres australes: 0%
      'FR': 0.20,   // France métropolitaine: 20%
    };
    
    return vatRates[territory] || 0.20; // Default to 20%
  }

  /**
   * Find invoice by ID
   */
  static async findById(id: string): Promise<Invoice | null> {
    return invoices.get(id) || null;
  }

  /**
   * Find invoices by user ID
   */
  static async findByUserId(userId: string): Promise<Invoice[]> {
    const userInvoices: Invoice[] = [];
    for (const invoice of invoices.values()) {
      if (invoice.userId === userId) {
        userInvoices.push(invoice);
      }
    }
    // Sort by issue date (newest first)
    return userInvoices.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }

  /**
   * Find invoices by subscription ID
   */
  static async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    const subInvoices: Invoice[] = [];
    for (const invoice of invoices.values()) {
      if (invoice.subscriptionId === subscriptionId) {
        subInvoices.push(invoice);
      }
    }
    return subInvoices.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }

  /**
   * Update invoice
   */
  static async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    const invoice = invoices.get(id);
    if (!invoice) return null;

    const updated: Invoice = {
      ...invoice,
      ...data,
      updatedAt: new Date(),
    };
    
    invoices.set(id, updated);
    return updated;
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(
    id: string, 
    paymentMethod: 'card' | 'bank_transfer' | 'institutional_deferred',
    paymentProviderId?: string
  ): Promise<Invoice | null> {
    return this.update(id, {
      status: 'paid',
      paidDate: new Date(),
      paymentMethod,
      paymentProviderId,
    });
  }

  /**
   * Mark invoice as failed
   */
  static async markAsFailed(id: string): Promise<Invoice | null> {
    return this.update(id, { status: 'failed' });
  }

  /**
   * Refund invoice
   */
  static async refund(id: string): Promise<Invoice | null> {
    return this.update(id, { status: 'refunded' });
  }

  /**
   * Get pending invoices (for reminder notifications)
   */
  static async getPendingInvoices(): Promise<Invoice[]> {
    const pending: Invoice[] = [];
    const now = new Date();
    
    for (const invoice of invoices.values()) {
      if (invoice.status === 'pending' && invoice.dueDate < now) {
        pending.push(invoice);
      }
    }
    
    return pending;
  }
}

export default InvoiceModel;
