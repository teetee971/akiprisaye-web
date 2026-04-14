import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Search, RefreshCw, ShoppingCart, Globe, Store, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import {
  searchProductFromPhoto,
  type PhotoSearchResult,
} from '../services/photoProductSearchService';
import PriceTrendWidget from '../components/PriceTrendWidget';

// ─── constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function methodLabel(method: PhotoSearchResult['detectionMethod']): string {
  switch (method) {
    case 'barcode_detector': return 'BarcodeDetector (natif)';
    case 'zxing': return 'ZXing (bibliothèque)';
    case 'ocr': return 'OCR (Tesseract)';
    default: return 'inconnu';
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function NutriBadge({ label, value }: { label: string; value: string }) {
  const colors: Record<string, string> = {
    a: 'bg-green-600', b: 'bg-lime-500', c: 'bg-yellow-500',
    d: 'bg-orange-500', e: 'bg-red-600',
  };
  const cls = colors[value.toLowerCase()] ?? 'bg-slate-600';
  return (
    <span className={`${cls} text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase`}>
      {label} {value}
    </span>
  );
}

function PriceCard({ listing, isBest }: { listing: { price: number; currency: string; date: string; locationName?: string; locationCity?: string; locationCountry?: string }; isBest: boolean }) {
  return (
    <div className={`rounded-xl border p-3 flex items-start justify-between gap-3 ${isBest ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-lg text-white">{formatPrice(listing.price, listing.currency)}</span>
          {isBest && (
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">Meilleur prix</span>
          )}
        </div>
        {(listing.locationName || listing.locationCity) && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            <Store className="inline w-3 h-3 mr-1" />
            {[listing.locationName, listing.locationCity, listing.locationCountry].filter(Boolean).join(' · ')}
          </p>
        )}
        {listing.date && (
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(listing.date)}</p>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type Step = 'idle' | 'processing' | 'result';

export default function ProductPhotoSearch() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoSearchResult | null>(null);
  const [processingLabel, setProcessingLabel] = useState('');

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Image trop grande (max 15 Mo).');
      return;
    }

    // Revoke old preview
    if (preview) URL.revokeObjectURL(preview);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStep('processing');
    setResult(null);

    setProcessingLabel('Extraction du code-barres…');
    const res = await searchProductFromPhoto(file);
    setResult(res);
    setStep('result');
  }, [preview]);

  const reset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setStep('idle');
    setProcessingLabel('');
  }, [preview]);

  const product = result?.product ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-slate-800 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-500/30 rounded-xl">
              <Camera className="w-6 h-6 text-blue-300" />
            </div>
            <h1 className="text-2xl font-bold">Recherche par photo</h1>
          </div>
          <p className="text-slate-300 text-sm">
            Prenez une photo d'un produit → identifiez-le instantanément → comparez les prix partout.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── IDLE: capture/upload ── */}
        {step === 'idle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Camera capture (mobile) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 transition-all"
              >
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Camera className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-blue-200">Prendre une photo</p>
                  <p className="text-xs text-slate-400 mt-0.5">Caméra mobile</p>
                </div>
              </button>

              {/* File upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-purple-500/60 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
              >
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Upload className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-purple-200">Importer une image</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP</p>
                </div>
              </button>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Conseils pour une meilleure détection
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Calez le code-barres au centre de la photo, bien à plat</li>
                <li>Assurez-vous d'une bonne luminosité (évitez les reflets)</li>
                <li>Tenez le téléphone à environ 15-20 cm du produit</li>
                <li>Compatible EAN-13, EAN-8, UPC, Code 128, QR Code</li>
              </ul>
            </div>

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              aria-label="Prendre une photo avec la caméra"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label="Importer une image depuis la galerie"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center space-y-4">
            {preview && (
              <img
                src={preview}
                alt="Aperçu analysé"
                loading="lazy"
                className="max-h-48 mx-auto rounded-xl object-contain bg-slate-800"
              />
            )}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300 text-sm font-medium">{processingLabel || 'Analyse en cours…'}</p>
              <p className="text-xs text-slate-500">
                Détection du code-barres → Open Food Facts → Open Prices
              </p>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === 'result' && result && (
          <div className="space-y-4">
            {/* Photo preview + detection badge */}
            {preview && (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="Résultat analysé" width={400} height={208} loading="lazy" className="w-full max-h-52 object-contain bg-slate-800" />
                {result.barcode ? (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-green-600/90 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    EAN {result.barcode} · {methodLabel(result.detectionMethod)}
                  </div>
                ) : (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-red-700/90 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Aucun code-barres détecté
                  </div>
                )}
              </div>
            )}

            {/* Error / no barcode */}
            {result.error && !product && (
              <div className="rounded-xl border border-orange-700 bg-orange-500/10 p-4 space-y-3">
                <p className="text-orange-200 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {result.error}
                </p>
                <p className="text-sm text-slate-300">
                  Essayez de photographier directement le code-barres, ou utilisez la saisie manuelle.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={reset}
                    className="px-4 py-2 bg-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
                  >
                    <RefreshCw className="inline w-4 h-4 mr-1.5" />
                    Réessayer
                  </button>
                  <button
                    onClick={() => navigate('/scan-ean')}
                    className="px-4 py-2 border border-slate-600 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                  >
                    Saisie manuelle EAN
                  </button>
                </div>
              </div>
            )}

            {/* Product card */}
            {product && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 overflow-hidden">
                {/* Product header */}
                <div className="flex gap-4 p-4">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name ?? 'Produit'}
                      loading="lazy"
                      className="w-24 h-24 rounded-xl object-contain bg-white p-1 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg leading-tight">{product.name ?? 'Produit sans nom'}</h2>
                    <p className="text-slate-300 text-sm mt-0.5">
                      {product.brand ?? 'Marque inconnue'}
                      {product.quantity ? ` · ${product.quantity}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {product.nutriScore && <NutriBadge label="Nutri" value={product.nutriScore} />}
                      {product.nova !== undefined && (
                        <span className="bg-purple-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          NOVA {product.nova}
                        </span>
                      )}
                      {product.ecoScore && <NutriBadge label="Éco" value={product.ecoScore} />}
                    </div>
                  </div>
                </div>

                {/* Ingredients / allergens */}
                {(product.ingredients || product.allergens) && (
                  <div className="border-t border-slate-700 px-4 py-3 space-y-1">
                    {product.ingredients && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        <span className="font-semibold text-slate-300">Ingrédients: </span>
                        {product.ingredients}
                      </p>
                    )}
                    {product.allergens && (
                      <p className="text-xs text-orange-300">
                        <span className="font-semibold">Allergènes: </span>
                        {product.allergens}
                      </p>
                    )}
                  </div>
                )}

                {/* See full sheet */}
                <div className="border-t border-slate-700 px-4 py-3">
                  <button
                    onClick={() => navigate(`/product/${result.barcode}`)}
                    className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Voir la fiche complète (nutrition, scores, ingrédients)
                  </button>
                </div>
              </div>
            )}

            {/* Price trend prediction from real observatoire data */}
            {product && (
              <PriceTrendWidget
                productName={product.name}
                territory="mq"
                className="rounded-2xl"
              />
            )}

            {/* Price comparison */}
            {result.barcode && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-green-400" />
                    Prix observés
                  </h3>
                  {result.prices.length > 0 && (
                    <span className="text-xs text-slate-400">{result.prices.length} relevé{result.prices.length > 1 ? 's' : ''} citoyen{result.prices.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                {result.prices.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-slate-400 text-sm">Aucun prix relevé pour ce produit.</p>
                    <a
                      href={`https://prices.openfoodfacts.org/products/${result.barcode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Consulter Open Prices
                    </a>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {result.bestPrice !== null && (
                        <div className="rounded-lg bg-green-500/10 border border-green-600/40 p-2.5 text-center">
                          <p className="text-xs text-green-300 font-medium">Meilleur prix</p>
                          <p className="text-xl font-bold text-green-400">{formatPrice(result.bestPrice)}</p>
                        </div>
                      )}
                      {result.latestPrice !== null && (
                        <div className="rounded-lg bg-blue-500/10 border border-blue-600/40 p-2.5 text-center">
                          <p className="text-xs text-blue-300 font-medium">Dernier relevé</p>
                          <p className="text-xl font-bold text-blue-400">{formatPrice(result.latestPrice)}</p>
                        </div>
                      )}
                    </div>

                    {/* Listings (max 5) */}
                    {result.prices.slice(0, 5).map((listing, i) => (
                      <PriceCard
                        key={i}
                        listing={listing}
                        isBest={result.bestPrice !== null && listing.price === result.bestPrice}
                      />
                    ))}

                    {result.prices.length > 5 && (
                      <a
                        href={`https://prices.openfoodfacts.org/products/${result.barcode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center text-xs text-slate-400 hover:text-blue-400 py-1"
                      >
                        Voir {result.prices.length - 5} relevé{result.prices.length - 5 > 1 ? 's' : ''} supplémentaire{result.prices.length - 5 > 1 ? 's' : ''} sur Open Prices →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Online links */}
            {result.barcode && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Trouver en ligne
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <a
                    href={`https://world.openfoodfacts.org/product/${result.barcode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-lg">🌍</span>
                    <span>Open Food Facts</span>
                  </a>
                  <a
                    href={`https://prices.openfoodfacts.org/products/${result.barcode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-lg">💰</span>
                    <span>Open Prices</span>
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent((product?.name ?? '') + ' ' + (product?.brand ?? '') + ' prix')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-lg">🔍</span>
                    <span>Rechercher le prix</span>
                  </a>
                  <a
                    href={`https://www.idealo.fr/prixcompare/ChangeToSearchPage.html?q=${encodeURIComponent(result.barcode)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-lg">🛒</span>
                    <span>Idealo comparateur</span>
                  </a>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nouvelle photo
              </button>
              {result.barcode && (
                <button
                  onClick={() => navigate(`/product/${result.barcode}`)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-600 rounded-xl text-sm hover:bg-slate-800 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Fiche complète
                </button>
              )}
            </div>

            {/* Data attribution */}
            <p className="text-xs text-slate-500 text-center">
              Données produit : <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">Open Food Facts</a> (ODbL) · 
              Prix : <a href="https://prices.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">Open Prices</a> (contributions citoyennes)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
