// src/hooks/useESLScanner.ts
// Hook unifié pour lire les Étiquettes Électroniques de Gondole (EEG/ESL/EPL)
//
// Combine trois méthodes de lecture complémentaires :
//   1. NFC          → chip NFC dans l'étiquette (SES-imagotag, Hanshow, Pricer)
//   2. OCR Caméra   → photo de l'afficheur e-ink → extraction prix + EAN
//   3. Code-barres  → EAN visible sur l'étiquette → BarcodeDetector Web API
//
// L'ESL retourne toujours : { ean, price, productName, method }
// L'EAN est ensuite utilisé par useProductLivePrices pour comparer les prix DOM-TOM.

import { useState, useCallback, useRef } from 'react';
import { useNFCReader } from './useNFCReader';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ESLReadMethod = 'nfc' | 'ocr' | 'barcode' | 'manual';
export type ESLScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export interface ESLReadResult {
  /** EAN-8 ou EAN-13 extrait */
  ean: string | null;
  /** Prix affiché sur l'étiquette */
  price: number | null;
  /** Devise (EUR par défaut) */
  currency: string;
  /** Nom produit si disponible */
  productName: string | null;
  /** Méthode de lecture utilisée */
  method: ESLReadMethod;
  /** Confiance 0–1 */
  confidence: number;
  /** ISO timestamp */
  readAt: string;
  /** Marque ESL détectée (NFC uniquement) */
  eslBrand: string | null;
}

export interface ESLScannerState {
  status: ESLScanStatus;
  result: ESLReadResult | null;
  error: string | null;
  activeMethod: ESLReadMethod | null;
}

// ─── OCR price extraction ────────────────────────────────────────────────────

const PRICE_PATTERNS = [
  // 1,49 € ou 1.49€ ou EUR 1.49
  /(\d{1,4})[.,](\d{2})\s*€/,
  /€\s*(\d{1,4})[.,](\d{2})/,
  /EUR\s*(\d{1,4})[.,](\d{2})/i,
  // Prix gros format ESL : "1 49" (séparé par espace)
  /\b(\d{1,4})\s+(\d{2})\b/,
];

const EAN_PATTERN = /\b(\d{8}|\d{13})\b/;

function extractFromOCRText(text: string): Pick<ESLReadResult, 'ean' | 'price' | 'productName' | 'confidence'> {
  let price: number | null = null;
  let ean: string | null = null;
  let confidence = 0.5;

  // Try each price pattern
  for (const pattern of PRICE_PATTERNS) {
    const m = pattern.exec(text);
    if (m) {
      price = parseFloat(`${m[1]}.${m[2]}`);
      confidence = Math.min(confidence + 0.2, 1.0);
      break;
    }
  }

  // Extract EAN
  const eanMatch = EAN_PATTERN.exec(text);
  if (eanMatch) {
    ean = eanMatch[1];
    confidence = Math.min(confidence + 0.3, 1.0);
  }

  // Product name: text before price line (heuristic — first non-numeric line)
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const nameLine = lines.find((l) => l.length > 3 && !/^\d/.test(l) && !/^[€$£]/.test(l));

  return { ean, price, productName: nameLine ?? null, confidence };
}

/**
 * Captures a single frame from the camera and runs OCR via canvas + Tesseract
 * (lazy-loaded to keep initial bundle small).
 */
async function captureAndOCR(
  videoEl: HTMLVideoElement,
  signal?: AbortSignal,
): Promise<Pick<ESLReadResult, 'ean' | 'price' | 'productName' | 'confidence'>> {
  // Draw video frame to canvas
  const canvas = document.createElement('canvas');
  canvas.width  = videoEl.videoWidth  || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponible');
  ctx.drawImage(videoEl, 0, 0);

  // Convert to blob for OCR
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas vide'))), 'image/png'),
  );
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Lazy-load Tesseract.js only when needed
  const { createWorker } = await import(/* webpackChunkName: "tesseract" */ 'tesseract.js');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const worker = await createWorker('fra+eng');
  try {
    const { data } = await worker.recognize(blob);
    return extractFromOCRText(data.text ?? '');
  } finally {
    await worker.terminate();
  }
}

// ─── Barcode detection via BarcodeDetector Web API ────────────────────────────

async function detectBarcodeFromVideo(
  videoEl: HTMLVideoElement,
): Promise<Pick<ESLReadResult, 'ean' | 'price' | 'productName' | 'confidence'> | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BD = (window as any).BarcodeDetector;
  if (!BD) return null;

  try {
    const detector = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'qr_code', 'data_matrix'] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const barcodes: Array<{ rawValue?: string; format?: string }> = await detector.detect(videoEl);
    for (const barcode of barcodes) {
      const val = String(barcode.rawValue ?? '');
      if (/^\d{8}$|^\d{13}$/.test(val)) {
        return { ean: val, price: null, productName: null, confidence: 0.98 };
      }
      const urlEan = /(?:ean|gtin|code|barcode)[=/](\d{8}|\d{13})/i.exec(val);
      if (urlEan) {
        return { ean: urlEan[1], price: null, productName: null, confidence: 0.90 };
      }
    }
  } catch {
    // BarcodeDetector unavailable or failed
  }
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook unifié de lecture ESL (EEG/EPL).
 *
 * Fournit trois méthodes de scan :
 *   scanNFC()      → démarre l'écoute NFC (tag chip dans l'étiquette)
 *   scanOCR(video) → capture + OCR d'une image de l'étiquette
 *   scanBarcode(v) → détection code-barres via BarcodeDetector
 *   setManual(...)→ entrée manuelle EAN + prix
 *
 * Usage :
 *   const { state, scanNFC, scanOCR, scanBarcode, setManual, reset } = useESLScanner()
 */
