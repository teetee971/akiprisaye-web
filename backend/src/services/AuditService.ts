/**
 * Audit Service
 * Tracks paid service access and consumption for governance and transparency
 */

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: 'access' | 'payment' | 'subscription_change' | 'export' | 'api_call';
  resource: string; // What was accessed (e.g., 'price_comparison', 'invoice_pdf', 'api_prices')
  plan: string;
  
  // Context
  ipAddress?: string; // Masked for privacy (192.168.1.XXX)
  userAgent?: string;
  territory?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  timestamp: Date;
}

export interface ServiceConsumption {
  id: string;
  userId: string;
  subscriptionId: string;
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  
  // Consumption tracking
  period: {
    start: Date;
    end: Date;
  };
  
  usage: {
    apiCalls: number;
    exports: number;
    searches: number;
    scans: number;
  };
  
  // Quotas (plan-based)
  quotas: {
    apiCalls: number;
    exports: number;
    searches: number;
    scans: number;
  };
  
  // Overages (if applicable)
  overages?: {
    apiCalls?: number;
    exports?: number;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicIndicator {
  id: string;
  indicator: string;
  value: number | string;
  territory?: string;
  period: {
    start: Date;
    end: Date;
  };
  updatedAt: Date;
}

// In-memory stores (replace with database)
const auditLogs: Map<string, AuditLog> = new Map();
const serviceConsumptions: Map<string, ServiceConsumption> = new Map();
const publicIndicators: Map<string, PublicIndicator> = new Map();

export class AuditService {
  /**
   * Log paid service access
   */
  static async logAccess(data: {
    userId: string;
    userEmail?: string;
    action: AuditLog['action'];
    resource: string;
    plan: string;
    ipAddress?: string;
    userAgent?: string;
    territory?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const log: AuditLog = {
      id,
      ...data,
      ipAddress: data.ipAddress ? this.maskIP(data.ipAddress) : undefined,
      timestamp: new Date(),
    };
    
    auditLogs.set(id, log);
    
    // Also update service consumption
    await this.trackConsumption(data.userId, data.action, data.plan);
    
    return log;
  }

  /**
   * Mask IP address for privacy (192.168.1.XXX or 2001:db8::XXX)
   */
  private static maskIP(ip: string): string {
    // Handle IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = 'XXX';
        return parts.join('.');
      }
    }
    
    // Handle IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length > 2) {
        // Mask last segment
        parts[parts.length - 1] = 'XXX';
        return parts.join(':');
      }
    }
    
