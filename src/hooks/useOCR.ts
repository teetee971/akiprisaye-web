/**
 * useOCR Hook
 * 
 * Custom hook for OCR text extraction and processing.
 * Provides functions to process images and documents with OCR.
 */

import { useState, useCallback } from 'react';
import {
  processDocument,
  validateOCRResult,
  type DocumentType,
} from '../services/comparatorOcrService';
import type { OCRResult } from '../types/comparatorCommon';

interface UseOCRReturn {
  processFile: (file: File, documentType: DocumentType, language?: string) => Promise<OCRResult>;
  processing: boolean;
  result: OCRResult | null;
  error: string | null;
  progress: number;
  reset: () => void;
}

/**
 * Hook for OCR text extraction
 * 
 * @returns OCR processing functions and state
 */
export function useOCR(): UseOCRReturn {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Process a file with OCR
   */
  const processFile = useCallback(
    async (
      file: File,
      documentType: DocumentType,
      language: string = 'fra'
    ): Promise<OCRResult> => {
      setProcessing(true);
      setError(null);
      setProgress(0);
      setResult(null);

      try {
        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          throw new Error('Type de fichier non supporté. Utilisez une image ou un PDF.');
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error('Fichier trop volumineux. Taille maximale : 10 Mo.');
        }

        setProgress(10);

        // Process document
        const ocrResult = await processDocument(file, documentType, language);

        setProgress(90);

        // Validate result
        if (!validateOCRResult(ocrResult, 50)) {
          throw new Error(
            'La qualité de l\'extraction est trop faible. Veuillez utiliser une image de meilleure qualité.'
          );
        }

        setProgress(100);
        setResult(ocrResult);

        return ocrResult;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erreur lors du traitement du document';
        setError(message);
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setProcessing(false);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    processFile,
    processing,
    result,
    error,
    progress,
    reset,
  };
}