export function useESLScanner() {
  const [state, setState] = useState<ESLScannerState>({
    status:       'idle',
    result:       null,
    error:        null,
    activeMethod: null,
  });

  const abortRef  = useRef<AbortController | null>(null);
  const nfcReader = useNFCReader();

  // ── NFC scan ──────────────────────────────────────────────────────────────

  const scanNFC = useCallback(async () => {
    setState({ status: 'scanning', result: null, error: null, activeMethod: 'nfc' });
    await nfcReader.startScan();
  }, [nfcReader]);

  // Sync NFC reader result into ESL state
  const nfcResult = nfcReader.state.result;
  const nfcError  = nfcReader.state.error;

  if (nfcResult && state.activeMethod === 'nfc' && state.status === 'scanning') {
    const eslResult: ESLReadResult = {
      ean:         nfcResult.ean,
      price:       nfcResult.price,
      currency:    'EUR',
      productName: nfcResult.productName,
      method:      'nfc',
      confidence:  nfcResult.ean ? 0.95 : 0.6,
      readAt:      nfcResult.readAt,
      eslBrand:    nfcResult.eslBrand,
    };
    setState({ status: 'success', result: eslResult, error: null, activeMethod: 'nfc' });
  }

  if (nfcError && state.activeMethod === 'nfc' && state.status === 'scanning') {
    setState((s) => ({ ...s, status: 'error', error: nfcError }));
  }

  // ── OCR scan ──────────────────────────────────────────────────────────────

  const scanOCR = useCallback(async (videoEl: HTMLVideoElement) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'scanning', result: null, error: null, activeMethod: 'ocr' });

    try {
      // First try fast BarcodeDetector
      const barcodeResult = await detectBarcodeFromVideo(videoEl);
      if (barcodeResult?.ean && !controller.signal.aborted) {
        setState({
          status: 'success',
          error: null,
          activeMethod: 'barcode',
          result: {
            ...barcodeResult,
            currency: 'EUR',
            method: 'barcode',
            readAt: new Date().toISOString(),
            eslBrand: null,
          },
        });
        return;
      }

      // Fallback to full OCR
      const ocr = await captureAndOCR(videoEl, controller.signal);
      if (controller.signal.aborted) return;

      if (!ocr.ean && !ocr.price) {
        setState({ status: 'error', result: null, error: 'Aucun prix ou code-barres détecté. Rapprochez-vous de l\'étiquette.', activeMethod: 'ocr' });
        return;
      }

      setState({
        status: 'success',
        error: null,
        activeMethod: 'ocr',
        result: {
          ...ocr,
          currency: 'EUR',
          method: 'ocr',
          readAt: new Date().toISOString(),
          eslBrand: null,
        },
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setState({ status: 'error', result: null, error: `Erreur OCR : ${(err as Error)?.message ?? 'inconnue'}`, activeMethod: 'ocr' });
    }
  }, []);

  // ── Barcode-only scan ────────────────────────────────────────────────────

  const scanBarcode = useCallback(async (videoEl: HTMLVideoElement) => {
    setState({ status: 'scanning', result: null, error: null, activeMethod: 'barcode' });
    const result = await detectBarcodeFromVideo(videoEl);
    if (result?.ean) {
      setState({
        status: 'success',
        error: null,
        activeMethod: 'barcode',
        result: { ...result, currency: 'EUR', method: 'barcode', readAt: new Date().toISOString(), eslBrand: null },
      });
    } else {
      setState({ status: 'error', result: null, error: 'Aucun code-barres détecté. Centrez l\'EAN dans la caméra.', activeMethod: 'barcode' });
    }
  }, []);

  // ── Manual entry ──────────────────────────────────────────────────────────

  const setManual = useCallback((ean: string, price?: number) => {
    if (!/^\d{8}$|^\d{13}$/.test(ean)) {
      setState((s) => ({ ...s, error: 'EAN invalide (8 ou 13 chiffres requis).' }));
      return;
    }
    setState({
      status: 'success',
      error: null,
      activeMethod: 'manual',
      result: {
        ean,
        price: price ?? null,
        currency: 'EUR',
        productName: null,
        method: 'manual',
        confidence: 1.0,
        readAt: new Date().toISOString(),
        eslBrand: null,
      },
    });
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    abortRef.current?.abort();
    nfcReader.stopScan();
    setState({ status: 'idle', result: null, error: null, activeMethod: null });
  }, [nfcReader]);

  return {
    state,
    nfcSupport: nfcReader.state.support,
    scanNFC,
    scanOCR,
    scanBarcode,
    setManual,
    reset,
  };
}
