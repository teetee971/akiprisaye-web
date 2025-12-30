/**
 * Payment Provider Service
 * Handles payment processing with multiple payment methods
 * Supports: Card, Bank Transfer, Institutional Deferred Payment
 */

import type { Plan, BillingCycle } from '../models/Subscription.js';

export interface PaymentIntent {
  id: string;
  userId: string;
  plan: Plan;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod?: 'card' | 'bank_transfer' | 'institutional_deferred';
  
  // Security
  clientSecret?: string; // For client-side payment confirmation
  
  // Metadata
  territory: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreatePaymentIntentDTO {
  userId: string;
  plan: Plan;
  billingCycle: BillingCycle;
  territory: string;
  amount?: number; // Optional, calculated if not provided
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'bank_transfer' | 'institutional_deferred';
  isDefault: boolean;
  
  // Card details (minimal, tokenized)
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // Bank transfer details
  bankName?: string;
  bankAccountLast4?: string;
  
  // Institutional details
  institutionName?: string;
  institutionSIRET?: string;
  
  createdAt: Date;
}

// In-memory stores (replace with database in production)
const paymentIntents: Map<string, PaymentIntent> = new Map();
const paymentMethods: Map<string, PaymentMethod> = new Map();

export class PaymentProvider {
  /**
   * Create a payment intent
   * This initiates the payment process
   */
  static async createPaymentIntent(data: CreatePaymentIntentDTO): Promise<PaymentIntent> {
    const id = `pi_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + 24); // Intent expires in 24 hours
    
    // In production, calculate amount from pricing service
    const amount = data.amount || 0;
    
    const paymentIntent: PaymentIntent = {
      id,
      userId: data.userId,
      plan: data.plan,
      billingCycle: data.billingCycle,
      amount,
      currency: 'EUR',
      status: 'pending',
      territory: data.territory,
      clientSecret: `${id}_secret_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      expiresAt,
    };
    
    paymentIntents.set(id, paymentIntent);
    return paymentIntent;
  }

  /**
   * Confirm payment with card
   * In production, integrate with Stripe, PayPal, or local payment provider
   */
  static async confirmCardPayment(
    paymentIntentId: string,
    cardToken: string
  ): Promise<PaymentIntent> {
    const intent = paymentIntents.get(paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    
    if (intent.status !== 'pending' && intent.status !== 'processing') {
      throw new Error('Payment intent already processed or in invalid state');
    }
    
    // In production: Process with payment provider (Stripe, etc.)
    // For now, simulate success
    intent.status = 'processing';
    
    // Simulate async processing
    setTimeout(() => {
      intent.status = 'succeeded';
      intent.paymentMethod = 'card';
      paymentIntents.set(paymentIntentId, intent);
    }, 2000);
    
    return intent;
  }

  /**
   * Initiate bank transfer payment
   * Provides banking details for manual transfer
   */
  static async initiateBankTransfer(
    paymentIntentId: string
  ): Promise<{
    intent: PaymentIntent;
    bankDetails: {
      iban: string;
      bic: string;
      reference: string;
      recipient: string;
    };
  }> {
    const intent = paymentIntents.get(paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    
    intent.status = 'processing';
    intent.paymentMethod = 'bank_transfer';
    paymentIntents.set(paymentIntentId, intent);
    
    // Return bank details (in production, use real banking info)
    return {
      intent,
      bankDetails: {
        iban: 'FR76 XXXX XXXX XXXX XXXX XXXX XXX',
        bic: 'XXXXXXXX',
        reference: `AKIPRISAYE-${paymentIntentId}`,
        recipient: 'A KI PRI SA YÉ',
      },
    };
  }

  /**
   * Create institutional deferred payment
   * For government and institutional clients with billing terms
   */
  static async createInstitutionalPayment(
    paymentIntentId: string,
    institutionDetails: {
      name: string;
      siret: string;
      contactEmail: string;
      billingAddress: string;
    }
  ): Promise<PaymentIntent> {
    const intent = paymentIntents.get(paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    
    // Verify institutional credentials (in production)
    // For now, accept all
    
    intent.status = 'processing';
    intent.paymentMethod = 'institutional_deferred';
    paymentIntents.set(paymentIntentId, intent);
    
    // Generate invoice for institutional payment (30-60 day terms)
    // In production: Create deferred payment record
    
    return intent;
  }

  /**
   * Cancel subscription (immediate, no retention tricks)
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    // In production: Cancel with payment provider
    // Stripe: stripe.subscriptions.cancel(subscriptionId)
    // PayPal: paypal.billing.subscriptions.cancel(subscriptionId)
    
    console.log(`Subscription ${subscriptionId} canceled immediately`);
  }

  /**
   * Add payment method for user
   */
  static async addPaymentMethod(
    userId: string,
    type: 'card' | 'bank_transfer' | 'institutional_deferred',
    details: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    const id = `pm_${Date.now()}`;
    
    const paymentMethod: PaymentMethod = {
      id,
      userId,
      type,
      isDefault: false,
      ...details,
      createdAt: new Date(),
    };
    
    paymentMethods.set(id, paymentMethod);
    return paymentMethod;
  }

  /**
   * Get payment methods for user
   */
  static async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = [];
    for (const method of paymentMethods.values()) {
      if (method.userId === userId) {
        methods.push(method);
      }
    }
    return methods;
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<void> {
    // Unset all defaults for user
    for (const [id, method] of paymentMethods.entries()) {
      if (method.userId === userId) {
        method.isDefault = false;
        paymentMethods.set(id, method);
      }
    }
    
    // Set new default
    const method = paymentMethods.get(paymentMethodId);
    if (method && method.userId === userId) {
      method.isDefault = true;
      paymentMethods.set(paymentMethodId, method);
    }
  }

  /**
   * Verify payment security
   * Implements basic fraud detection
   */
  static async verifyPaymentSecurity(
    userId: string,
    amount: number,
    territory: string
  ): Promise<{
    verified: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    message?: string;
  }> {
    // Basic fraud detection rules
    // In production: Use proper fraud detection service
    
    // Rule 1: Large amounts require additional verification
    if (amount > 1000) {
      return {
        verified: false,
        riskLevel: 'high',
        message: 'Montant élevé - vérification additionnelle requise',
      };
    }
    
    // Rule 2: Check velocity (multiple payments in short time)
    // In production: Query payment history
    
    return {
      verified: true,
      riskLevel: 'low',
    };
  }

  /**
   * Get payment intent status
   */
  static async getPaymentIntent(id: string): Promise<PaymentIntent | null> {
    return paymentIntents.get(id) || null;
  }

  /**
   * Refund payment
   */
  static async refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<{
    refundId: string;
    amount: number;
    status: 'succeeded' | 'failed';
  }> {
    const intent = paymentIntents.get(paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    
    if (intent.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }
    
    const refundAmount = amount || intent.amount;
    
    // In production: Process refund with payment provider
    return {
      refundId: `re_${Date.now()}`,
      amount: refundAmount,
      status: 'succeeded',
    };
  }
}

export default PaymentProvider;
