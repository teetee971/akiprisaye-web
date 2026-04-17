/**
 * useProductUpdates Hook
 * React hook for managing product updates
 */

import { useState, useEffect, useCallback } from 'react';

export interface ProductUpdate {
  id: string;
  productId: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  source: string;
  autoApplied: boolean;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface UseProductUpdatesResult {
  updates: ProductUpdate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProductUpdates(productId: string): UseProductUpdatesResult {
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // NOTE: This endpoint is not yet implemented in the backend.
      // Backend needs to add routes at:
      // - GET /api/products/${productId}/updates
      // - POST /api/products/updates/${updateId}/approve
      // - POST /api/products/updates/${updateId}/reject
      // Current products API uses :ean identifier, consider alignment.
      const response = await fetch(`/api/products/${productId}/updates`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setUpdates(result.updates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product updates');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return {
    updates,
    loading,
    error,
    refetch: fetchUpdates,
  };
}

/**
 * usePendingProductUpdates Hook
 * Hook for fetching all pending product updates (admin use)
 */
interface UsePendingProductUpdatesResult {
  pendingUpdates: ProductUpdate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  approveUpdate: (updateId: string) => Promise<boolean>;
  rejectUpdate: (updateId: string) => Promise<boolean>;
}

export function usePendingProductUpdates(): UsePendingProductUpdatesResult {
  const [pendingUpdates, setPendingUpdates] = useState<ProductUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Note: This endpoint would need to be implemented in the backend
      const response = await fetch('/api/products/updates/pending');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setPendingUpdates(result.updates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending updates');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveUpdate = useCallback(
    async (updateId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/products/updates/${updateId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to approve update');
        }

        // Refetch pending updates
        await fetchPendingUpdates();
        return true;
      } catch (err) {
        console.error('Error approving update:', err);
        return false;
      }
    },
    [fetchPendingUpdates]
  );

  const rejectUpdate = useCallback(
    async (updateId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/products/updates/${updateId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to reject update');
        }

        // Refetch pending updates
        await fetchPendingUpdates();
        return true;
      } catch (err) {
        console.error('Error rejecting update:', err);
        return false;
      }
    },
    [fetchPendingUpdates]
  );

  useEffect(() => {
    fetchPendingUpdates();
  }, [fetchPendingUpdates]);

  return {
    pendingUpdates,
    loading,
    error,
    refetch: fetchPendingUpdates,
    approveUpdate,
    rejectUpdate,
  };
}
