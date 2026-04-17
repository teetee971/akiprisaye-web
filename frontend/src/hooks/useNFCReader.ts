// src/hooks/useNFCReader.ts
// Hook Web NFC API pour lire les étiquettes électroniques de gondole (ESL/EEG/EPL)
//
// Compatibilité :
//   ✅ Chrome Android 89+  (NDEFReader disponible)
//   ❌ iOS Safari           (Web NFC non supporté)
//   ❌ Desktop Chrome       (non supporté)
//
// ESL avec NFC connus :
//   - SES-imagotag VUSION série  → NDEF contenant URL produit + prix
//   - Hanshow Nebular / Stellar  → NDEF avec Text ou URI record
//   - Pricer (certains modèles)  → NDEF Text
//   - Étiquettes génériques NFC (NTAG213/215)

import { useState, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NFCSupport =
  | 'checking'
  | 'supported'
  | 'not-supported' // Browser doesn't support Web NFC
  | 'permission-denied'
  | 'error';

export type NFCScanState = 'idle' | 'scanning' | 'reading' | 'success' | 'error';

export interface NFCRecord {
  recordType: string; // 'text' | 'url' | 'mime' | 'smart-poster' | 'absolute-url' | 'unknown'
  mediaType?: string;
  data: string;
}

export interface NFCESLResult {
  /** URL ou texte brut contenu dans le tag */
  raw: NFCRecord[];
  /** EAN extrait si trouvé dans l'URL ou le texte */
  ean: string | null;
  /** Prix extrait si trouvé */
  price: number | null;
  /** Nom du produit si trouvé */
  productName: string | null;
  /** Source de la lecture */
  source: 'nfc';
  /** ISO timestamp */
  readAt: string;
  /** Fabricant ESL détecté (heuristique sur l'URL) */
  eslBrand: string | null;
}

export interface NFCReaderState {
  support: NFCSupport;
  scanState: NFCScanState;
  result: NFCESLResult | null;
  error: string | null;
}

// ─── NDEF decoder ────────────────────────────────────────────────────────────

function decodeNDEFRecord(record: NDEFRecord): NFCRecord {
  let data = '';
  const recordType = record.recordType ?? 'unknown';

  try {
    if (record.data) {
      if (recordType === 'text') {
        const decoder = new TextDecoder(record.encoding ?? 'utf-8');
        data = decoder.decode(record.data);
      } else if (recordType === 'url' || recordType === 'absolute-url') {
        const decoder = new TextDecoder();
        data = decoder.decode(record.data);
      } else if (record.mediaType?.startsWith('text/')) {
        const decoder = new TextDecoder();
        data = decoder.decode(record.data);
      } else {
        // Binary → hex string for display
        data = Array.from(new Uint8Array(record.data.buffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(' ');
      }
    }
  } catch {
    data = '[erreur décodage]';
  }

  return { recordType, mediaType: record.mediaType, data };
}

// ─── Price / EAN extraction heuristics ────────────────────────────────────────

/** Patterns EAN-13 et EAN-8 */
const EAN_REGEX = /\b(\d{8}|\d{13})\b/;

/** Patterns prix : 1,49 / 1.49 / EUR 1.49 / 1,49 € */
const PRICE_REGEX = /(?:€|EUR|price[=:]?)?\s*(\d{1,4})[.,](\d{2})\s*(?:€|EUR)?/i;

function extractESLData(
  records: NFCRecord[]
): Pick<NFCESLResult, 'ean' | 'price' | 'productName' | 'eslBrand'> {
  let ean: string | null = null;
  let price: number | null = null;
  let productName: string | null = null;
  let eslBrand: string | null = null;

  const allText = records.map((r) => r.data).join(' ');

  // Detect ESL brand from URL patterns
  if (allText.includes('ses-imagotag') || allText.includes('vusion')) eslBrand = 'SES-imagotag';
  else if (allText.includes('hanshow')) eslBrand = 'Hanshow';
  else if (allText.includes('pricer')) eslBrand = 'Pricer';
  else if (allText.includes('displaydata') || allText.includes('zkong'))
    eslBrand = 'ZKong/DisplayData';

  // Extract EAN
  const eanMatch = EAN_REGEX.exec(allText);
  if (eanMatch) ean = eanMatch[1];

  // Extract EAN from URL params like ?gtin=3017620422003 or /product/3017620422003
  const urlEanMatch = allText.match(/(?:gtin|ean|barcode|code|product)[=/](\d{8}|\d{13})/i);
  if (urlEanMatch) ean = urlEanMatch[1];

  // Extract price
  const priceMatch = PRICE_REGEX.exec(allText);
  if (priceMatch) {
    price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
  }

  // Extract product name from URL path (heuristic)
  const nameMatch = allText.match(/\/(?:produit|product|item|p)\/([a-z0-9-]{4,60})/i);
  if (nameMatch) {
    productName = decodeURIComponent(nameMatch[1]).replace(/-/g, ' ');
  }

  return { ean, price, productName, eslBrand };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReader;
  }
}

interface NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  encoding?: string;
  lang?: string;
  data?: DataView;
}

/**
 * Hook pour lire les étiquettes NFC des ESL (Electronic Shelf Labels).
 *
 * Usage :
 *   const { state, startScan, stopScan } = useNFCReader()
 *   await startScan()
 *   // → result contient ean, price, productName extraits du tag NFC
 */
export function useNFCReader() {
  const [state, setState] = useState<NFCReaderState>({
    support: 'checking',
    scanState: 'idle',
    result: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  // Check NFC support on mount
  const checkSupport = useCallback((): NFCSupport => {
    if (typeof window === 'undefined') return 'not-supported';
    if (!('NDEFReader' in window)) return 'not-supported';
    return 'supported';
  }, []);

  const startScan = useCallback(async () => {
    const support = checkSupport();
    if (support === 'not-supported') {
      setState((s) => ({
        ...s,
        support: 'not-supported',
        scanState: 'error',
        error: 'Web NFC non supporté sur ce navigateur. Utilisez Chrome Android 89+.',
      }));
      return;
    }

    // Cancel previous scan
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ support: 'supported', scanState: 'scanning', result: null, error: null });

    try {
      const NDEFReader = window.NDEFReader!;
      const reader = new NDEFReader();

      reader.onreading = (event: NDEFReadingEvent) => {
        setState((s) => ({ ...s, scanState: 'reading' }));

        const records = event.message.records.map(decodeNDEFRecord);
        const extracted = extractESLData(records);

        const result: NFCESLResult = {
          raw: records,
          ...extracted,
          source: 'nfc',
          readAt: new Date().toISOString(),
        };

        setState({ support: 'supported', scanState: 'success', result, error: null });
        abortRef.current?.abort();
      };

      reader.onreadingerror = () => {
        setState((s) => ({
          ...s,
          scanState: 'error',
          error: "Erreur de lecture NFC. Repositionnez votre téléphone sur l'étiquette.",
        }));
      };

      await reader.scan({ signal: controller.signal });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;

      const errMsg = (err as Error)?.message ?? '';
      let errorText = 'Erreur NFC inconnue.';
      let support: NFCSupport = 'error';

      if (
        errMsg.includes('permission') ||
        errMsg.includes('denied') ||
        errMsg.includes('NotAllowedError')
      ) {
        errorText = "Permission NFC refusée. Autorisez l'accès NFC dans les paramètres.";
        support = 'permission-denied';
      } else if (errMsg.includes('not supported') || errMsg.includes('NotSupportedError')) {
        errorText = 'NFC non disponible sur cet appareil.';
        support = 'not-supported';
      }

      setState({ support, scanState: 'error', result: null, error: errorText });
    }
  }, [checkSupport]);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, scanState: 'idle', error: null }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ support: checkSupport(), scanState: 'idle', result: null, error: null });
  }, [checkSupport]);

  return { state, startScan, stopScan, reset };
}
