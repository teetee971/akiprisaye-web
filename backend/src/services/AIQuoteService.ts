/**
 * AI Quote Service
 * Generates automated quotes for Enterprise and Institution plans
 * Uses intelligent forms and estimation algorithms
 */

import type { Plan } from '../models/Subscription.js';

export interface QuoteRequest {
  id: string;
  userId: string;
  plan: Plan; // ENTERPRISE or INSTITUTION
  territory: string;
  organizationType: 'private_enterprise' | 'public_institution';
  
  // Requirements gathering
  requirements: {
    userCount?: number;
    storeCount?: number;
    apiCallsPerMonth?: number;
    dataExportFrequency?: 'daily' | 'weekly' | 'monthly';
    analyticsDepth?: 'basic' | 'advanced' | 'custom';
    supportLevel?: 'standard' | 'priority' | 'dedicated';
    customFeatures?: string[];
  };
  
  // Organization details
  organization: {
    name: string;
    siret?: string;
    sector: string;
    contactEmail: string;
    contactPhone?: string;
    billingAddress: string;
  };
  
  // Status
  status: 'draft' | 'submitted' | 'ai_processing' | 'human_review' | 'approved' | 'sent' | 'accepted' | 'rejected';
  
  // Dates
  createdAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  sentAt?: Date;
  expiresAt?: Date; // Quote validity period
}

export interface Quote {
  id: string;
  quoteRequestId: string;
  quoteNumber: string; // Format: QT-YYYY-NNNNNN
  
  // Pricing breakdown
  basePlan: Plan;
  basePrice: number;
  
  // Additional services
  services: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  
  // Totals
  subtotal: number;
  discount?: {
    percentage: number;
    amount: number;
    reason: string;
  };
  vatRate: number;
  vatAmount: number;
  total: number;
  
  // AI analysis
  aiConfidence: number; // 0-1 score
  aiRecommendations?: string[];
  requiresHumanReview: boolean;
  
  // Validation
  reviewedBy?: string; // User ID of reviewer
  reviewNotes?: string;
  
  // Status
  status: 'draft' | 'pending_review' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired';
  
  // Dates
  createdAt: Date;
  validUntil: Date;
  acceptedAt?: Date;
}

// In-memory stores (replace with database)
const quoteRequests: Map<string, QuoteRequest> = new Map();
const quotes: Map<string, Quote> = new Map();
let quoteCounter = 1;

export class AIQuoteService {
  /**
   * Create a new quote request
   */
  static async createQuoteRequest(data: Omit<QuoteRequest, 'id' | 'status' | 'createdAt'>): Promise<QuoteRequest> {
    const id = `qr_${Date.now()}`;
    
    const quoteRequest: QuoteRequest = {
      id,
      ...data,
      status: 'draft',
      createdAt: new Date(),
    };
    
    quoteRequests.set(id, quoteRequest);
    return quoteRequest;
  }

  /**
   * Submit quote request for AI processing
   */
  static async submitQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    const request = quoteRequests.get(quoteRequestId);
    if (!request) {
      throw new Error('Quote request not found');
    }
    
    request.status = 'submitted';
    request.submittedAt = new Date();
    quoteRequests.set(quoteRequestId, request);
    
    // Trigger AI processing
    this.processQuoteWithAI(quoteRequestId);
    
