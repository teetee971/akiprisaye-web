/**
 * ScannerAR — Scanner de codes-barres avec overlay AR et comparaison de prix
 * Route : /scanner-ar (remplace/complète ARScannerPage)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Camera,
  CameraOff,
  ScanLine,
  ShoppingCart,
  AlertTriangle,
  Copy,
  RefreshCw,
  Package,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PriceEntry {
  store: string;
  price: number;
  territory: string;
}

interface ProductResult {
  ean: string;
  name: string;
  brand: string;
  prices: PriceEntry[];
}

interface LocalOffProduct {
  code: string;
  product_name?: string;
  brands?: string;
}

async function buildPriceMap(): Promise<Record<string, ProductResult>> {
  const { getEnhancedPrices } = await import('../services/realDataService');
  const products = await getEnhancedPrices();
  const map: Record<string, ProductResult> = {};
  for (const p of products) {
    if (p.ean) {
      map[p.ean] = {
        ean: p.ean,
        name: p.name,
        brand: p.brand ?? '',
        prices: p.prices.map((pr) => ({
          store: pr.storeName ?? pr.storeChain,
          price: pr.price,
          territory: pr.territory.toLowerCase(),
        })),
      };
    }
  }
  map['DEFAULT'] = {
    ean: '0000000000000',
    name: 'Produit détecté',
    brand: 'Marque inconnue',
    prices: [
      { store: 'Carrefour Destrellan', price: 3.49, territory: 'gp' },
      { store: 'E.Leclerc Bas du Fort', price: 3.29, territory: 'gp' },
    ],
  };
  return map;
}

// Module-level sync price cache (populated asynchronously on first use)
let MOCK_PRICES: Record<string, ProductResult> = {
  DEFAULT: {
    ean: '0000000000000',
    name: 'Produit détecté',
    brand: 'Marque inconnue',
    prices: [
      { store: 'Carrefour Destrellan', price: 3.49, territory: 'gp' },
      { store: 'E.Leclerc Bas du Fort', price: 3.29, territory: 'gp' },
    ],
  },
};
// Populate asynchronously
buildPriceMap()
  .then((map) => {
    MOCK_PRICES = map;
  })
  .catch(() => {
    /* keep defaults */
  });

// Extend BarcodeDetector types (not in lib.dom.d.ts yet)
interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorAPI {
  detect(image: HTMLVideoElement | HTMLCanvasElement): Promise<BarcodeDetectorResult[]>;
}

