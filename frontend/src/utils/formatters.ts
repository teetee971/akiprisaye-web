// @ts-nocheck
/**
 * formatters.ts — Formatting utilities for display
 * 
 * Purpose: Pure functions for formatting numbers, currencies, percentages
 * Used by: All components displaying prices, percentages, and numbers
 * 
 * Note: For territory-aware price formatting, use formatPriceForTerritory() from territories.ts
 * 
 * @module formatters
 */

/**
 * Format a number as currency (Euro by default)
 * 
 * ⚠️ NOTE: This function formats prices as EUR (€) only.
 * For territory-specific currency formatting (EUR, XPF, etc.), 
 * use formatPriceForTerritory() from src/constants/territories.ts
 * 
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency symbol (default: '€')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(99.99) // "99.99 €"
 * formatCurrency(99.99, 2, '$') // "99.99 $"
 */
export function formatCurrency(amount: number, decimals: number = 2, currency: string = '€'): string {
  return amount.toFixed(decimals) + ' ' + currency;
}

/**
 * Format a number as percentage
 * 
 * @param value - Value to format (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

/**
 * Format a price change with sign
 * 
 * @param change - Price change amount
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted change string with + or - sign
 */
export function formatPriceChange(change: number, decimals: number = 2): string {
  const sign = change >= 0 ? '+' : '';
  return sign + formatCurrency(change, decimals);
}

/**
 * Format a percentage change with sign
 * 
 * @param change - Percentage change value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage change string with + or - sign
 */
export function formatPercentageChange(change: number, decimals: number = 1): string {
  const sign = change >= 0 ? '+' : '';
  return sign + formatPercentage(change, decimals);
}

/**
 * Format a number with thousands separator
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string with separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format a distance in kilometers
 * 
 * @param distanceKm - Distance in kilometers
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number, decimals: number = 1): string {
  return distanceKm.toFixed(decimals) + ' km';
}

/**
 * Format a unit price
 * 
 * @param unitPrice - Unit price value
 * @param unit - Unit label (e.g., 'kg', 'L')
 * @returns Formatted unit price string
 */
export function formatUnitPrice(unitPrice: number, unit: string): string {
  return `${unitPrice.toFixed(2)} €/${unit}`;
}

/**
 * Truncate text with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a date in French locale
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param style - Date style: 'short', 'medium', 'long' (default: 'medium')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    short: { day: 'numeric', month: 'numeric', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
  }[style];
  
  return dateObj.toLocaleDateString('fr-FR', options);
}

/**
 * Format a time duration in hours
 * 
 * @param hours - Duration in hours
 * @returns Formatted duration string (e.g., "2h", "30 min")
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}j`;
}
