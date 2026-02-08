/**
 * usePriceSubmission Hook
 * React hook for submitting new prices
 */

import { useState, useCallback } from 'react';

export type PriceSource =
  | 'OCR_TICKET'
  | 'OFFICIAL_API'
  | 'OPEN_PRICES'
  | 'MANUAL_ENTRY'
  | 'CROWDSOURCED'
  | 'SCRAPING_AUTHORIZED';

export interface SubmitPriceRequest {
  productId: string;
  storeId: string;
  price: number;
  observedAt: string;
  source: PriceSource;
  reportedBy?: string;
  proof?: {
    type: 'receipt_image' | 'screenshot' | 'none';
    url?: string;
  };
}

export interface SubmitPriceResponse {
  id: string;
  status: 'accepted' | 'pending_review' | 'rejected';
  confidenceScore: number;
  message: string;
  duplicateOf?: string;
}

interface UsePriceSubmissionResult {
  submitPrice: (request: SubmitPriceRequest) => Promise<SubmitPriceResponse | null>;
  loading: boolean;
  error: string | null;
  success: boolean;
  response: SubmitPriceResponse | null;
  reset: () => void;
}

export function usePriceSubmission(): UsePriceSubmissionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState<SubmitPriceResponse | null>(null);

  const submitPrice = useCallback(
    async (request: SubmitPriceRequest): Promise<SubmitPriceResponse | null> => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setResponse(null);

      try {
        const res = await fetch('/api/prices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to submit price');
        }

        const result = await res.json();
        setSuccess(true);
        setResponse(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setResponse(null);
  }, []);

  return {
    submitPrice,
    loading,
    error,
    success,
    response,
    reset,
  };
}
