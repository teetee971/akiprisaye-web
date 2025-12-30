/**
 * Type definitions for Real Price Alert System
 * 
 * Ensures:
 * - No predictive data
 * - Only historical, observable information
 * - Full data source transparency
 * - Legal compliance with neutral language
 */

export type AlertType = 'price_drop' | 'price_increase' | 'shrinkflation';

export type DataSource = 
  | 'official_site'      // Official government/institutional data
  | 'public_listing'     // Public price listings (e.g., e-commerce)
  | 'user_report'        // Citizen-reported data
  | 'observateur';       // Price observatory data

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type Territory = 
  | 'GP'  // Guadeloupe
  | 'MQ'  // Martinique
  | 'GF'  // Guyane
  | 'RE'  // La Réunion
  | 'YT'  // Mayotte
  | 'PM'  // Saint-Pierre-et-Miquelon
  | 'BL'  // Saint-Barthélemy
  | 'MF'  // Saint-Martin
  | 'WF'  // Wallis-et-Futuna
  | 'PF'  // Polynésie française
  | 'NC'  // Nouvelle-Calédonie
  | 'TF'; // Terres australes et antarctiques françaises

/**
 * Historical price point - REAL data only
 */
export interface PricePoint {
  price: number;
  quantity?: number;        // For shrinkflation detection
  unit?: string;            // e.g., 'kg', 'L', 'unit'
  date: string;             // ISO 8601 date
  source: DataSource;
  confidence: ConfidenceLevel;
  store?: string;
  territory: Territory;
  verified?: boolean;       // Has this been verified by multiple sources?
}

/**
 * Product tracking configuration
 */
export interface TrackedProduct {
  id: string;               // Product ID or EAN
  userId: string;           // User tracking this product
  productName: string;
  category?: string;
  store?: string;
  territory: Territory;
  lastKnownPrice: number;
  lastKnownQuantity?: number;
  lastObservationDate: string;
  lastObservationSource: DataSource;
  trackingSince: string;    // When user started tracking
  alertsEnabled: boolean;
  alertPreferences: AlertPreferences;
}

/**
 * User alert preferences
 */
export interface AlertPreferences {
  priceDropEnabled: boolean;
  priceIncreaseEnabled: boolean;
  shrinkflationEnabled: boolean;
  
  // Thresholds for price increase alerts
  increasePercentageThreshold: number;  // e.g., 5 for 5%
  increaseAbsoluteThreshold: number;    // e.g., 0.50 for 0.50€
  
  // Notification channels
  inAppNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Price alert - triggered when conditions are met
 */
export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  alertType: AlertType;
  
  // Historical comparison (REAL data only)
  previousPrice: number;
  currentPrice: number;
  previousQuantity?: number;
  currentQuantity?: number;
  
  // Changes
  absoluteChange: number;
  percentageChange: number;
  
  // Context
  store?: string;
  territory: Territory;
  category?: string;
  
  // Data transparency
  previousDataSource: DataSource;
  currentDataSource: DataSource;
  previousObservationDate: string;
  currentObservationDate: string;
  confidence: ConfidenceLevel;
  
  // Alert metadata
  triggeredAt: string;
  acknowledged: boolean;
  severity: 'high' | 'medium' | 'low';
  
  // For shrinkflation
  shrinkflationDetails?: {
    previousQuantity: number;
    currentQuantity: number;
    quantityReduction: number;
    quantityReductionPercentage: number;
    pricePerUnitBefore: number;
    pricePerUnitAfter: number;
    effectivePriceIncrease: number;
  };
}

/**
 * Alert notification
 */
export interface AlertNotification {
  id: string;
  alertId: string;
  userId: string;
  channel: 'in_app' | 'email' | 'push';
  sentAt: string;
  read: boolean;
  dismissed: boolean;
}

/**
 * Alert filter options for UI
 */
export interface AlertFilter {
  territory?: Territory;
  category?: string;
  alertType?: AlertType;
  severity?: 'high' | 'medium' | 'low';
  dateFrom?: string;
  dateTo?: string;
  acknowledged?: boolean;
}

/**
 * Alert summary for dashboard
 */
export interface AlertSummary {
  total: number;
  unacknowledged: number;
  byType: {
    price_drop: number;
    price_increase: number;
    shrinkflation: number;
  };
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
  byTerritory: Partial<Record<Territory, number>>;
}
