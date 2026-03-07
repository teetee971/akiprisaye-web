 
/**
 * useContribution Hook
 * 
 * Custom hook for managing citizen contributions.
 * Provides functions to submit and retrieve contributions.
 */

import { useState } from 'react';
import { 
  submitPhotoContribution, 
  submitPriceObservation,
  submitMissingProduct,
  type PriceObservation,
  type MissingProductReport,
} from '../services/contributionService';
import type { PhotoContribution } from '../components/PhotoContributionModal';
import type { ContributionData } from '../types/comparatorCommon';

interface UseContributionReturn {
  submitContribution: (data: ContributionData) => Promise<string>;
  submitPhoto: (contribution: PhotoContribution, userId?: string) => Promise<string>;
  submitPrice: (observation: PriceObservation, userId?: string) => Promise<string>;
  submitMissing: (report: MissingProductReport, userId?: string) => Promise<string>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

/**
 * Hook for managing contributions
 * 
 * @param comparatorType - Type of comparator (for generic contributions)
 * @returns Contribution management functions and state
 */
export function useContribution(comparatorType?: string): UseContributionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Submit a generic contribution
   * 
   * @deprecated This is a placeholder for future unified contribution API.
   * For now, use the specific methods: submitPhoto, submitPrice, submitMissing
   */
  const submitContribution = async (data: ContributionData): Promise<string> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // For now, route to appropriate service based on data structure
      // In the future, we might have a unified contribution API
      
      // This is a placeholder - actual implementation would depend on 
      // how generic contributions are stored
      throw new Error('Generic contribution submission not yet implemented. Use submitPhoto, submitPrice, or submitMissing.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit a photo contribution
   */
  const submitPhoto = async (
    contribution: PhotoContribution,
    userId?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const id = await submitPhotoContribution(contribution, userId);
      setSuccess(true);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit a price observation
   */
  const submitPrice = async (
    observation: PriceObservation,
    userId?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const id = await submitPriceObservation(observation, userId);
      setSuccess(true);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit a missing product report
   */
  const submitMissing = async (
    report: MissingProductReport,
    userId?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const id = await submitMissingProduct(report, userId);
      setSuccess(true);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset hook state
   */
  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return {
    submitContribution,
    submitPhoto,
    submitPrice,
    submitMissing,
    loading,
    error,
    success,
    reset,
  };
}
