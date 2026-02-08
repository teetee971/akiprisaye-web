/**
 * Confidence Calculator Service
 * 
 * Calculates confidence scores for product prices based on 4 factors:
 * - Recency (0-30 points): How fresh is the price data
 * - Source Reliability (0-30 points): How trustworthy is the source
 * - Verification Count (0-25 points): How many confirmations
 * - Consistency (0-15 points): Historical price coherence
 */

import { PriceSource } from '@prisma/client';

export interface ConfidenceFactors {
  recency: number; // 0-30
  sourceReliability: number; // 0-30
  verificationCount: number; // 0-25
  consistency: number; // 0-15
}

export interface ConfidenceResult extends ConfidenceFactors {
  total: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * Calculate recency score based on age of price data
 * @param createdAt - Date when price was submitted
 * @returns Score from 0-30
 */
export function calculateRecencyScore(createdAt: Date): number {
  const now = new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 1) return 30; // Less than 1 day: perfect
  if (ageInDays < 3) return 25; // 1-3 days: excellent
  if (ageInDays < 7) return 20; // 3-7 days: good
  if (ageInDays < 14) return 15; // 1-2 weeks: acceptable
  if (ageInDays < 30) return 10; // 2-4 weeks: aging
  return 5; // Over 30 days: stale
}

/**
 * Calculate source reliability score
 * @param source - Source of the price data
 * @returns Score from 0-30
 */
export function calculateSourceReliabilityScore(source: PriceSource): number {
  const sourceScores: Record<PriceSource, number> = {
    ADMIN_OVERRIDE: 30, // Highest trust
    STORE_OFFICIAL: 28, // Store's official data
    API_INTEGRATION: 26, // API from trusted partner
    COMMUNITY_VERIFIED: 22, // Community verified
    RECEIPT_SCAN: 18, // OCR from receipt
    USER_SUBMISSION: 12, // User submitted without proof
  };

  return sourceScores[source] || 10;
}

/**
 * Calculate verification score based on number of confirmations
 * @param confirmationCount - Number of users who confirmed this price
 * @param disputeCount - Number of users who disputed this price
 * @returns Score from 0-25
 */
export function calculateVerificationScore(
  confirmationCount: number,
  disputeCount: number
): number {
  const netConfirmations = Math.max(0, confirmationCount - disputeCount * 2);

  if (netConfirmations >= 10) return 25; // 10+ confirmations
  if (netConfirmations >= 5) return 20; // 5-9 confirmations
  if (netConfirmations >= 3) return 15; // 3-4 confirmations
  if (netConfirmations >= 1) return 10; // 1-2 confirmations
  if (disputeCount > confirmationCount) return 0; // More disputes than confirmations
  return 5; // No verifications yet
}

/**
 * Calculate consistency score based on historical price data
 * @param currentPrice - Current price being scored
 * @param historicalPrices - Array of recent prices for same product/store
 * @returns Score from 0-15
 */
export function calculateConsistencyScore(
  currentPrice: number,
  historicalPrices: number[]
): number {
  if (historicalPrices.length === 0) return 8; // No history, neutral score

  const avg = historicalPrices.reduce((sum, p) => sum + p, 0) / historicalPrices.length;
  const deviation = Math.abs(currentPrice - avg) / avg;

  if (deviation < 0.05) return 15; // Within 5%: excellent
  if (deviation < 0.10) return 12; // Within 10%: good
  if (deviation < 0.20) return 9; // Within 20%: acceptable
  if (deviation < 0.30) return 6; // Within 30%: suspicious
  if (deviation < 0.50) return 3; // Within 50%: very suspicious
  return 0; // Over 50% deviation: inconsistent
}

/**
 * Calculate overall confidence score
 * @param factors - Individual confidence factors
 * @returns Complete confidence result with grade
 */
export function calculateConfidence(factors: ConfidenceFactors): ConfidenceResult {
  const total = factors.recency + 
                factors.sourceReliability + 
                factors.verificationCount + 
                factors.consistency;

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (total >= 85) grade = 'A'; // Excellent
  else if (total >= 70) grade = 'B'; // Good
  else if (total >= 55) grade = 'C'; // Acceptable
  else if (total >= 40) grade = 'D'; // Poor
  else grade = 'F'; // Untrustworthy

  return {
    ...factors,
    total,
    grade
  };
}

/**
 * Get confidence for a price with all factors
 */
export interface PriceConfidenceInput {
  createdAt: Date;
  source: PriceSource;
  confirmationCount: number;
  disputeCount: number;
  currentPrice: number;
  historicalPrices: number[];
}

export function getFullConfidenceScore(input: PriceConfidenceInput): ConfidenceResult {
  const factors: ConfidenceFactors = {
    recency: calculateRecencyScore(input.createdAt),
    sourceReliability: calculateSourceReliabilityScore(input.source),
    verificationCount: calculateVerificationScore(
      input.confirmationCount,
      input.disputeCount
    ),
    consistency: calculateConsistencyScore(input.currentPrice, input.historicalPrices),
  };

  return calculateConfidence(factors);
}
