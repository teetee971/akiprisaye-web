import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lookupProductByEan } from '../services/eanProductService';
import { toProductViewModel } from '../services/productViewModelService';
import type { DataSource, Territoire } from '../types/ean';
import { useTiPanier } from './useTiPanier';
import { addShoppingListItem, getShoppingListCount } from '../store/useShoppingListStore';

export type ScanStatus = 'loading' | 'ok' | 'not_found' | 'error';

export type ResolvedProduct = {
  name: string;
  brand?: string;
  quantity?: string;
  imageUrl?: string;
  imageThumbUrl?: string;
  price?: number;
};

export type ScanResultItem = {
  id: string;
  barcode: string;
  status: ScanStatus;
  detectedAt: string;
  product?: ResolvedProduct;
  errorMessage?: string;
};

type BarcodeDetectorFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e';

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: BarcodeDetectorFormat[] }) => BarcodeDetectorLike;

const SUPPORTED_FORMATS: BarcodeDetectorFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const DEFAULT_LOOKUP_TERRITORY: Territoire = 'martinique';
const RESULT_LIMIT = 50;
const RESOLVED_CACHE = new Map<string, ResolvedProduct | null>();

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function nowIso() {
  return new Date().toISOString();
}


function parseQuantityDetails(quantity?: string): { quantityValue?: number; quantityUnit?: 'kg' | 'g' | 'l' | 'ml' | 'unit'; unit?: 'kg' | 'l' | 'unit' } {
  if (!quantity) return {};
  const match = quantity.toLowerCase().replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|x|unite|unité|unit)/);
  if (!match) return {};

  const quantityValue = Number.parseFloat(match[1]);
  if (!Number.isFinite(quantityValue) || quantityValue <= 0) return {};

  const raw = match[2];
  if (raw === 'kg' || raw === 'g') {
    return { quantityValue, quantityUnit: raw, unit: 'kg' };
  }
  if (raw === 'l' || raw === 'ml') {
    return { quantityValue, quantityUnit: raw, unit: 'l' };
  }
  return { quantityValue, quantityUnit: 'unit', unit: 'unit' };
}
function parseDisplayPrice(displayPrice?: string) {
  if (!displayPrice) return undefined;
  const normalized = displayPrice.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!normalized) return undefined;
  const value = Number.parseFloat(normalized[0]);
  return Number.isFinite(value) ? value : undefined;
}

export async function resolveBarcode(
  barcode: string,
  territoire: Territoire = DEFAULT_LOOKUP_TERRITORY,
  source: DataSource = 'scan_utilisateur',
): Promise<ResolvedProduct | null> {
  if (!barcode) return null;

  const cached = RESOLVED_CACHE.get(barcode);
  if (cached !== undefined) return cached;

  const result = await lookupProductByEan(barcode, {
    territoire,
    source,
  });

  if (!result.success || !result.product || result.product.status === 'non_référencé') {
    RESOLVED_CACHE.set(barcode, null);
    return null;
  }

  const viewModel = toProductViewModel(result.product);

  const resolved = {
    name: viewModel.nom || `Produit (EAN: ${barcode})`,
    brand: viewModel.marque !== 'Non spécifiée' ? viewModel.marque : ((result.product as { marque?: string }).marque),
    quantity: viewModel.contenance ?? (result.product as { quantity?: string }).quantity,
    imageThumbUrl: (result.product as { imageThumbnail?: string; image_small_url?: string; image_thumb_url?: string }).imageThumbnail
      ?? (result.product as { image_small_url?: string; image_thumb_url?: string }).image_small_url
      ?? (result.product as { image_thumb_url?: string }).image_thumb_url
      ?? viewModel.imageUrl
      ?? undefined,
    imageUrl: viewModel.imageUrl
      ?? (result.product as { imageThumbnail?: string }).imageThumbnail
      ?? undefined,
    price: parseDisplayPrice(viewModel.prix),
  };

  RESOLVED_CACHE.set(barcode, resolved);
  return resolved;
}

type UseContinuousBarcodeScannerOptions = {
  territoire?: Territoire;
  source?: DataSource;
  debug?: boolean;
  stabilityThreshold?: number;
  cooldownMs?: number;
  sameCodeLockMs?: number;
  maxItems?: number;
};

export type ContinuousScannerDebugInfo = {
  status: 'idle' | 'starting' | 'scanning' | 'paused' | 'error';
  lastCode: string | null;
  stableCounter: number;
  secondsSinceLastDetection: number | null;
};

