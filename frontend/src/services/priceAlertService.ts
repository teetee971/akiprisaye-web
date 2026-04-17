import { db } from '../firebase_config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// On définit strictement les types autorisés
export type AlertSeverity = 'low' | 'medium' | 'high';

export interface PriceAlert {
  productId: string;
  userId: string;
  productName: string;
  targetPrice: number;
  active: boolean;
  createdAt: number;
}

export const DEFAULT_ALERT_PREFERENCES = {
  priceDrop: true,
  priceIncrease: false,
  threshold: 0.05,
};

export const detectPriceDrop = (
  oldPrice: number,
  newPrice: number,
  prefs = DEFAULT_ALERT_PREFERENCES
) => {
  const ratio = (oldPrice - newPrice) / oldPrice;
  if (newPrice < oldPrice && ratio >= (prefs.threshold || 0.05)) {
    return {
      percentageChange: -(ratio * 100),
      severity: (ratio > 0.15 ? 'high' : 'medium') as AlertSeverity,
    };
  }
  return null;
};

export const detectPriceIncrease = (
  oldPrice: number,
  newPrice: number,
  prefs = DEFAULT_ALERT_PREFERENCES
) => {
  const ratio = (newPrice - oldPrice) / oldPrice;
  if (newPrice > oldPrice && ratio >= (prefs.threshold || 0.05)) {
    return {
      percentageChange: ratio * 100,
      severity: (ratio > 0.15 ? 'high' : 'medium') as AlertSeverity,
    };
  }
  return null;
};

export const priceAlertService = {
  async createAlert(alert: Omit<PriceAlert, 'createdAt' | 'active'>) {
    // On ajoute 'as any' à db pour calmer l'erreur de nullité de Firestore
    return await addDoc(collection(db as any, 'price_alerts'), {
      ...alert,
      active: true,
      createdAt: Date.now(),
    });
  },

  async checkIfFollowing(userId: string, productId: string): Promise<boolean> {
    const q = query(
      collection(db as any, 'price_alerts'),
      where('userId', '==', userId),
      where('productId', '==', productId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },
};
