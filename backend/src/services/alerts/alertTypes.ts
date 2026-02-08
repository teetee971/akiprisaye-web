/**
 * Alert Types and Interfaces
 * Defines types for the price alert system
 */

import { AlertType as PrismaAlertType } from '@prisma/client';

export type AlertType = PrismaAlertType;

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  
  alertType: AlertType;
  targetPrice?: number;
  percentageThreshold?: number;
  
  storeIds?: string[];
  territory?: string;
  chains?: string[];
  
  notifyEmail: boolean;
  notifyPush: boolean;
  notifySms: boolean;
  
  isActive: boolean;
  triggeredCount: number;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CreateAlertInput {
  userId: string;
  productId: string;
  alertType: AlertType;
  targetPrice?: number;
  percentageThreshold?: number;
  storeIds?: string[];
  territory?: string;
  chains?: string[];
  notifyEmail?: boolean;
  notifyPush?: boolean;
  notifySms?: boolean;
  expiresAt?: Date;
}

export interface UpdateAlertInput {
  alertType?: AlertType;
  targetPrice?: number;
  percentageThreshold?: number;
  storeIds?: string[];
  territory?: string;
  chains?: string[];
  notifyEmail?: boolean;
  notifyPush?: boolean;
  notifySms?: boolean;
  isActive?: boolean;
  expiresAt?: Date;
}

export interface TriggeredAlert {
  alert: PriceAlert;
  trigger: {
    reason: string;
    oldPrice?: number;
    newPrice: number;
    savings?: number;
    savingsPercent?: number;
    storeName: string;
    storeId: string;
    productName: string;
  };
}

export interface PriceUpdate {
  productId: string;
  storeId: string;
  storeName: string;
  newPrice: number;
  oldPrice?: number;
  territory?: string;
  chain?: string;
  isPromotion?: boolean;
  inStock?: boolean;
}

export interface AlertCheckResult {
  totalChecked: number;
  triggeredCount: number;
  failedCount: number;
  triggeredAlerts: TriggeredAlert[];
  errors: Array<{ alertId: string; error: string }>;
}
