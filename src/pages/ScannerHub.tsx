import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Camera, FileText, Barcode, ShoppingCart, Trash2, Play, Pause } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import ReceiptScanner from '../components/ReceiptScanner';
import ScanOCR from './ScanOCR';
import { lookupProductByEan } from '../services/eanProductService';
import { toProductViewModel } from '../services/productViewModelService';
import { useTiPanier } from '../hooks/useTiPanier';

type ScanMode = 'barcode' | 'ocr' | 'ticket';
type ScanStatus = 'loading' | 'ok' | 'not_found' | 'error';

type ResolvedProduct = {
  name: string;
  brand?: string;
  imageUrl?: string;
  price?: number;
};

type ScanItem = {
  id: string;
  barcode: string;
  status: ScanStatus;
  detectedAt: string;
  product?: ResolvedProduct;
  errorMessage?: string;
};

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function parseDisplayPrice(displayPrice?: string) {
  if (!displayPrice) return undefined;
  const normalized = displayPrice.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!normalized) return undefined;
  const value = Number.parseFloat(normalized[0]);
  return Number.isFinite(value) ? value : undefined;
}

async function resolveBarcode(barcode: string): Promise<ResolvedProduct | null> {
  if (!barcode) return null;

  const result = await lookupProductByEan(barcode, {
    territoire: 'martinique',
    source: 'scan_utilisateur',
  });

  if (!result.success || !result.product || result.product.status === 'non_référencé') {
    return null;
  }

  const viewModel = toProductViewModel(result.product);

  return {
    name: viewModel.nom,
    brand: viewModel.marque !== 'Non spécifiée' ? viewModel.marque : undefined,
    imageUrl: viewModel.imageUrl,
    price: parseDisplayPrice(viewModel.prix),
  };
}

function useCartActions() {
  const { addItem } = useTiPanier();

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
  }, [addItem]);

  return { addToCart };
}

