/**
 * White-Label Service
 *
 * Gestion des tenants white-label : personnalisation (logo, couleurs, domaine),
 * isolation des données, tarification et déploiement multi-tenant.
 */

export interface TenantBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  appIcon?: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  branding: TenantBranding;
  apiKey: string;
  monthlyFee: number;
  revenueShare: number;  // e.g. 0.01 = 1%
  isActive: boolean;
  createdAt: Date;
}

export interface WhiteLabelPricing {
  setupFee: number;
  monthlyFee: number;
  revenueShareRate: number;
  sla: string;
  support: string;
}

export const WHITE_LABEL_PRICING: WhiteLabelPricing = {
  setupFee: 5000,
  monthlyFee: 500,
  revenueShareRate: 0.01, // 1% of scanner revenue OR 70/30 split
  sla: '99.9%',
  support: 'Support dédié',
};

export const WHITE_LABEL_FEATURES = [
  'Logo, couleurs et polices personnalisés',
  'Domaine personnalisé (DNS CNAME)',
  'Templates email brandés',
  'Icône application mobile',
  'Accès complet aux fonctionnalités Akiprisaye',
  'Intégrations personnalisées',
  'Base de données isolée par tenant',
  'CDN avec branding mis en cache',
  'Analytics séparés',
  `SLA ${WHITE_LABEL_PRICING.sla} garanti`,
];

export class WhiteLabelService {
  /**
   * Validate a custom domain format.
   */
  static validateDomain(domain: string): boolean {
    const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(domain);
  }

  /**
   * Generate a unique API key for a new tenant.
   */
  static generateTenantApiKey(tenantId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `wl_${tenantId.slice(0, 6)}_${timestamp}_${random}`;
  }

  /**
   * Build CNAME DNS instructions for tenant domain setup.
   */
  static getDnsInstructions(customDomain: string): {
    type: string;
    name: string;
    value: string;
    ttl: number;
  } {
    return {
      type: 'CNAME',
      name: customDomain,
      value: 'akiprisaye.re',
      ttl: 3600,
    };
  }

  /**
   * Compute revenue share amount.
   */
  static computeRevenueShare(scannerRevenue: number, shareRate: number): number {
    return Math.round(scannerRevenue * shareRate * 100) / 100;
  }

  /**
   * Compute monthly invoice for a white-label tenant.
   */
  static computeMonthlyInvoice(tenant: {
    monthlyFee: number;
    revenueShare: number;
    scannerRevenue: number;
  }): { baseFee: number; revenueShareAmount: number; total: number } {
    const revenueShareAmount = this.computeRevenueShare(tenant.scannerRevenue, tenant.revenueShare);
    return {
      baseFee: tenant.monthlyFee,
      revenueShareAmount,
      total: tenant.monthlyFee + revenueShareAmount,
    };
  }

  /**
   * Get default branding config.
   */
  static getDefaultBranding(): TenantBranding {
    return {
      logo: null,
      primaryColor: '#10b981',
      secondaryColor: '#047857',
      fontFamily: 'Inter, sans-serif',
    };
  }

  static getPricing(): WhiteLabelPricing {
    return WHITE_LABEL_PRICING;
  }

  static getFeatures(): string[] {
    return WHITE_LABEL_FEATURES;
  }
}
