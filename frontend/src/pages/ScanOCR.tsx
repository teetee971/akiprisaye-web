 
import { useEffect, useRef, useState } from 'react';
import { runOCR, GENERIC_OCR_ERROR, type OCRResult } from '../services/ocrService';
import OCRResultView from '../components/OCRResultView';
import {
  cacheOCRResult,
  getCachedOCRResult,
  hashImageFile,
  resizeImageForOCR,
} from '../utils/imageUtils';
import {
  classifyScanText,
  estimateNutriScore,
  estimateNovaIndex,
  extractAdditives,
  extractPrices,
  getScanHubTypeLabel,
} from '../services/scanHubClassifier';
import { buildPriceSearchInput } from '../services/scanHub/scanToPriceBridge';
import type { ScanState, OcrOptions } from '../types/scan';
import { useNavigate } from 'react-router-dom';
import { useSearchHistory } from '../hooks/useSearchHistory';

const SAMPLE_IMAGE = '/images/ocr-example.png';
const COPY_FEEDBACK_DURATION = 2000;

/**
 * SECURITY: Allowlist image sources to prevent XSS (CodeQL compliant)
 * Only allows safe image formats (blob: and data:image base64 for png/jpeg/webp)
 * Rejects SVG (can contain scripts), javascript:, and external URLs
 */
function toSafeImageSrc(src?: string | null): string | null {
  if (!src) return null;
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(src)) return src;
  if (src.startsWith("blob:")) return src;
  return null;
}