function useBarcodeScanner(params: {
  active: boolean;
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupport, setBarcodeSupport] = useState<boolean>(true);

  useEffect(() => {
    setBarcodeSupport(typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
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
    };

    if (!params.active) {
      stop();
      return stop;
    }

    const start = async () => {
      setCameraError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Caméra non supportée sur cet appareil.');
        return;
      }

      if (!window.BarcodeDetector) {
        setCameraError('BarcodeDetector indisponible: essayez Chrome/Edge sur mobile récent.');
        setBarcodeSupport(false);
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

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.setAttribute('playsinline', 'true');

        await video.play();

        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
        });

        const loop = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }

          try {
            const barcodes = await detector.detect(videoRef.current);
            const raw = barcodes[0]?.rawValue?.trim();
            if (raw) {
              params.onDetected(raw);
            }
          } catch {
            // frame-level errors are ignored
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (error) {
        const fallbackMessage = error instanceof Error ? error.message : 'Impossible d\'ouvrir la caméra.';
        setCameraError(fallbackMessage);
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [params.active, params.onDetected]);

  return { videoRef, cameraError, barcodeSupport };
}

function StatusBadge({ status }: { status: ScanStatus }) {
  const tone =
    status === 'ok'
      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
      : status === 'loading'
      ? 'bg-blue-500/20 border-blue-400/50 text-blue-200'
      : status === 'not_found'
      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
      : 'bg-rose-500/20 border-rose-400/50 text-rose-200';

  const label = status === 'loading' ? '…' : status === 'ok' ? 'OK' : status === 'not_found' ? 'VIDE' : 'ERR';

  return (
    <span className={`inline-flex h-6 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

export default function ScannerHub() {
  const { addToCart } = useCartActions();

  const [mode, setMode] = useState<ScanMode>('barcode');
  const [scanActive, setScanActive] = useState(true);
  const [results, setResults] = useState<ScanItem[]>([]);
  const [autoAddToCart, setAutoAddToCart] = useState(false);

  const lastSeenRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const cooldownMs = 900;
  const sameCodeLockMs = 2500;

  const isDuplicateRecently = useCallback((code: string) => {
    const now = Date.now();
    const last = lastSeenRef.current;

    if (now - last.at < cooldownMs) return true;
    if (code === last.code && now - last.at < sameCodeLockMs) return true;

    lastSeenRef.current = { code, at: now };
    return false;
  }, []);

  const upsertTopLoadingItem = useCallback((barcode: string) => {
    const item: ScanItem = {
      id: uid(),
      barcode,
      status: 'loading',
      detectedAt: nowIso(),
    };
    setResults((prev) => [item, ...prev].slice(0, 50));
    return item.id;
  }, []);

  const patchItem = useCallback((id: string, patch: Partial<ScanItem>) => {
    setResults((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const onDetected = useCallback(
    async (rawCode: string) => {
      const barcode = (rawCode || '').replace(/\s+/g, '').trim();
      if (!barcode) return;
      if (!/^\d{8,14}$/.test(barcode)) return;
      if (isDuplicateRecently(barcode)) return;

      const id = upsertTopLoadingItem(barcode);

      try {
        const product = await resolveBarcode(barcode);

        if (!product) {
          patchItem(id, { status: 'not_found' });
          return;
        }

        patchItem(id, { status: 'ok', product });

        if (autoAddToCart) {
          addToCart(product, barcode);
        }
      } catch (error) {
        patchItem(id, {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    },
    [addToCart, autoAddToCart, isDuplicateRecently, patchItem, upsertTopLoadingItem]
  );

  const { videoRef, cameraError, barcodeSupport } = useBarcodeScanner({
    active: mode === 'barcode' && scanActive,
    onDetected,
  });

  const okItems = useMemo(() => results.filter((it) => it.status === 'ok' && it.product), [results]);

  const addAllOk = useCallback(() => {
    okItems.forEach((item) => {
      if (item.product) {
        addToCart(item.product, item.barcode);
      }
    });
  }, [addToCart, okItems]);

  const clear = useCallback(() => setResults([]), []);

  return (
    <>
      <Helmet>
        <title>Scanner - A KI PRI SA YÉ</title>
        <meta name="description" content="Scanner continu: code-barres, OCR texte et tickets de caisse" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">📷 Scanner de produits</h1>
            <p className="text-lg text-gray-400">Mode scan continu avec historique et ajout rapide au panier.</p>
          </div>

          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('barcode')}
                className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold transition-all ${
                  mode === 'barcode'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
              >
                <Barcode className="h-6 w-6" />
                <span className="text-sm">Code-barres</span>
              </button>
              <button
                onClick={() => setMode('ocr')}
                className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold transition-all ${
                  mode === 'ocr'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">OCR Texte</span>
              </button>
              <button
                onClick={() => setMode('ticket')}
                className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold transition-all ${
                  mode === 'ticket'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Ticket</span>
              </button>
            </div>
          </GlassCard>

          {mode === 'barcode' && (
            <GlassCard>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setScanActive((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {scanActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {scanActive ? 'Pause scan' : 'Start scan'}
                </button>

                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoAddToCart}
                    onChange={(event) => setAutoAddToCart(event.target.checked)}
                  />
                  Ajout auto au panier (OK)
                </label>

                <button
                  onClick={addAllOk}
                  disabled={okItems.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/60 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter tous les OK ({okItems.length})
                </button>

                <button
                  onClick={clear}
                  disabled={results.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-500/50 px-3 py-2 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Vider ({results.length})
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
                <video ref={videoRef} playsInline muted autoPlay className="min-h-[220px] w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[45%] w-[70%] rounded-xl border-2 border-white/60" />
                </div>
                <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  Caméra: {scanActive ? 'ACTIVE' : 'PAUSE'}
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-400">
                {!barcodeSupport && 'BarcodeDetector non disponible sur ce navigateur.'}
                {cameraError && <div className="text-rose-300">{cameraError}</div>}
                {!cameraError && barcodeSupport && 'Astuce: gardez le code au centre 1-2 secondes pour stabiliser la détection.'}
              </div>

              <div className="mt-6">
                <div className="mb-3 text-lg font-semibold text-white">Résultats (scan continu)</div>

                {results.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-gray-400">
                    Aucun scan pour l'instant.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {results.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:flex-row md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm text-white">{item.barcode}</span>
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-gray-500">{new Date(item.detectedAt).toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-300">
                            {item.status === 'loading' && 'Recherche…'}
                            {item.status === 'not_found' && 'Aucune donnée produit.'}
                            {item.status === 'error' && (item.errorMessage || 'Erreur inconnue.')}
                            {item.status === 'ok' && item.product && (
                              <>
                                <span className="font-semibold text-white">{item.product.name}</span>
                                {item.product.brand ? <span> — {item.product.brand}</span> : null}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => {
                              if (item.product) {
                                addToCart(item.product, item.barcode);
                              }
                            }}
                            disabled={item.status !== 'ok' || !item.product}
                            className="rounded-lg border border-emerald-500/60 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Ajouter au panier
                          </button>

                          <button
                            onClick={() => setResults((prev) => prev.filter((entry) => entry.id !== item.id))}
                            className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {mode === 'ocr' && (
            <div className="-mt-6">
              <ScanOCR />
            </div>
          )}

          {mode === 'ticket' && (
            <GlassCard>
              <h2 className="mb-4 text-xl font-semibold text-white">Scanner un ticket de caisse</h2>
              <p className="mb-6 text-gray-400">
                Prenez une photo de votre ticket pour extraire les informations
              </p>
              <ReceiptScanner />
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
}
