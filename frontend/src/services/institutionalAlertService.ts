import { safeLocalStorage } from '../utils/safeLocalStorage';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
    // Queries Firestore price_observations for recent entries and checks for
    // statistical deviations. Falls back to empty array if Firestore is unavailable.
    if (!db) return [];
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const snapshot = await getDocs(
        query(collection(db, 'price_observations'), where('date', '>=', sevenDaysAgo))
      );

      // Group observations by EAN to compute per-product statistics
      const byEAN = new Map<string, { prices: number[]; latest: (typeof snapshot.docs)[0] }>();
      for (const d of snapshot.docs) {
        const data = d.data() as {
          ean?: string;
          price?: number;
          territory?: string;
          storeId?: string;
          storeName?: string;
          productName?: string;
          date?: string;
        };
        const ean = data.ean ?? '';
        const price = data.price ?? 0;
        if (!ean || price <= 0) continue;
        const entry = byEAN.get(ean) ?? { prices: [], latest: d };
        entry.prices.push(price);
        byEAN.set(ean, entry);
      }

      const anomalies: PriceAnomaly[] = [];
      for (const [ean, { prices, latest }] of byEAN) {
        if (prices.length < 2) continue;
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length;
        const sigma = Math.sqrt(variance);
        if (sigma === 0) continue;
        const currentPrice = prices[prices.length - 1];
        const deviation = Math.abs(currentPrice - mean) / sigma;
        if (deviation < this.WARNING_THRESHOLD_SIGMA) continue;
        const data = latest.data() as {
          territory?: string;
          storeId?: string;
          storeName?: string;
          productName?: string;
          date?: string;
        };
        anomalies.push({
          productEAN: ean,
          productName: data.productName ?? '',
          storeId: data.storeId ?? '',
          storeName: data.storeName ?? '',
          territory: data.territory ?? '',
          currentPrice,
          averagePrice: mean,
          deviation,
          deviationPercentage: ((currentPrice - mean) / mean) * 100,
          severity: deviation >= this.CRITICAL_THRESHOLD_SIGMA ? 'critical' : 'warning',
          detectedAt: new Date().toISOString(),
        });
      }
      return anomalies;
    } catch (error) {
      console.error('Failed to detect anomalies:', error);
      return [];
    }
  }

  /**
   * Detect sudden price increases (>10% in 7 days)
   */
  async detectSuddenIncreases(): Promise<PriceAnomaly[]> {
    // Compare current prices with prices from 7 days ago using Firestore snapshots.
    if (!db) return [];
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [recentSnap, olderSnap] = await Promise.all([
        getDocs(query(collection(db, 'price_observations'), where('date', '>=', sevenDaysAgo))),
        getDocs(query(
          collection(db, 'price_observations'),
          where('date', '>=', fourteenDaysAgo),
          where('date', '<', sevenDaysAgo)
        )),
      ]);

      type ObsData = {
        ean?: string; price?: number; territory?: string;
        storeId?: string; storeName?: string; productName?: string;
      };

      const avgByEAN = (docs: typeof recentSnap.docs): Map<string, { avg: number; data: ObsData }> => {
        const map = new Map<string, { sum: number; count: number; data: ObsData }>();
        for (const d of docs) {
          const obs = d.data() as ObsData;
          const ean = obs.ean ?? '';
          const price = obs.price ?? 0;
          if (!ean || price <= 0) continue;
          const entry = map.get(ean) ?? { sum: 0, count: 0, data: obs };
          entry.sum += price;
          entry.count += 1;
          map.set(ean, entry);
        }
        return new Map([...map.entries()].map(([k, v]) => [k, { avg: v.sum / v.count, data: v.data }]));
      };

      const recent = avgByEAN(recentSnap.docs);
      const older = avgByEAN(olderSnap.docs);
      const anomalies: PriceAnomaly[] = [];

      for (const [ean, { avg: currentAvg, data }] of recent) {
        const prev = older.get(ean);
        if (!prev || prev.avg <= 0) continue;
        const increasePct = ((currentAvg - prev.avg) / prev.avg) * 100;
        if (increasePct < this.SUDDEN_INCREASE_THRESHOLD) continue;
        anomalies.push({
          productEAN: ean,
          productName: data.productName ?? '',
          storeId: data.storeId ?? '',
          storeName: data.storeName ?? '',
          territory: data.territory ?? '',
          currentPrice: currentAvg,
          averagePrice: prev.avg,
          deviation: 0,
          deviationPercentage: increasePct,
          severity: increasePct >= 20 ? 'critical' : 'warning',
          detectedAt: new Date().toISOString(),
        });
      }
      return anomalies;
    } catch (error) {
      console.error('Failed to detect sudden increases:', error);
      return [];
    }
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
    
    await this.storeAlert(alert);
    
    return alert;
  }

  /**
   * Send alert to authorities (DGCCRF, local consumer protection)
   */
  async sendAlert(alert: InstitutionalAlert): Promise<void> {
    if (import.meta.env.DEV) console.log('Sending institutional alert:', alert);
    
    // Update alert status
    alert.sentAt = new Date().toISOString();
    alert.status = 'sent';
    await this.storeAlert(alert);
  }

  /**
   * Get pending alerts from Firestore (falls back to localStorage)
   */
  async getPendingAlerts(): Promise<InstitutionalAlert[]> {
    if (db) {
      try {
        const snapshot = await getDocs(
          query(collection(db, 'institutional_alerts'), where('status', '==', 'pending'))
        );
        return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InstitutionalAlert, 'id'>) }));
      } catch (error) {
        console.error('Failed to fetch pending alerts from Firestore:', error);
      }
    }
    const alerts = safeLocalStorage.getJSON<InstitutionalAlert[]>('institutional_alerts', []);
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
    const emails: Record<string, string[]> = {
      'GP': ['dgccrf-guadeloupe@example.com', 'consommation-gp@example.com'],
      'MQ': ['dgccrf-martinique@example.com', 'consommation-mq@example.com'],
      'GF': ['dgccrf-guyane@example.com'],
      'RE': ['dgccrf-reunion@example.com']
    };
    
    return emails[territory] || [];
  }

  private async storeAlert(alert: InstitutionalAlert): Promise<void> {
    // Persist to Firestore when available; always update localStorage as fallback.
    if (db) {
      try {
        await setDoc(doc(db, 'institutional_alerts', alert.id), alert);
      } catch (error) {
        console.error('Failed to store alert in Firestore:', error);
      }
    }
    const alerts = safeLocalStorage.getJSON<InstitutionalAlert[]>('institutional_alerts', []);
    const index = alerts.findIndex(a => a.id === alert.id);
    if (index >= 0) {
      alerts[index] = alert;
    } else {
      alerts.push(alert);
    }
    safeLocalStorage.setJSON('institutional_alerts', alerts);
  }
}

export const institutionalAlertService = new InstitutionalAlertService();