    // Fallback for malformed IPs
    return 'XXX.XXX.XXX.XXX';
  }

  /**
   * Track service consumption
   */
  private static async trackConsumption(
    userId: string,
    action: AuditLog['action'],
    plan: string
  ): Promise<void> {
    // Find or create current period consumption
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    let consumption = this.findConsumption(userId, periodStart, periodEnd);
    
    if (!consumption) {
      consumption = await this.createConsumption(userId, plan, periodStart, periodEnd);
    }
    
    // Increment usage counter
    switch (action) {
      case 'api_call':
        consumption.usage.apiCalls++;
        break;
      case 'export':
        consumption.usage.exports++;
        break;
      case 'access':
        consumption.usage.searches++;
        break;
    }
    
    // Check for overages
    if (consumption.usage.apiCalls > consumption.quotas.apiCalls) {
      consumption.overages = consumption.overages || {};
      consumption.overages.apiCalls = consumption.usage.apiCalls - consumption.quotas.apiCalls;
    }
    
    if (consumption.usage.exports > consumption.quotas.exports) {
      consumption.overages = consumption.overages || {};
      consumption.overages.exports = consumption.usage.exports - consumption.quotas.exports;
    }
    
    consumption.updatedAt = new Date();
    serviceConsumptions.set(consumption.id, consumption);
  }

  /**
   * Find consumption for period
   */
  private static findConsumption(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): ServiceConsumption | null {
    for (const consumption of serviceConsumptions.values()) {
      if (
        consumption.userId === userId &&
        consumption.period.start.getTime() === periodStart.getTime() &&
        consumption.period.end.getTime() === periodEnd.getTime()
      ) {
        return consumption;
      }
    }
    return null;
  }

  /**
   * Create new consumption period
   */
  private static async createConsumption(
    userId: string,
    plan: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ServiceConsumption> {
    const id = `cons_${Date.now()}`;
    const quotas = this.getQuotas(plan);
    
    const consumption: ServiceConsumption = {
      id,
      userId,
      subscriptionId: '', // Would come from subscription lookup
      plan,
      billingCycle: 'monthly',
      period: {
        start: periodStart,
        end: periodEnd,
      },
      usage: {
        apiCalls: 0,
        exports: 0,
        searches: 0,
        scans: 0,
      },
      quotas,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    serviceConsumptions.set(id, consumption);
    return consumption;
  }

  /**
   * Get quotas by plan
   */
  private static getQuotas(plan: string): ServiceConsumption['quotas'] {
    const quotasByPlan: Record<string, ServiceConsumption['quotas']> = {
      CITIZEN: {
        apiCalls: 0, // No API access
        exports: 50, // 50 PDF exports/month
        searches: 1000, // 1000 searches/month
        scans: 100, // 100 scans/month
      },
      PRO: {
        apiCalls: 1000, // 1K API calls/month
        exports: 200,
        searches: 5000,
        scans: 500,
      },
      BUSINESS: {
        apiCalls: 10000, // 10K API calls/month
        exports: 1000,
        searches: 50000,
        scans: 2000,
      },
      ENTERPRISE: {
        apiCalls: 100000, // 100K API calls/month
        exports: 10000,
        searches: 1000000,
        scans: 10000,
      },
      INSTITUTION: {
        apiCalls: 100000,
        exports: 10000,
        searches: 1000000,
        scans: 10000,
      },
    };
    
    return quotasByPlan[plan] || quotasByPlan.CITIZEN;
  }

  /**
   * Get audit logs for user
   */
  static async getAuditLogs(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    
    for (const log of auditLogs.values()) {
      if (log.userId === userId) {
        // Date filtering
        if (options?.startDate && log.timestamp < options.startDate) continue;
        if (options?.endDate && log.timestamp > options.endDate) continue;
        
        logs.push(log);
      }
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    
    return logs.slice(offset, offset + limit);
  }

  /**
   * Get service consumption for user
   */
  static async getServiceConsumption(
    userId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ServiceConsumption | null> {
    if (!periodStart || !periodEnd) {
      // Current month
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    return this.findConsumption(userId, periodStart, periodEnd);
  }

  /**
   * Check if user has exceeded quota
   */
  static async checkQuota(
    userId: string,
    action: 'api_call' | 'export' | 'search' | 'scan'
  ): Promise<{
    allowed: boolean;
    usage: number;
    quota: number;
    remaining: number;
  }> {
    const consumption = await this.getServiceConsumption(userId);
    
    if (!consumption) {
      return {
        allowed: true,
        usage: 0,
        quota: 0,
        remaining: 0,
      };
    }
    
    let usage = 0;
    let quota = 0;
    
    switch (action) {
      case 'api_call':
        usage = consumption.usage.apiCalls;
        quota = consumption.quotas.apiCalls;
        break;
      case 'export':
        usage = consumption.usage.exports;
        quota = consumption.quotas.exports;
        break;
      case 'search':
        usage = consumption.usage.searches;
        quota = consumption.quotas.searches;
        break;
      case 'scan':
        usage = consumption.usage.scans;
        quota = consumption.quotas.scans;
        break;
    }
    
    return {
      allowed: usage < quota,
      usage,
      quota,
      remaining: Math.max(0, quota - usage),
    };
  }

  /**
   * Update public indicators (non-sensitive)
   */
  static async updatePublicIndicator(
    indicator: string,
    value: number | string,
    territory?: string
  ): Promise<PublicIndicator> {
    const id = `indicator_${indicator}_${territory || 'global'}`;
    
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const publicIndicator: PublicIndicator = {
      id,
      indicator,
      value,
      territory,
      period: {
        start: periodStart,
        end: periodEnd,
      },
      updatedAt: now,
    };
    
    publicIndicators.set(id, publicIndicator);
    return publicIndicator;
  }

  /**
   * Get public indicators
   */
  static async getPublicIndicators(territory?: string): Promise<PublicIndicator[]> {
    const indicators: PublicIndicator[] = [];
    
    for (const indicator of publicIndicators.values()) {
      if (!territory || indicator.territory === territory) {
        indicators.push(indicator);
      }
    }
    
    return indicators;
  }

  /**
   * Generate audit report
   */
  static async generateAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalAccess: number;
    totalPayments: number;
    totalExports: number;
    totalAPIcalls: number;
    uniqueUsers: number;
    byPlan: Record<string, number>;
    byTerritory: Record<string, number>;
  }> {
    const report = {
      totalAccess: 0,
      totalPayments: 0,
      totalExports: 0,
      totalAPIcalls: 0,
      uniqueUsers: 0,
      byPlan: {} as Record<string, number>,
      byTerritory: {} as Record<string, number>,
    };
    
    const uniqueUserIds = new Set<string>();
    
    for (const log of auditLogs.values()) {
      if (log.timestamp >= startDate && log.timestamp <= endDate) {
        uniqueUserIds.add(log.userId);
        
        if (log.action === 'access') report.totalAccess++;
        if (log.action === 'payment') report.totalPayments++;
        if (log.action === 'export') report.totalExports++;
        if (log.action === 'api_call') report.totalAPIcalls++;
        
        // Count by plan
        report.byPlan[log.plan] = (report.byPlan[log.plan] || 0) + 1;
        
        // Count by territory
        if (log.territory) {
          report.byTerritory[log.territory] = (report.byTerritory[log.territory] || 0) + 1;
        }
      }
    }
    
    report.uniqueUsers = uniqueUserIds.size;
    
    return report;
  }

  /**
   * Export audit trail for compliance
   */
  static async exportAuditTrail(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs: AuditLog[] = [];
    
    for (const log of auditLogs.values()) {
      if (log.timestamp >= startDate && log.timestamp <= endDate) {
        logs.push(log);
      }
    }
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV format
    const headers = ['ID', 'UserID', 'Action', 'Resource', 'Plan', 'Territory', 'Timestamp', 'IP'];
    const rows = logs.map(log => [
      log.id,
      log.userId,
      log.action,
      log.resource,
      log.plan,
      log.territory || '',
      log.timestamp.toISOString(),
      log.ipAddress || '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return csv;
  }
}

export default AuditService;
