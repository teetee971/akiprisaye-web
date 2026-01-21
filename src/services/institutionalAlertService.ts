import { safeLocalStorage } from '../utils/safeLocalStorage';
/**
 * Institutional Alert Service
 * Automatic detection and reporting of abnormal prices to authorities
 */

interface PriceAnomaly {
  productEAN: string;
  productName: string;
  storeId: string;
  storeName: string;
  territory: string;
  currentPrice: number;
  averagePrice: number;
  deviation: number; // Standard deviations from mean
  deviationPercentage: number;
  severity: 'warning' | 'critical';
  detectedAt: string;
}

interface InstitutionalAlert {
  id: string;
  anomalies: PriceAnomaly[];
  territory: string;
  createdAt: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'acknowledged';
  recipientEmails: string[];
}

export class InstitutionalAlertService {
  private readonly WARNING_THRESHOLD_SIGMA = 2.0; // 2 standard deviations
  private readonly CRITICAL_THRESHOLD_SIGMA = 3.0; // 3 standard deviations
  private readonly SUDDEN_INCREASE_THRESHOLD = 10; // 10% increase in 7 days

  /**
   * Detect price anomalies automatically
   */
  async detectAnomalies(): Promise<PriceAnomaly[]> {
    // TODO: Query Firestore for all recent prices and calculate statistics
    // Mock implementation
    const anomalies: PriceAnomaly[] = [];
    
    // Example anomaly
    const mockAnomaly: PriceAnomaly = {
      productEAN: '3017620422003',
      productName: 'Lait UHT 1L',
      storeId: 'store-123',
      storeName: 'Super U Pointe-à-Pitre',
      territory: 'GP',
      currentPrice: 3.50,
      averagePrice: 2.40,
      deviation: 2.5,
      deviationPercentage: 45.8,
      severity: 'critical',
      detectedAt: new Date().toISOString()
    };
    
    // Only add if truly anomalous
    if (mockAnomaly.deviation >= this.WARNING_THRESHOLD_SIGMA) {
      anomalies.push(mockAnomaly);
    }
    
    return anomalies;
  }

  /**
   * Detect sudden price increases (>10% in 7 days)
   */
  async detectSuddenIncreases(): Promise<PriceAnomaly[]> {
    // TODO: Compare current prices with prices from 7 days ago
    return [];
  }

  /**
   * Create an institutional alert
   */
  async createAlert(
    anomalies: PriceAnomaly[], 
    territory: string
  ): Promise<InstitutionalAlert> {
    const alert: InstitutionalAlert = {
      id: this.generateAlertId(),
      anomalies,
      territory,
      createdAt: new Date().toISOString(),
      status: 'pending',
      recipientEmails: this.getRecipientEmails(territory)
    };
    
    // TODO: Store in Firestore
    // For now, store in safeLocalStorage
    this.storeAlert(alert);
    
    return alert;
  }

  /**
   * Send alert to authorities (DGCCRF, local consumer protection)
   */
  async sendAlert(alert: InstitutionalAlert): Promise<void> {
    // TODO: Implement email sending via backend API
    console.log('Sending institutional alert:', alert);
    
    // Update alert status
    alert.sentAt = new Date().toISOString();
    alert.status = 'sent';
    this.storeAlert(alert);
    
    // TODO: Call backend API to send emails
    // await fetch('/api/send-institutional-alert', {
    //   method: 'POST',
    //   body: JSON.stringify(alert)
    // });
  }

  /**
   * Get pending alerts
   */
  getPendingAlerts(): InstitutionalAlert[] {
    const stored = safeLocalStorage.getItem('institutional_alerts');
    if (!stored) return [];
    
    const alerts: InstitutionalAlert[] = JSON.parse(stored);
    return alerts.filter(a => a.status === 'pending');
  }

  /**
   * Check for anomalies and auto-send alerts if configured
   */
  async checkAndAlertIfNeeded(): Promise<void> {
    const anomalies = await this.detectAnomalies();
    const suddenIncreases = await this.detectSuddenIncreases();
    
    const allAnomalies = [...anomalies, ...suddenIncreases];
    
    // Group by territory
    const byTerritory = new Map<string, PriceAnomaly[]>();
    allAnomalies.forEach(a => {
      const existing = byTerritory.get(a.territory) || [];
      existing.push(a);
      byTerritory.set(a.territory, existing);
    });
    
    // Create alerts for each territory with anomalies
    for (const [territory, territoryAnomalies] of byTerritory) {
      if (territoryAnomalies.length > 0) {
        const alert = await this.createAlert(territoryAnomalies, territory);
        
        // Auto-send if critical anomalies detected
        const hasCritical = territoryAnomalies.some(a => a.severity === 'critical');
        if (hasCritical) {
          await this.sendAlert(alert);
        }
      }
    }
  }

  // Private helper methods
  private generateAlertId(): string {
    return `INST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRecipientEmails(territory: string): string[] {
    // TODO: Configure per territory
    const emails: Record<string, string[]> = {
      'GP': ['dgccrf-guadeloupe@example.com', 'consommation-gp@example.com'],
      'MQ': ['dgccrf-martinique@example.com', 'consommation-mq@example.com'],
      'GF': ['dgccrf-guyane@example.com'],
      'RE': ['dgccrf-reunion@example.com']
    };
    
    return emails[territory] || [];
  }

  private storeAlert(alert: InstitutionalAlert): void {
    const alerts = this.getAllAlerts();
    const index = alerts.findIndex(a => a.id === alert.id);
    
    if (index >= 0) {
      alerts[index] = alert;
    } else {
      alerts.push(alert);
    }
    
    safeLocalStorage.setItem('institutional_alerts', JSON.stringify(alerts));
  }

  private getAllAlerts(): InstitutionalAlert[] {
    const stored = safeLocalStorage.getItem('institutional_alerts');
    return stored ? JSON.parse(stored) : [];
  }
}

export const institutionalAlertService = new InstitutionalAlertService();
