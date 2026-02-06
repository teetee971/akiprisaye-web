/**
 * Universal Price Calculator
 * 
 * Reusable price calculation utilities for all comparators.
 * Provides functions for price analysis, comparisons, and formatting.
 */

import type { PriceComparison, Savings } from '../types/comparatorCommon';

/**
 * Calculate total cost including taxes and fees
 * 
 * @param basePrice - Base price before taxes and fees
 * @param taxes - Array of tax amounts
 * @param fees - Array of fee amounts
 * @returns Total cost
 */
export function calculateTotalCost(
  basePrice: number,
  taxes: number[],
  fees: number[]
): number {
  const totalTaxes = taxes.reduce((sum, tax) => sum + tax, 0);
  const totalFees = fees.reduce((sum, fee) => sum + fee, 0);
  return basePrice + totalTaxes + totalFees;
}

/**
 * Calculate percentage difference between two prices
 * 
 * @param price1 - First price
 * @param price2 - Second price
 * @returns Percentage difference ((price2 - price1) / price1 * 100)
 */
export function calculatePercentageDifference(
  price1: number,
  price2: number
): number {
  if (price1 === 0) return 0;
  return ((price2 - price1) / price1) * 100;
}

/**
 * Calculate savings when comparing prices
 * 
 * @param currentPrice - Current or reference price
 * @param bestPrice - Best available price
 * @returns Object with absolute and percentage savings
 */
export function calculateSavings(
  currentPrice: number,
  bestPrice: number
): Savings {
  const absolute = currentPrice - bestPrice;
  const percentage = calculatePercentageDifference(bestPrice, currentPrice);
  
  return {
    absolute: Math.max(0, absolute),
    percentage: Math.max(0, percentage),
  };
}

/**
 * Format price as currency string
 * 
 * @param price - Price to format
 * @param currency - Currency code (default: 'EUR')
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Calculate price per unit
 * 
 * @param totalPrice - Total price
 * @param quantity - Quantity
 * @param unit - Unit of measurement
 * @returns Price per unit
 */
export function calculatePricePerUnit(
  totalPrice: number,
  quantity: number,
  unit: string = '_unit'
): number {
  if (quantity === 0) return 0;
  return totalPrice / quantity;
}

/**
 * Format price per unit
 * 
 * @param pricePerUnit - Price per unit
 * @param unit - Unit of measurement
 * @param currency - Currency code
 * @returns Formatted string (e.g., "2,50 €/kg")
 */
export function formatPricePerUnit(
  pricePerUnit: number,
  unit: string,
  currency: string = 'EUR'
): string {
  const formattedPrice = formatPrice(pricePerUnit, currency);
  return `${formattedPrice}/${unit}`;
}

/**
 * Compare multiple prices and calculate statistics
 * 
 * @param prices - Array of prices to compare
 * @returns Price comparison statistics
 */
export function comparePrices(prices: number[]): PriceComparison {
  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      range: 0,
      rangePercentage: 0,
    };
  }

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const min = sortedPrices[0];
  const max = sortedPrices[sortedPrices.length - 1];
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const average = sum / prices.length;
  
  // Calculate median
  const middleIndex = Math.floor(sortedPrices.length / 2);
  const median =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[middleIndex - 1] + sortedPrices[middleIndex]) / 2
      : sortedPrices[middleIndex];
  
  const range = max - min;
  const rangePercentage = min > 0 ? (range / min) * 100 : 0;

  return {
    min,
    max,
    average,
    median,
    range,
    rangePercentage,
  };
}

/**
 * Calculate price category based on position in range
 * 
 * @param price - Price to categorize
 * @param comparison - Price comparison data
 * @returns Category string
 */
export function getPriceCategory(
  price: number,
  comparison: PriceComparison
): 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive' {
  const { min, max, average } = comparison;
  
  if (price === min) return 'cheapest';
  if (price === max) return 'most_expensive';
  
  const threshold = (max - min) * 0.1; // 10% threshold
  
  if (price < average - threshold) return 'below_average';
  if (price > average + threshold) return 'above_average';
  
  return 'average';
}

/**
 * Calculate discount percentage
 * 
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice === 0) return 0;
  return Math.abs(calculatePercentageDifference(originalPrice, discountedPrice));
}

/**
 * Apply discount to price
 * 
 * @param price - Original price
 * @param discountPercentage - Discount percentage (0-100)
 * @returns Discounted price
 */
export function applyDiscount(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100);
}

/**
 * Calculate tax amount from percentage
 * 
 * @param price - Base price
 * @param taxPercentage - Tax percentage (e.g., 20 for 20%)
 * @returns Tax amount
 */
export function calculateTaxAmount(price: number, taxPercentage: number): number {
  return (price * taxPercentage) / 100;
}

/**
 * Calculate price including tax
 * 
 * @param priceExcludingTax - Price without tax
 * @param taxPercentage - Tax percentage
 * @returns Price including tax
 */
export function calculatePriceIncludingTax(
  priceExcludingTax: number,
  taxPercentage: number
): number {
  return priceExcludingTax * (1 + taxPercentage / 100);
}

/**
 * Calculate price excluding tax
 * 
 * @param priceIncludingTax - Price with tax
 * @param taxPercentage - Tax percentage
 * @returns Price excluding tax
 */
export function calculatePriceExcludingTax(
  priceIncludingTax: number,
  taxPercentage: number
): number {
  return priceIncludingTax / (1 + taxPercentage / 100);
}

/**
 * Round price to nearest cent
 * 
 * @param price - Price to round
 * @returns Rounded price
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Check if price is valid
 * 
 * @param price - Price to validate
 * @returns true if price is valid (finite, positive number)
 */
export function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 0;
}
