/**
 * useProductUpdates Hook
 * 
 * Update workflow management for product data
 */

import { useState, useEffect } from 'react';

export interface ProductUpdate {
  id: string;
  productId: string;
  submittedBy: string;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  isTrustedField: boolean;
  requiresReview: boolean;
  status: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  reviewNote?: string;
  proofUrl?: string;
  confidence: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseProductUpdatesResult {
  updates: ProductUpdate[];
  isLoading: boolean;
  error: string | null;
  submitUpdate: (data: ProductUpdateData) => Promise<SubmissionResult>;
  refetch: () => Promise<void>;
}

export interface ProductUpdateData {
  productId: string;
  submittedBy: string;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  proofUrl?: string;
  confidence?: number;
}

export interface SubmissionResult {
  success: boolean;
  updateId?: string;
  autoApplied?: boolean;
  requiresReview?: boolean;
  error?: string;
}

export function useProductUpdates(productId?: string): UseProductUpdatesResult {
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = async () => {
    if (!productId) {
      setUpdates([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/product-updates/${productId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setUpdates(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch product updates');
      }
    } catch (err) {
      console.error('Error fetching product updates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const submitUpdate = async (data: ProductUpdateData): Promise<SubmissionResult> => {
    setError(null);

    try {
      const response = await fetch('/api/product-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to submit update');
        return result;
      }

      // Refetch updates after successful submission
      if (result.success && productId) {
        await fetchUpdates();
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error submitting update:', err);
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  useEffect(() => {
    if (productId) {
      fetchUpdates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return {
    updates,
    isLoading,
    error,
    submitUpdate,
    refetch: fetchUpdates,
  };
}