export default function ScanOCR() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [manualCopied, setManualCopied] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const manualCopyTimeoutRef = useRef<number | null>(null);
  const imageObjectUrlRef = useRef<string | null>(null);
  
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<OcrOptions>({
    enabled: true,
    confidenceThreshold: 60,
    language: 'fra',
    timeout: 30000,
  });
  const [scanSummary, setScanSummary] = useState<{
    typeLabel: string;
    confidence: number;
    signals: string[];
    prices: number[];
    additives: string[];
    nutriScore: string;
    novaIndex: string;
    suggestedBarcode?: string;
  } | null>(null);
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  const lastAutoSearchRef = useRef<string | null>(null);
  const { addEntry } = useSearchHistory();

  const setImageSource = (url: string, isObjectUrl: boolean) => {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    if (isObjectUrl) {
      imageObjectUrlRef.current = url;
    }
    setImage(url);
  };

  const applyOcrResult = (result: OCRResult) => {
    const trimmedText = (result.rawText || '').trim();

    if (!result.success || trimmedText.length === 0) {
      const message = result.success
        ? "Aucun texte détecté. Essayez l'image d'exemple fournie."
        : result.error ?? GENERIC_OCR_ERROR;
      setError(message);
      setScanState('error');
      setOcrResult(null);
      return;
    }

    if (result.confidence < (settings.confidenceThreshold ?? 60)) {
      setError(
        `Confiance OCR trop faible (${Math.round(result.confidence)}%). ` +
          'Essayez un meilleur éclairage ou réduisez le seuil.'
      );
      setScanState('error');
      setOcrResult(null);
      return;
    }

    setOcrResult(result);
    setScanState('success');

    const classification = classifyScanText(trimmedText);
    const prices = extractPrices(trimmedText);
    const additives = extractAdditives(trimmedText);
    const priceInput = buildPriceSearchInput({ text: trimmedText });
    const labelBase = priceInput.barcode
      ? `OCR EAN ${priceInput.barcode}`
      : `${getScanHubTypeLabel(classification.type)} (OCR)`;
    addEntry({
      label: labelBase,
      type: 'ocr',
      barcode: priceInput.barcode,
      query: priceInput.query?.slice(0, 120),
    });
    setScanSummary({
      typeLabel: getScanHubTypeLabel(classification.type),
      confidence: Math.round(classification.confidence),
      signals: classification.signals,
      prices,
      additives,
      nutriScore: estimateNutriScore(trimmedText),
      novaIndex: estimateNovaIndex(additives.length),
      suggestedBarcode: priceInput.barcode,
    });
    const normalizedBarcode = priceInput.barcode?.replace(/\D/g, '') ?? '';
    const isLikelyBarcode =
      normalizedBarcode.length === 8 ||
      normalizedBarcode.length === 13 ||
      normalizedBarcode.length === 14;
    if (
      autoSearchEnabled &&
      isLikelyBarcode &&
      lastAutoSearchRef.current !== normalizedBarcode
    ) {
      lastAutoSearchRef.current = normalizedBarcode;
      handleSearchPrices(normalizedBarcode);
    }
  };

  const executeOcr = (source: string, cacheKey?: string, cleanup?: () => void) => {
    setLoading(true);
    setError(null);
    setOcrResult(null);
    setScanSummary(null);
    setScanState('processing');

    void Promise.resolve().then(async () => {
      try {
        const result = await runOCR(source, settings.language, { timeout: settings.timeout });
        if (cacheKey && result.success) {
          cacheOCRResult(cacheKey, result);
        }
        applyOcrResult(result);
      } catch (err: any) {
        console.error('OCR error:', err, err?.stack);
        setError(err?.message ?? GENERIC_OCR_ERROR);
        setScanState('error');
      } finally {
        setLoading(false);
        if (cleanup) cleanup();
      }
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!settings.enabled) {
      setError('L\'OCR est désactivé dans les paramètres');
      return;
    }

    let objectUrl: string | null = null;

    try {
      const cacheKey = `${hashImageFile(file)}:${settings.language}`;
      const cachedResult = getCachedOCRResult(cacheKey) as OCRResult | null;
      if (cachedResult) {
        setImageSource(URL.createObjectURL(file), true);
        applyOcrResult({ ...cachedResult, fromCache: true });
        return;
      }

      const optimizedBlob = await resizeImageForOCR(file);
      objectUrl = URL.createObjectURL(optimizedBlob);
      setImageSource(objectUrl, true);
      executeOcr(objectUrl, cacheKey, () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Erreur lors du chargement de l\'image');
      setScanState('error');
      setLoading(false);
      // ✅ Nettoyage mémoire en cas d'erreur
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const handleUseSample = () => {
    setImageSource(SAMPLE_IMAGE, false);
    executeOcr(SAMPLE_IMAGE);
  };

  useEffect(() => {
    return () => {
      if (manualCopyTimeoutRef.current) {
        window.clearTimeout(manualCopyTimeoutRef.current);
        manualCopyTimeoutRef.current = null;
      }
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleCopyManualNotes = () => {
    if (!manualNotes.trim() || !navigator.clipboard) return;
    if (manualCopyTimeoutRef.current) {
      window.clearTimeout(manualCopyTimeoutRef.current);
      manualCopyTimeoutRef.current = null;
    }
    navigator.clipboard
      .writeText(manualNotes)
      .then(() => {
        setManualCopied(true);
        manualCopyTimeoutRef.current = window.setTimeout(() => {
          setManualCopied(false);
          manualCopyTimeoutRef.current = null;
        }, COPY_FEEDBACK_DURATION);
      })
      .catch(() => setManualCopied(false));
  };

  const handleRetry = () => {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    setImage(null);
    setOcrResult(null);
    setScanSummary(null);
    setError(null);
    setScanState('idle');
  };

  const handleSearchPrices = (barcode: string) => {
    navigate(`/recherche-produits?ean=${encodeURIComponent(barcode)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">📸 Scanner Ingrédients (OCR)</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Paramètres"
            >
              ⚙️
            </button>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-white font-semibold mb-4">⚙️ Paramètres OCR</h3>
              
              {/* Enable/Disable OCR */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="rounded"
                  />
                  Activer l'OCR
                </label>
              </div>

              {settings.enabled && (
                <>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="checkbox"
                        checked={autoSearchEnabled}
                        onChange={(e) => setAutoSearchEnabled(e.target.checked)}
                        className="rounded"
                      />
                      Lancer automatiquement la recherche prix si un code-barres est détecté
                    </label>
                  </div>
                  {/* Confidence threshold */}
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm mb-2">
                      Seuil de confiance minimum ({settings.confidenceThreshold}%)
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="10"
                      value={settings.confidenceThreshold}
                      onChange={(e) => setSettings({ ...settings, confidenceThreshold: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Moins strict</span>
                      <span>Plus strict</span>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm mb-2">
                      Langue
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full bg-slate-700 text-white border border-slate-600 px-3 py-2 rounded-lg"
                    >
                      <option value="fra">Français</option>
                      <option value="eng">Anglais</option>
                      <option value="spa">Espagnol</option>
                    </select>
                  </div>

                  {/* Timeout */}
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm mb-2">
                      Délai d'attente maximum (secondes)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="10"
                      value={(settings.timeout ?? 30000) / 1000}
                      onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) * 1000 })}
                      className="w-full"
                    />
                    <span className="text-gray-400 text-xs">{(settings.timeout ?? 30000) / 1000}s</span>
                  </div>
                </>
              )}
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-200">
                <p>💡 <strong>Astuce:</strong> Un seuil plus élevé donne des résultats plus précis mais peut rejeter du texte valide.</p>
              </div>
            </div>
          )}

          {/* Information Banner */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              ℹ️ <strong>Extraction de texte uniquement</strong> - Cette fonctionnalité extrait le texte 
              visible sur les étiquettes produits (ingrédients, allergènes, mentions légales). 
              Aucune interprétation ou recommandation n'est fournie.
            </p>
          </div>

          {/* OCR Disabled Warning */}
          {!settings.enabled && (
            <div className="mb-6 p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
              <p className="text-orange-200 text-sm">
                ⚠️ <strong>OCR désactivé</strong> - Activez l'OCR dans les paramètres pour extraire du texte depuis les images.
              </p>
            </div>
          )}

          {/* Initial State - Upload */}
          {!loading && !ocrResult && !error && scanState === 'idle' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white font-semibold mb-2">Sélectionnez une photo</p>
                <p className="text-gray-400 text-sm mb-4">Format: JPG, PNG, WEBP</p>
                <label className={`inline-block px-6 py-3 ${settings.enabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'} text-white rounded-lg font-semibold cursor-pointer transition-colors`}>
                  📷 Choisir une image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                    disabled={!settings.enabled}
                    ref={uploadInputRef}
                  />
                </label>
                </div>
                
                {/* Instructions */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">💡 Conseils pour une meilleure lecture</h3>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                    <li>Privilégiez un bon éclairage</li>
                    <li>Cadrez bien la zone de texte</li>
                    <li>Évitez les reflets et ombres</li>
                    <li>Tenez le téléphone stable</li>
                  </ul>
                </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4">
                <img
                  src={SAMPLE_IMAGE}
                  alt="Exemple d'étiquette ingrédients"
                  className="w-full md:w-48 rounded-lg border border-slate-700"
                />
                <div className="text-left space-y-2">
                  <p className="text-white font-semibold">Pas d'image sous la main ?</p>
                  <p className="text-gray-300 text-sm">
                    Utilisez l'étiquette d'exemple pour tester l'OCR ingrédients immédiatement.
                  </p>
                  <button
                    onClick={handleUseSample}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
                  >
                    Utiliser l'image d'exemple
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
              {scanState === 'processing' && (
                <>
                  <p className="text-white text-lg font-semibold">Lecture en cours...</p>
                  <p className="text-gray-400 text-sm mt-2">Extraction du texte de l'image</p>
                  {/* Progress bar - indeterminate */}
                  <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto mt-4 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Seuil: {settings.confidenceThreshold}% | Timeout: {(settings.timeout ?? 30000) / 1000}s
                  </p>
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-200">
                    <p>💡 <strong>Première utilisation ?</strong> Le scanner OCR (~17 MB) se charge automatiquement. Cela peut prendre quelques secondes selon votre connexion. Une fois chargé, il reste en cache pour les utilisations suivantes.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 font-semibold mb-2">Erreur lors de l'analyse</p>
                <p className="text-red-300 text-sm">{error}</p>
                
                {/* Troubleshooting suggestions */}
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-left text-xs text-red-200">
                  <p className="font-semibold mb-2">💡 Suggestions:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Vérifiez que le texte est net et lisible</li>
                    <li>Essayez d'améliorer l'éclairage</li>
                    <li>Réduisez le seuil de confiance dans les paramètres</li>
                    <li>Augmentez le délai d'attente</li>
                    <li>En cas d'indisponibilité du module OCR, rechargez la page puis réessayez.</li>
                  </ul>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                  <button
                    onClick={() => uploadInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700"
                  >
                    📂 Recharger une image
                  </button>
                  <button
                    onClick={handleUseSample}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700"
                  >
                    🖼️ Utiliser l'image d'exemple
                  </button>
                </div>
                <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg text-left text-sm text-slate-200">
                  <p className="font-semibold mb-2">✏️ Saisie manuelle disponible</p>
                  <p className="text-slate-400 mb-2">Si l'OCR reste indisponible, copiez les ingrédients ici pour continuer.</p>
                  <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm"
                    rows={4}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Saisissez les ingrédients ou notes importantes..."
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">Les informations saisies restent sur votre appareil.</p>
                    <button
                      type="button"
                      onClick={handleCopyManualNotes}
                      className="px-3 py-2 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600"
                      disabled={!manualNotes.trim()}
                    >
                      {manualCopied ? 'Copié ✅' : 'Copier les notes'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Success State - Show Results */}
          {ocrResult && scanState === 'success' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 text-center">
                <p className="text-green-200 text-sm">
                  ✅ Texte extrait avec succès!
                </p>
              </div>
              {scanSummary && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-white shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-blue-300 font-semibold">ScanHub • Détection automatique</p>
                      <h2 className="text-2xl font-bold mt-1">{scanSummary.typeLabel}</h2>
                      <p className="text-sm text-slate-300 mt-1">
                        Confiance OCR combinée : {scanSummary.confidence}%
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200">
                        {scanSummary.nutriScore}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                        {scanSummary.novaIndex}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200">
                        Prix détectés: {scanSummary.prices.length}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-200">
                        Additifs: {scanSummary.additives.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-200">
                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <h3 className="font-semibold mb-2 text-blue-200">Signaux détectés</h3>
                      {/* SECURITY: OCR text rendered as plain text to prevent XSS (CodeQL compliant) */}
                      {scanSummary.signals.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {scanSummary.signals.map((signal) => (
                            <li key={signal}>
                              <span className="whitespace-pre-wrap break-words">{signal}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400">Aucun signal fort détecté.</p>
                      )}
                    </div>
                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <h3 className="font-semibold mb-2 text-blue-200">Prix & ingrédients</h3>
                      {/* SECURITY: OCR text rendered as plain text to prevent XSS (CodeQL compliant) */}
                      <p className="text-slate-300">
                        <span>Prix détectés : </span>
                        <span className="whitespace-pre-wrap break-words">
                          {scanSummary.prices.length > 0
                            ? scanSummary.prices.map((price) => `${price.toFixed(2)}€`).join(', ')
                            : 'Aucun prix explicite'}
                        </span>
                      </p>
                      <p className="text-slate-300 mt-2">
                        <span>Additifs : </span>
                        <span className="whitespace-pre-wrap break-words">
                          {scanSummary.additives.length > 0
                            ? scanSummary.additives.join(', ')
                            : 'Aucun additif identifié'}
                        </span>
                      </p>
                      {scanSummary.suggestedBarcode && (
                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleSearchPrices(scanSummary.suggestedBarcode!)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 text-xs font-semibold"
                          >
                            🔎 Lancer la recherche prix ({scanSummary.suggestedBarcode})
                          </button>
                          <p className="text-[11px] text-slate-400">
                            Ouvre la recherche produit avec le code-barres détecté pour obtenir les
                            prix observés.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-400">
                    Résumé automatique. Vérifiez toujours sur l'emballage original.
                  </div>
                </div>
              )}
              <OCRResultView 
                result={ocrResult} 
                onRetry={handleRetry}
              />
            </div>
          )}

          {/* Image Preview */}
          {/* SECURITY: Use background-image instead of img src to satisfy CodeQL (no XSS sink) */}
          {(() => {
            const safeSrc = toSafeImageSrc(image);
            return safeSrc && !ocrResult && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-2">Aperçu de l'image</h3>
                <div 
                  role="img"
                  aria-label="Image sélectionnée" 
                  className="w-full rounded-lg border border-slate-700 h-96 bg-contain bg-no-repeat bg-center"
                  style={{ backgroundImage: `url(${safeSrc})` }}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
