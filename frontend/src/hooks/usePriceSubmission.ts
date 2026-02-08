/**
 * usePriceSubmission Hook
 * 
 * Submit prices with error handling
 */

import { useState } from 'react';

type PriceSource = 'USER_SUBMISSION' | 'RECEIPT_SCAN' | 'STORE_OFFICIAL' | 'API_INTEGRATION' | 'COMMUNITY_VERIFIED' | 'ADMIN_OVERRIDE';

export interface PriceSubmissionData {
  productId: string;
  storeId: string;
  price: number;
  currency?: string;
  source: PriceSource;
  submittedBy?: string;
  proofUrl?: string;
}

export interface SubmissionResult {
  success: boolean;
  priceId?: string;
  confidenceScore?: number;
  hasAnomalies?: boolean;
  anomalies?: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  error?: string;
  isDuplicate?: boolean;
  existingPriceId?: string;
}

interface UsePriceSubmissionResult {
  submitPrice: (data: PriceSubmissionData) => Promise<SubmissionResult>;
  isSubmitting: boolean;
  lastResult: SubmissionResult | null;
  error: string | null;
}

export function usePriceSubmission(): UsePriceSubmissionResult {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitPrice = async (data: PriceSubmissionData): Promise<SubmissionResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to submit price');
        setLastResult(result);
        return result;
      }

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error submitting price:', err);
      setError(errorMessage);
      
      const errorResult: SubmissionResult = {
        success: false,
        error: errorMessage,
      };
      setLastResult(errorResult);
      
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPrice,
    isSubmitting,
    lastResult,
    error,
  };
}