export function useContinuousBarcodeScanner(options: UseContinuousBarcodeScannerOptions = {}) {
  const {
    territoire = DEFAULT_LOOKUP_TERRITORY,
    source = 'scan_utilisateur',
    debug = false,
    stabilityThreshold = 1,
    cooldownMs = 900,
    sameCodeLockMs = 2500,
    maxItems = 30,
  } = options;

  const { addItem } = useTiPanier();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lastAcceptedRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const lastRawCodeRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const lastDetectedAtRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupport, setBarcodeSupport] = useState<boolean>(true);
  const [scanActive, setScanActive] = useState(true);
  const [results, setResults] = useState<ScanResultItem[]>([]);
  const [autoAddToCart, setAutoAddToCart] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<ContinuousScannerDebugInfo['status']>('idle');
  const [debugLastCode, setDebugLastCode] = useState<string | null>(null);
  const [debugStableCounter, setDebugStableCounter] = useState(0);
  const [secondsSinceLastDetection, setSecondsSinceLastDetection] = useState<number | null>(null);

  const clear = useCallback(() => setResults([]), []);

  const removeItem = useCallback((id: string) => {
    setResults((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToCart = useCallback((product: ResolvedProduct, barcode: string) => {
    addItem({
      id: barcode,
      quantity: 1,
      meta: {
        name: product.name,
        brand: product.brand,
        price: product.price,
        barcode,
      },
    });

    const quantityDetails = parseQuantityDetails(product.quantity);

    addShoppingListItem(
      {
        id: barcode,
        name: product.name || `Produit (EAN: ${barcode})`,
        quantity: 1,
        price: product.price,
        history: product.price ? [product.price] : undefined,
        source: 'scan_utilisateur',
        lastObservedAt: new Date().toISOString(),
        imageThumbUrl: product.imageThumbUrl ?? product.imageUrl ?? undefined,
        imageUrl: product.imageUrl ?? product.imageThumbUrl ?? undefined,
        ...quantityDetails,
      },
      maxItems,
    );
  }, [addItem, maxItems]);

  const okItems = useMemo(
    () => results.filter((item) => item.status === 'ok' && item.product),
    [results],
  );

  const addAllOk = useCallback(() => {
    okItems.forEach((item) => {
      if (item.product) {
        addToCart(item.product, item.barcode);
      }
    });
    return okItems.length;
  }, [addToCart, okItems]);

  const addItemToCart = useCallback((id: string) => {
    const target = results.find((item) => item.id === id);
    if (target?.product) {
      addToCart(target.product, target.barcode);
      return true;
    }
    return false;
  }, [addToCart, results]);

  useEffect(() => {
    setBarcodeSupport(typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function');
  }, []);

  useEffect(() => {
    if (!debug) return;

    const timer = window.setInterval(() => {
      if (lastDetectedAtRef.current === null) {
        setSecondsSinceLastDetection(null);
        return;
      }

      const delta = Math.max(0, Math.floor((Date.now() - lastDetectedAtRef.current) / 1000));
      setSecondsSinceLastDetection(delta);
    }, 500);

    return () => window.clearInterval(timer);
  }, [debug]);

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      setScannerStatus(scanActive ? 'idle' : 'paused');
    };

    if (!scanActive) {
      stop();
      return stop;
    }

    const onDetected = async (rawCode: string) => {
      const barcode = rawCode.replace(/\D/g, '').trim();
      if (!/^\d{8,14}$/.test(barcode)) return;

      if (barcode === lastRawCodeRef.current) {
        stableCountRef.current += 1;
      } else {
        lastRawCodeRef.current = barcode;
        stableCountRef.current = 1;
      }

      if (debug) {
        setDebugLastCode(barcode);
        setDebugStableCounter(stableCountRef.current);
      }

      if (stableCountRef.current < Math.max(1, stabilityThreshold)) {
        return;
      }

      const now = Date.now();
      const lastAccepted = lastAcceptedRef.current;
      if (now - lastAccepted.at < cooldownMs) return;
      if (lastAccepted.code === barcode && now - lastAccepted.at < sameCodeLockMs) return;

      lastAcceptedRef.current = { code: barcode, at: now };
      lastDetectedAtRef.current = now;

      const id = uid();
      setResults((prev) => [
        {
          id,
          barcode,
          status: 'loading',
          detectedAt: nowIso(),
        },
        ...prev,
      ].slice(0, RESULT_LIMIT));

      try {
        const product = await resolveBarcode(barcode, territoire, source);
        setResults((prev) => prev.map((item) => {
          if (item.id !== id) return item;
          if (!product) {
            return { ...item, status: 'not_found' };
          }
          return { ...item, status: 'ok', product };
        }));

        if (product && autoAddToCart && getShoppingListCount() < maxItems) {
          addToCart(product, barcode);
        }
      } catch (error) {
        setResults((prev) => prev.map((item) => (
          item.id === id
            ? {
                ...item,
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
              }
            : item
        )));
      }
    };

    const start = async () => {
      setCameraError(null);
      setScannerStatus('starting');

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Caméra non supportée sur cet appareil.');
        setScannerStatus('error');
        return;
      }

      if (!window.BarcodeDetector) {
        setCameraError('BarcodeDetector indisponible: essayez Chrome/Edge sur mobile récent.');
        setBarcodeSupport(false);
        setScannerStatus('error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.setAttribute('playsinline', 'true');

        await videoRef.current.play();

        const detector = new window.BarcodeDetector({ formats: SUPPORTED_FORMATS });
        setScannerStatus('scanning');

        const loop = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }

          try {
            const matches = await detector.detect(videoRef.current);
            const rawValue = matches[0]?.rawValue?.trim();
            if (rawValue) {
              void onDetected(rawValue);
            }
          } catch {
            // Frame-level detect errors are non-blocking.
          }

          rafRef.current = window.requestAnimationFrame(loop);
        };

        rafRef.current = window.requestAnimationFrame(loop);
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : 'Impossible d’ouvrir la caméra.');
        setScannerStatus('error');
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [
    addToCart,
    autoAddToCart,
    cooldownMs,
    debug,
    maxItems,
    sameCodeLockMs,
    scanActive,
    source,
    stabilityThreshold,
    territoire,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setScanActive(false);
      }
    };

    const handlePageHide = () => {
      setScanActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return {
    videoRef,
    cameraError,
    barcodeSupport,
    scanActive,
    setScanActive,
    results,
    clear,
    removeItem,
    addAllOk,
    addItemToCart,
    okItems,
    autoAddToCart,
    setAutoAddToCart,
    debugInfo: {
      status: scannerStatus,
      lastCode: debugLastCode,
      stableCounter: debugStableCounter,
      secondsSinceLastDetection,
    } as ContinuousScannerDebugInfo,
  };
}

export { DEFAULT_LOOKUP_TERRITORY };