    return request;
  }

  /**
   * AI-powered quote generation
   */
  private static async processQuoteWithAI(quoteRequestId: string): Promise<void> {
    const request = quoteRequests.get(quoteRequestId);
    if (!request) return;
    
    request.status = 'ai_processing';
    quoteRequests.set(quoteRequestId, request);
    
    // Simulate AI processing delay
    setTimeout(async () => {
      const quote = await this.generateQuote(request);
      
      // If AI confidence is low, require human review
      if (quote.aiConfidence < 0.7 || quote.requiresHumanReview) {
        request.status = 'human_review';
      } else {
        request.status = 'approved';
        quote.status = 'approved';
        quotes.set(quote.id, quote);
      }
      
      quoteRequests.set(quoteRequestId, request);
    }, 2000);
  }

  /**
   * Generate quote based on requirements
   */
  private static async generateQuote(request: QuoteRequest): Promise<Quote> {
    const id = `qt_${Date.now()}`;
    const year = new Date().getFullYear();
    const number = String(quoteCounter++).padStart(6, '0');
    const quoteNumber = `QT-${year}-${number}`;
    
    // Base price
    const basePrice = this.calculateBasePrice(request);
    
    // Additional services
    const services = this.calculateAdditionalServices(request);
    
    // Calculate totals
    const subtotal = basePrice + services.reduce((sum, s) => sum + s.total, 0);
    
    // Apply discount if applicable
    const discount = this.calculateDiscount(request, subtotal);
    
    const subtotalAfterDiscount = subtotal - (discount?.amount || 0);
    
    // VAT (using territory rate)
    const vatRate = this.getVATRate(request.territory);
    const vatAmount = Math.round(subtotalAfterDiscount * vatRate * 100) / 100;
    const total = subtotalAfterDiscount + vatAmount;
    
    // AI confidence based on data completeness
    const aiConfidence = this.calculateAIConfidence(request);
    
    // Determine if human review is needed
    const requiresHumanReview = 
      aiConfidence < 0.7 || 
      total > 50000 || 
      request.requirements.customFeatures && request.requirements.customFeatures.length > 0;
    
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 30); // Quote valid for 30 days
    
    const quote: Quote = {
      id,
      quoteRequestId: request.id,
      quoteNumber,
      basePlan: request.plan,
      basePrice,
      services,
      subtotal,
      discount,
      vatRate,
      vatAmount,
      total,
      aiConfidence,
      aiRecommendations: this.generateRecommendations(request),
      requiresHumanReview: requiresHumanReview || false,
      status: 'draft',
      createdAt: now,
      validUntil,
    };
    
    quotes.set(id, quote);
    return quote;
  }

  /**
   * Calculate base price for plan
   */
  private static calculateBasePrice(request: QuoteRequest): number {
    const basePrices: Record<Plan, number> = {
      'CITIZEN': 49,
      'PRO': 190,
      'BUSINESS': 990,
      'ENTERPRISE': 2500,
      'INSTITUTION': 500,
    };
    
    return basePrices[request.plan] || 0;
  }

  /**
   * Calculate additional services pricing
   */
  private static calculateAdditionalServices(request: QuoteRequest): Quote['services'] {
    const services: Quote['services'] = [];
    const req = request.requirements;
    
    // User licenses
    if (req.userCount && req.userCount > 10) {
      const additionalUsers = req.userCount - 10;
      services.push({
        name: 'Licences utilisateurs supplémentaires',
        description: `${additionalUsers} utilisateurs au-delà de la base de 10`,
        quantity: additionalUsers,
        unitPrice: request.plan === 'INSTITUTION' ? 5 : 10,
        total: additionalUsers * (request.plan === 'INSTITUTION' ? 5 : 10),
      });
    }
    
    // Store management
    if (req.storeCount && req.storeCount > 5) {
      const additionalStores = req.storeCount - 5;
      services.push({
        name: 'Gestion multi-points de vente',
        description: `${additionalStores} points de vente au-delà de la base de 5`,
        quantity: additionalStores,
        unitPrice: 50,
        total: additionalStores * 50,
      });
    }
    
    // API calls
    if (req.apiCallsPerMonth) {
      const tier = this.getAPITier(req.apiCallsPerMonth);
      if (tier.price > 0) {
        services.push({
          name: 'Accès API',
          description: `${tier.calls.toLocaleString()} appels/mois`,
          quantity: 1,
          unitPrice: tier.price,
          total: tier.price,
        });
      }
    }
    
    // Advanced analytics
    if (req.analyticsDepth === 'advanced' || req.analyticsDepth === 'custom') {
      services.push({
        name: 'Analytics avancés',
        description: req.analyticsDepth === 'custom' ? 'Tableaux de bord personnalisés' : 'Analytics avancés',
        quantity: 1,
        unitPrice: req.analyticsDepth === 'custom' ? 500 : 200,
        total: req.analyticsDepth === 'custom' ? 500 : 200,
      });
    }
    
    // Support level
    if (req.supportLevel === 'priority' || req.supportLevel === 'dedicated') {
      services.push({
        name: 'Support',
        description: req.supportLevel === 'dedicated' ? 'Support dédié 24/7' : 'Support prioritaire',
        quantity: 1,
        unitPrice: req.supportLevel === 'dedicated' ? 1000 : 300,
        total: req.supportLevel === 'dedicated' ? 1000 : 300,
      });
    }
    
    return services;
  }

  /**
   * Get API pricing tier
   */
  private static getAPITier(calls: number): { calls: number; price: number } {
    if (calls <= 10000) return { calls: 10000, price: 0 };
    if (calls <= 50000) return { calls: 50000, price: 100 };
    if (calls <= 200000) return { calls: 200000, price: 300 };
    return { calls: 1000000, price: 1000 };
  }

  /**
   * Calculate discount if applicable
   */
  private static calculateDiscount(request: QuoteRequest, subtotal: number): Quote['discount'] | undefined {
    // Public institutions get 50% discount
    if (request.organizationType === 'public_institution') {
      return {
        percentage: 50,
        amount: Math.round(subtotal * 0.5),
        reason: 'Tarif institutionnel public',
      };
    }
    
    // Large contracts get volume discount
    if (subtotal > 10000) {
      return {
        percentage: 10,
        amount: Math.round(subtotal * 0.1),
        reason: 'Remise volume (>10K€)',
      };
    }
    
    return undefined;
  }

  /**
   * Get VAT rate for territory
   */
  private static getVATRate(territory: string): number {
    const rates: Record<string, number> = {
      'GP': 0.085, 'MQ': 0.085, 'GF': 0.0, 'RE': 0.085,
      'YT': 0.0, 'PM': 0.0, 'BL': 0.0, 'MF': 0.0,
      'WF': 0.0, 'PF': 0.16, 'NC': 0.11, 'TF': 0.0,
      'FR': 0.20,
    };
    return rates[territory] || 0.20;
  }

  /**
   * Calculate AI confidence score
   */
  private static calculateAIConfidence(request: QuoteRequest): number {
    let score = 0.5; // Base score
    
    const req = request.requirements;
    
    // Completeness scoring
    if (req.userCount) score += 0.1;
    if (req.storeCount) score += 0.1;
    if (req.apiCallsPerMonth) score += 0.1;
    if (req.analyticsDepth) score += 0.05;
    if (req.supportLevel) score += 0.05;
    if (request.organization.siret) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate AI recommendations
   */
  private static generateRecommendations(request: QuoteRequest): string[] {
    const recommendations: string[] = [];
    const req = request.requirements;
    
    if (!req.userCount || req.userCount < 5) {
      recommendations.push('Considérez augmenter le nombre de licences utilisateurs pour optimiser la collaboration');
    }
    
    if (req.apiCallsPerMonth && req.apiCallsPerMonth > 100000 && req.supportLevel !== 'dedicated') {
      recommendations.push('Pour ce volume d\'appels API, nous recommandons un support dédié');
    }
    
    if (request.organizationType === 'public_institution' && !request.organization.siret) {
      recommendations.push('Merci de fournir votre SIRET pour bénéficier du tarif institutionnel');
    }
    
    return recommendations;
  }

  /**
   * Human review approval
   */
  static async approveQuote(quoteId: string, reviewerId: string, notes?: string): Promise<Quote> {
    const quote = quotes.get(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    quote.status = 'approved';
    quote.reviewedBy = reviewerId;
    quote.reviewNotes = notes;
    quotes.set(quoteId, quote);
    
    // Update request status
    const request = quoteRequests.get(quote.quoteRequestId);
    if (request) {
      request.status = 'approved';
      request.reviewedAt = new Date();
      quoteRequests.set(quote.quoteRequestId, request);
    }
    
    return quote;
  }

  /**
   * Send quote to client
   */
  static async sendQuote(quoteId: string): Promise<Quote> {
    const quote = quotes.get(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    if (quote.status !== 'approved') {
      throw new Error('Quote must be approved before sending');
    }
    
    quote.status = 'sent';
    quotes.set(quoteId, quote);
    
    const request = quoteRequests.get(quote.quoteRequestId);
    if (request) {
      request.status = 'sent';
      request.sentAt = new Date();
      quoteRequests.set(quote.quoteRequestId, request);
    }
    
    // In production: Send email with quote PDF
    
    return quote;
  }

  /**
   * Accept quote (client action)
   */
  static async acceptQuote(quoteId: string): Promise<Quote> {
    const quote = quotes.get(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    quote.status = 'accepted';
    quote.acceptedAt = new Date();
    quotes.set(quoteId, quote);
    
    const request = quoteRequests.get(quote.quoteRequestId);
    if (request) {
      request.status = 'accepted';
      quoteRequests.set(quote.quoteRequestId, request);
    }
    
    // Trigger subscription creation and payment
    // In production: Create subscription and payment intent
    
    return quote;
  }

  /**
   * Get quote by ID
   */
  static async getQuote(quoteId: string): Promise<Quote | null> {
    return quotes.get(quoteId) || null;
  }

  /**
   * Get quote request by ID
   */
  static async getQuoteRequest(requestId: string): Promise<QuoteRequest | null> {
    return quoteRequests.get(requestId) || null;
  }

  /**
   * List quotes for user
   */
  static async listQuotesForUser(userId: string): Promise<Quote[]> {
    const userQuotes: Quote[] = [];
    
    // Find all requests for user
    const userRequests: string[] = [];
    for (const request of quoteRequests.values()) {
      if (request.userId === userId) {
        userRequests.push(request.id);
      }
    }
    
    // Find quotes for those requests
    for (const quote of quotes.values()) {
      if (userRequests.includes(quote.quoteRequestId)) {
        userQuotes.push(quote);
      }
    }
    
    return userQuotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export default AIQuoteService;
