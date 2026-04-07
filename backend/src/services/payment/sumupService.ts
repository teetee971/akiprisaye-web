/**
 * SumUp Payment Service
 * Manages customers, checkouts and subscriptions via SumUp REST API
 * Docs: https://developer.sumup.com
 */

import axios, { AxiosInstance } from 'axios';
import type { SumUpCustomer, SumUpCheckout, SumUpSubscription } from '../../types/subscription.js';

const SUMUP_API_BASE_URL = process.env.SUMUP_API_BASE_URL || 'https://api.sumup.com/v0.1';
const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_ID || '';

function createSumUpClient(): AxiosInstance {
  return axios.create({
    baseURL: SUMUP_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.SUMUP_API_KEY_SECRET || ''}`,
      'Content-Type': 'application/json',
    },
  });
}

export class SumUpService {
  private client: AxiosInstance;

  constructor() {
    this.client = createSumUpClient();
  }

  /**
   * Create or retrieve a SumUp customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    userId: string;
  }): Promise<SumUpCustomer> {
    const nameParts = (params.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data } = await this.client.post<SumUpCustomer>('/customers', {
      personal_details: {
        email: params.email,
        first_name: firstName,
        last_name: lastName,
      },
    });

    return data;
  }

  /**
   * Create a SumUp checkout (payment request)
   */
  async createCheckout(params: {
    amount: number;
    currency: string;
    description: string;
    checkoutReference: string;
    returnUrl?: string;
    customerId?: string;
    affiliateKey?: string;
  }): Promise<SumUpCheckout> {
    const payload: Record<string, unknown> = {
      checkout_reference: params.checkoutReference,
      amount: params.amount,
      currency: params.currency,
      merchant_code: SUMUP_MERCHANT_CODE,
      description: params.description,
    };

    if (params.returnUrl) {
      payload.return_url = params.returnUrl;
      payload.redirect_url = params.returnUrl;
    }
    if (params.customerId) {
      payload.customer_id = params.customerId;
    }
    if (params.affiliateKey) {
      payload.affiliate_key = params.affiliateKey;
    }

    const { data } = await this.client.post<SumUpCheckout>('/checkouts', payload);
    return data;
  }

  /**
   * Get checkout status
   */
  async getCheckout(checkoutId: string): Promise<SumUpCheckout> {
    const { data } = await this.client.get<SumUpCheckout>(`/checkouts/${checkoutId}`);
    return data;
  }

  /**
   * Create a recurring subscription
   * SumUp subscriptions use the mandate + recurring charge pattern
   */
  async createSubscription(params: {
    customerId: string;
    planKey: string;
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    description: string;
  }): Promise<SumUpSubscription> {
    const { data } = await this.client.post<SumUpSubscription>('/subscriptions', {
      customer_id: params.customerId,
      plan_id: params.planKey,
      amount: params.amount,
      currency: params.currency,
      interval: params.interval,
      description: params.description,
    });
    return data;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.client.delete(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SumUpSubscription> {
    const { data } = await this.client.get<SumUpSubscription>(
      `/subscriptions/${subscriptionId}`
    );
    return data;
  }

  /**
   * Retrieve a list of subscriptions for a customer
   */
  async listCustomerSubscriptions(customerId: string): Promise<SumUpSubscription[]> {
    const { data } = await this.client.get<{ items: SumUpSubscription[] }>(
      `/customers/${customerId}/subscriptions`
    );
    return data.items || [];
  }

  /**
   * Generate a checkout reference unique to a user + plan
   */
  generateCheckoutReference(userId: string, planKey: string, timestamp?: number): string {
    const ts = timestamp ?? Date.now();
    return `akiprisaye-${userId.substring(0, 8)}-${planKey}-${ts}`;
  }
}

export default new SumUpService();