declare class BarcodeDetector implements BarcodeDetectorAPI {
  constructor(options?: { formats: string[] });
  detect(image: HTMLVideoElement | HTMLCanvasElement): Promise<BarcodeDetectorResult[]>;
  static getSupportedFormats(): Promise<string[]>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lookupLocalProduct(ean: string): LocalOffProduct | null {
  try {
    const raw = localStorage.getItem('akiprisaye_off_products');
    if (!raw) return null;
    const products = JSON.parse(raw) as LocalOffProduct[];
    return products.find((p) => p.code === ean) ?? null;
  } catch {
    return null;
  }
}

function lookupPrices(ean: string): ProductResult {
  const local = lookupLocalProduct(ean);
  const base = MOCK_PRICES[ean] ?? { ...MOCK_PRICES.DEFAULT, ean };
  if (local) {
    return {
      ...base,
      name: local.product_name ?? base.name,
      brand: local.brands ?? base.brand,
    };
  }
  return base;
}

function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScannerAR() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorAPI | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detectedEan, setDetectedEan] = useState<string | null>(null);
  const [manualEan, setManualEan] = useState('');
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      if (isBarcodeDetectorSupported()) {
        detectorRef.current = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128'] });
      }
    } catch (err) {
      const msg = err instanceof DOMException ? err.message : 'Accès caméra refusé';
      setCameraError(`Impossible d'accéder à la caméra : ${msg}`);
    }
  }, []);

  // Continuous barcode detection loop
  useEffect(() => {
    if (!cameraActive || !scanning || !detectorRef.current || !videoRef.current) return;

    const detector = detectorRef.current;
    const video = videoRef.current;

    const loop = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            const ean = barcodes[0].rawValue;
            setDetectedEan(ean);
            setProduct(lookupPrices(ean));
            setShowOverlay(true);
            setScanning(false);
            toast.success(`Code EAN détecté : ${ean}`);
            return;
          }
        } catch {
          // continue scanning
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraActive, scanning]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    toast('📸 Frame capturée — analyse…');
    setScanning(true);
  }, []);

  const handleManualLookup = useCallback(() => {
    const ean = manualEan.trim();
    if (!ean) {
      toast.error('Entrez un code EAN');
      return;
    }
    setDetectedEan(ean);
    setProduct(lookupPrices(ean));
    setShowOverlay(true);
  }, [manualEan]);

  const cheapest = product ? product.prices.reduce((a, b) => (a.price < b.price ? a : b)) : null;

  return (
    <>
      <Helmet>
        <title>Scanner AR — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Scannez un code-barres et comparez les prix en temps réel grâce au scanner AR."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Scanner AR
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">📷 Scanner AR Codes-barres</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Pointez la caméra sur un produit pour comparer les prix instantanément
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
          {/* Note technique */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>Mode BarcodeDetector natif actif.</strong> Nécessite Google Vision /
              TensorFlow.js pour la détection automatique avancée.{' '}
              {isBarcodeDetectorSupported()
                ? '✅ BarcodeDetector API disponible sur ce navigateur.'
                : '⚠️ BarcodeDetector non disponible — utilisez la saisie manuelle.'}
            </p>
          </div>

          {/* ── Caméra + overlay AR ── */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-slate-700">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            {/* AR overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanner line animation */}
                <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-emerald-400/60 rounded-lg">
                  {/* Corners */}
                  <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                  <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                  <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                  <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                  {/* Scan line */}
                  {scanning && (
                    <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-[scanLine_2s_ease-in-out_infinite] shadow-[0_0_8px_#34d399]" />
                  )}
                </div>
                {/* Price overlay bubble */}
                {showOverlay && product && cheapest && (
                  <div className="absolute top-4 right-4 bg-emerald-900/90 border border-emerald-500 rounded-xl px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-bold text-emerald-300">Prix le + bas</p>
                    <p className="text-lg font-black text-white">{cheapest.price.toFixed(2)} €</p>
                    <p className="text-xs text-emerald-200">{cheapest.store}</p>
                  </div>
                )}
              </div>
            )}

            {/* Idle state */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                <CameraOff className="w-12 h-12 text-slate-600" />
                <p className="text-sm text-slate-400">Caméra inactive</p>
              </div>
            )}
          </div>

          {/* Camera error */}
          {cameraError && (
            <div className="bg-rose-900/20 border border-rose-700/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-300">{cameraError}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Camera className="w-4 h-4" /> Activer la caméra
              </button>
            ) : (
              <>
                <button
                  onClick={() => setScanning(true)}
                  disabled={scanning}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <ScanLine className="w-4 h-4" />
                  {scanning ? 'Scan en cours…' : 'Scanner'}
                </button>
                <button
                  onClick={captureFrame}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Copy className="w-4 h-4" /> Capturer
                </button>
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-600 hover:border-slate-400 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Arrêter
                </button>
              </>
            )}
          </div>

          {/* Canvas (hidden, used for frame capture) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* ── Saisie manuelle EAN ── */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">Saisie manuelle EAN</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex : 3017624010701"
                value={manualEan}
                onChange={(e) => setManualEan(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleManualLookup}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Rechercher
              </button>
            </div>
          </div>

          {/* ── Résultats comparaison ── */}
          {product && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-bold text-white">{product.name}</p>
                  <p className="text-xs text-slate-400">
                    {product.brand} · EAN {product.ean}
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> Comparaison par magasin
                </p>
                {product.prices
                  .slice()
                  .sort((a, b) => a.price - b.price)
                  .map((entry, i) => (
                    <div
                      key={entry.store}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                        i === 0
                          ? 'bg-emerald-900/40 border border-emerald-600/50'
                          : 'bg-slate-900 border border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-900 px-1.5 py-0.5 rounded">
                            LE MOINS CHER
                          </span>
                        )}
                        <span
                          className={`text-sm ${i === 0 ? 'text-emerald-200 font-semibold' : 'text-slate-300'}`}
                        >
                          {entry.store}
                        </span>
                      </div>
                      <span
                        className={`font-bold text-lg ${i === 0 ? 'text-emerald-300' : 'text-slate-200'}`}
                      >
                        {entry.price.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                {cheapest && product.prices.length > 1 && (
                  <p className="text-xs text-slate-500 italic pt-1">
                    Économie max :{' '}
                    <span className="text-emerald-400 font-semibold">
                      {(Math.max(...product.prices.map((p) => p.price)) - cheapest.price).toFixed(
                        2
                      )}{' '}
                      €
                    </span>{' '}
                    en choisissant {cheapest.store}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tailwind custom animation (scanLine) via inline style */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 0; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </>
  );
}
