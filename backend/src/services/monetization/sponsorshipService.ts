/**
 * Sponsorship Service
 *
 * Gestion des slots publicitaires sponsorisés : Hero Banner, Search Results,
 * Newsletter, Sidebar. Inclut tracking impressions/clics et anti-fraude basique.
 */

export type SlotType = 'hero' | 'search' | 'newsletter' | 'sidebar';

export interface SponsorshipSlotConfig {
  type: SlotType;
  label: string;
  dimensions?: string;
  pricing: {
    model: 'weekly' | 'per_click' | 'per_send';
    amount: number;
    currency: 'EUR';
  };
  maxPerPage: number;
  description: string;
}

export interface SponsorCampaign {
  id: string;
  sponsor: string;
  slotType: SlotType;
  startDate: Date;
  endDate: Date;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface ClickEvent {
  slotId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  territory: string;
}

export const SLOT_CONFIGS: Record<SlotType, SponsorshipSlotConfig> = {
  hero: {
    type: 'hero',
    label: 'Hero Banner Homepage',
    dimensions: '1200×400px',
    pricing: { model: 'weekly', amount: 500, currency: 'EUR' },
    maxPerPage: 1,
    description: 'Emplacement premium en haut de la page d\'accueil, rotation automatique entre sponsors.',
  },
  search: {
    type: 'search',
    label: 'Résultats de recherche sponsorisés',
    pricing: { model: 'per_click', amount: 5, currency: 'EUR' },
    maxPerPage: 3,
    description: '3 résultats mis en avant par requête avec badge "Sponsorisé".',
  },
  newsletter: {
    type: 'newsletter',
    label: 'Sponsor Newsletter',
    pricing: { model: 'per_send', amount: 200, currency: 'EUR' },
    maxPerPage: 1,
    description: 'Bannière in-email avec tracking de clics et A/B testing.',
  },
  sidebar: {
    type: 'sidebar',
    label: 'Widget Sidebar "Meilleures Offres"',
    pricing: { model: 'weekly', amount: 300, currency: 'EUR' },
    maxPerPage: 1,
    description: 'Widget latéral avec liens partenaires et partage de revenus 2–8%.',
  },
};

export class SponsorshipService {
  static getSlotConfigs(): SponsorshipSlotConfig[] {
    return Object.values(SLOT_CONFIGS);
  }

  static getSlotConfig(type: SlotType): SponsorshipSlotConfig {
    return SLOT_CONFIGS[type];
  }

  /**
   * Compute campaign cost estimate.
   */
  static estimateCampaignCost(
    slotType: SlotType,
    durationDays: number,
    estimatedClicks?: number
  ): number {
    const config = SLOT_CONFIGS[slotType];
    if (config.pricing.model === 'weekly') {
      return Math.ceil(durationDays / 7) * config.pricing.amount;
    }
    if (config.pricing.model === 'per_click') {
      return (estimatedClicks ?? 100) * config.pricing.amount;
    }
    if (config.pricing.model === 'per_send') {
      return config.pricing.amount;
    }
    return 0;
  }

  /**
   * Basic bot/fraud detection for click events.
   * Returns true if the click looks suspicious.
   */
  static isSuspiciousClick(event: ClickEvent, recentClicksFromIp: number): boolean {
    // More than 5 clicks from the same IP in a short window is suspicious
    if (recentClicksFromIp > 5) return true;
    // Known bot user agents
    const botPatterns = ['bot', 'crawler', 'spider', 'headless', 'scrapy', 'python-requests'];
    const ua = event.userAgent.toLowerCase();
    return botPatterns.some((pattern) => ua.includes(pattern));
  }

  /**
   * Compute ROI for a sponsor campaign.
   */
  static computeROI(campaign: SponsorCampaign, revenuePerConversion: number): number {
    const durationDays =
      (campaign.endDate.getTime() - campaign.startDate.getTime()) / 86400000;
    const totalSpend = this.estimateCampaignCost(
      campaign.slotType,
      durationDays,
      campaign.clicks
    );

    const revenue = campaign.conversions * revenuePerConversion;
    if (totalSpend === 0) return 0;
    return ((revenue - totalSpend) / totalSpend) * 100;
  }

  /**
   * Check if a slot type is currently available for booking.
   */
  static isSlotAvailable(type: SlotType, activeCampaigns: SponsorCampaign[]): boolean {
    const config = SLOT_CONFIGS[type];
    const activeForType = activeCampaigns.filter(
      (c) => c.slotType === type && c.endDate > new Date()
    );
    return activeForType.length < config.maxPerPage;
  }
}
