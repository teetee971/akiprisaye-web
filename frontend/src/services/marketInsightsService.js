import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Get latest market insights
 * @returns {Promise<Object|null>} Latest market insights data
 */
export const getMarketInsights = async () => {
  if (!db) return null;
  try {
    const ref = doc(db, 'market_insights', 'latest');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error('Error fetching market insights:', error);
    return null;
  }
};

/**
 * Get historical market insights
 * @param {number} days - Number of days to fetch
 * @returns {Promise<Array>} Historical insights data
 */
export const getInsightsHistory = async (days = 30) => {
  if (!db) return [];
  try {
    const ref = collection(db, 'market_insights');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(days));
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .filter((doc) => doc.id !== 'latest') // Exclude 'latest' doc
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  } catch (error) {
    console.error('Error fetching insights history:', error);
    return [];
  }
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
export const formatPercent = (value) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

/**
 * Get alert color based on level
 * @param {string} level - Alert level (critical, moderate, good)
 * @returns {string} Tailwind color class
 */
export const getAlertColor = (level) => {
  switch (level) {
    case 'critical':
      return 'text-red-400 border-red-600 bg-red-900/20';
    case 'moderate':
      return 'text-amber-400 border-amber-600 bg-amber-900/20';
    case 'good':
      return 'text-green-400 border-green-600 bg-green-900/20';
    default:
      return 'text-slate-400 border-slate-600 bg-slate-900/20';
  }
};

/**
 * Get category color based on difference
 * @param {number} diff - Price difference percentage
 * @returns {string} Chart color
 */
export const getCategoryColor = (diff) => {
  if (diff > 20) return '#ef4444'; // red-500
  if (diff > 10) return '#f59e0b'; // amber-500
  return '#10b981'; // green-500
};
