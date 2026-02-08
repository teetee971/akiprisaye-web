/**
 * Confidence Score Calculator
 * Calculates confidence scores for product prices based on multiple factors
 */

import { PriceSource } from '@prisma/client';

export interface ConfidenceFactors {
  recency: number;           // 0-30 points
  sourceReliability: number; // 0-30 points
  verificationCount: number; // 0-25 points
  consistency: number;       // 0-15 points
}

export interface ConfidenceScore {
  score: number;             // 0-100
  factors: ConfidenceFactors;
  label: string;
}

export interface PriceData {
  observedAt: Date;
  source: PriceSource;
  verificationCount: number;
  price: number;
  historicalPrices?: number[];
}

// Source reliability weights
const SOURCE_RELIABILITY: Record<PriceSource, number> = {
  OFFICIAL_API: 30,
  MANUAL_ENTRY: 25,
  OCR_TICKET: 20,
  OPEN_PRICES: 18,
  CROWDSOURCED: 15,
  SCRAPING_AUTHORIZED: 12,
};

/**
 * Calculate recency score based on observation date
 * Fresh data (< 7 days) gets full points
 * Decreases linearly up to 90 days
 */
function calculateRecencyScore(observedAt: Date): number {
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - observedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 0; // Future date is invalid
  if (daysDiff <= 7) return 30; // Fresh data
  if (daysDiff <= 30) return 25; // Recent
  if (daysDiff <= 60) return 15; // Moderate
  if (daysDiff <= 90) return 5;  // Stale
  return 0; // Outdated
}

/**
 * Calculate consistency score based on price history
 * Checks if current price aligns with historical trends
 */
function calculateConsistencyScore(price: number, historicalPrices?: number[]): number {
  if (!historicalPrices || historicalPrices.length === 0) {
    return 0; // No history to compare
  }
  
  const avg = historicalPrices.reduce((sum, p) => sum + p, 0) / historicalPrices.length;
  const deviation = Math.abs((price - avg) / avg);
  
  // Low deviation = high consistency
  if (deviation < 0.05) return 15; // Within 5%
  if (deviation < 0.15) return 10; // Within 15%
  if (deviation < 0.30) return 5;  // Within 30%
  return 0; // High deviation
}

/**
 * Calculate verification score based on number of confirmations
 * Each verification adds 5 points, max 25
 */
function calculateVerificationScore(verificationCount: number): number {
  return Math.min(verificationCount * 5, 25);
}

/**
 * Get confidence label based on total score
 */
function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'Très fiable';
  if (score >= 60) return 'Fiable';
  if (score >= 40) return 'Modéré';
  if (score >= 20) return 'À vérifier';
  return 'Non vérifié';
}

/**
 * Calculate overall confidence score for a price
 */
export function calculateConfidenceScore(priceData: PriceData): ConfidenceScore {
  const factors: ConfidenceFactors = {
    recency: calculateRecencyScore(priceData.observedAt),
    sourceReliability: SOURCE_RELIABILITY[priceData.source] || 0,
    verificationCount: calculateVerificationScore(priceData.verificationCount),
    consistency: calculateConsistencyScore(priceData.price, priceData.historicalPrices),
  };
  
  const total = Object.values(factors).reduce((sum, value) => sum + value, 0);
  const score = Math.min(total, 100);
  
  return {
    score,
    factors,
    label: getConfidenceLabel(score),
  };
}

/**
 * Batch calculate confidence scores for multiple prices
 */
export function calculateBulkConfidenceScores(prices: PriceData[]): ConfidenceScore[] {
  return prices.map(calculateConfidenceScore);
}
