/**
 * ESLScannerPage.tsx — Lecteur d'Étiquettes Électroniques de Gondole (EEG/ESL/EPL)
 * Route : /scan-eeg
 *
 * Trois méthodes de lecture disponibles :
 *   📷 Caméra + OCR  — Photo de l'étiquette e-ink → extraction prix + EAN
 *   📡 NFC           — Lecture chip NFC intégré (SES-imagotag, Hanshow, Pricer)
 *   🔢 Manuel        — Saisie EAN + prix depuis l'étiquette
 *
 * Après lecture → comparaison automatique des prix sur tous les DOM-TOM
 * via Open Prices (useProductLivePrices).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Camera, Wifi, Keyboard, CheckCircle2, AlertCircle, Loader2,
  Tag, MapPin, RefreshCcw, ChevronRight, Info, Zap, Eye,
  Star, TrendingDown,
} from 'lucide-react';
import { useESLScanner, type ESLReadMethod } from '../hooks/useESLScanner';
import { useProductLivePrices } from '../hooks/useProductLivePrices';

// ─── Constants ────────────────────────────────────────────────────────────────

const TERRITORY_NAMES: Record<string, string> = {
  gp: 'Guadeloupe', mq: 'Martinique', gf: 'Guyane', re: 'La Réunion', yt: 'Mayotte',
};

const TERRITORY_FLAGS: Record<string, string> = {
  gp: '🇬🇵', mq: '🇲🇶', gf: '🇬🇫', re: '🇷🇪', yt: '🇾🇹',
};

const METHOD_META: Record<ESLReadMethod, { icon: React.ReactNode; label: string; desc: string; color: string }> = {
  nfc:    { icon: <Wifi size={20} />,     label: 'NFC',     desc: 'Approchez du tag NFC',     color: 'from-blue-500 to-cyan-500' },
  ocr:    { icon: <Camera size={20} />,   label: 'Caméra',  desc: 'Photo de l\'étiquette',    color: 'from-violet-500 to-purple-500' },
  barcode:{ icon: <Eye size={20} />,      label: 'Code EAN',desc: 'Code-barres détecté',      color: 'from-emerald-500 to-green-500' },
  manual: { icon: <Keyboard size={20} />, label: 'Manuel',  desc: 'Saisie manuelle',          color: 'from-orange-500 to-amber-500' },
};

const fmt = (v: number | null) => (v != null ? `${v.toFixed(2)} €` : '—');
const isValidEAN = (s: string) => /^\d{8}$|\d{13}$/.test(s.trim());

// ─── Method selector tab ──────────────────────────────────────────────────────

function MethodTab({
  method, active, onClick, disabled,
}: {
  method: ESLReadMethod; active: boolean; onClick: () => void; disabled?: boolean;
}) {
  const meta = METHOD_META[method];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all flex-1 ${
        active
          ? `bg-gradient-to-br ${meta.color} text-white shadow-lg`
          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {meta.icon}
      <span className="text-xs">{meta.label}</span>
    </button>
  );
}

// ─── Camera view ──────────────────────────────────────────────────────────────

function CameraView({ videoRef, onCapture, scanning }: {
  videoRef: React.RefObject<HTMLVideoElement>;
  onCapture: () => void;
  scanning: boolean;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      {/* Aiming overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-4/5 h-24 border-2 border-white/60 rounded-xl">
          {/* Corner accents */}
          {['tl', 'tr', 'bl', 'br'].map((c) => (
            <div key={c} className={`absolute w-5 h-5 border-white border-2 ${
              c === 'tl' ? 'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg' :
              c === 'tr' ? 'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg' :
              c === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg' :
                           'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg'
            }`} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/70 text-xs text-center">Centrez l&apos;étiquette</span>
          </div>
        </div>
      </div>

      {/* Scan line animation */}
      {scanning && (
        <div className="absolute left-[10%] right-[10%] h-0.5 bg-violet-400/80 animate-[scanline_2s_ease-in-out_infinite] shadow-[0_0_8px_2px_rgba(167,139,250,0.6)]" />
      )}

      {/* Capture button */}
      <button
        onClick={onCapture}
        disabled={scanning}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-slate-800 flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
      >
        {scanning
          ? <Loader2 size={24} className="animate-spin text-slate-600" />
          : <Camera size={24} className="text-slate-800" />
        }
      </button>
    </div>
  );
}

// ─── NFC view ─────────────────────────────────────────────────────────────────

function NFCView({ scanning, nfcSupport, onStart }: {
  scanning: boolean; nfcSupport: string; onStart: () => void;
}) {
  const isSupported = nfcSupport === 'supported' || nfcSupport === 'checking';

  return (
    <div className="flex flex-col items-center gap-5 py-8">
      {/* Animated NFC ring */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {scanning && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
            <div className="absolute inset-4 rounded-full border-2 border-blue-400/50 animate-ping [animation-delay:0.3s]" />
          </>
        )}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 ${scanning ? 'border-blue-400 animate-pulse' : 'border-white/20'}`}>
          <Wifi size={40} className={scanning ? 'text-blue-400' : 'text-slate-400'} />
        </div>
      </div>

      {!isSupported ? (
        <div className="text-center px-4">
          <p className="text-amber-400 font-medium mb-1">NFC non disponible</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            La lecture NFC nécessite <strong className="text-white">Chrome Android 89+</strong> et
            un appareil avec NFC. Utilisez le mode Caméra ou Manuel.
          </p>
        </div>
      ) : scanning ? (
        <p className="text-blue-300 text-center font-medium animate-pulse">
          En attente du tag NFC…<br />
          <span className="text-sm text-slate-400 font-normal">Approchez l&apos;étiquette ESL</span>
        </p>
      ) : (
        <div className="text-center">
          <p className="text-slate-300 mb-4 text-sm leading-relaxed px-4">
            Approchez votre téléphone du <strong className="text-white">chip NFC</strong> de
            l&apos;étiquette électronique pour lire automatiquement prix et EAN.
          </p>
          <button
            onClick={onStart}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
          >
            Démarrer lecture NFC
          </button>
        </div>
      )}

      {/* ESL brand info */}
      <div className="w-full bg-white/5 rounded-xl p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1 flex items-center gap-1">
          <Info size={12} /> ESL compatibles NFC
        </p>
        <p>SES-imagotag VUSION · Hanshow Nebular/Stellar · Pricer (certains modèles) · Étiquettes NTAG213/215</p>
      </div>
    </div>
  );
}

// ─── Manual view ──────────────────────────────────────────────────────────────

function ManualView({ onSubmit }: { onSubmit: (ean: string, price?: number) => void }) {
  const [ean, setEan]     = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEAN(ean)) return;
    const p = price ? parseFloat(price.replace(',', '.')) : undefined;
    onSubmit(ean.trim(), p && !isNaN(p) ? p : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <label htmlFor="esl-ean-input" className="block text-sm text-slate-400 mb-1.5">Code EAN (8 ou 13 chiffres) *</label>
        <input
          id="esl-ean-input"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          value={ean}
          onChange={(e) => setEan(e.target.value.replace(/\D/g, '').slice(0, 13))}
          placeholder="Ex : 3017620422003"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 font-mono text-lg tracking-wider"
          maxLength={13}
        />
        {ean && !isValidEAN(ean) && (
          <p className="text-red-400 text-xs mt-1">EAN invalide — 8 ou 13 chiffres requis</p>
        )}
      </div>

      <div>
        <label htmlFor="esl-price-input" className="block text-sm text-slate-400 mb-1.5">Prix affiché (optionnel)</label>
        <div className="relative">
          <input
            id="esl-price-input"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex : 1,49"
            className="w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValidEAN(ean)}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 rounded-2xl font-semibold text-white transition-all"
      >
        Comparer les prix
      </button>
    </form>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────

function ESLResult({ ean, price: eslPrice, productName, method, confidence }: {
  ean: string | null; price: number | null; productName: string | null;
  method: ESLReadMethod; confidence: number;
}) {
  const meta = METHOD_META[method];
  return (
    <div className="p-4 bg-emerald-900/20 border border-emerald-400/30 rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-400" />
        <span className="font-semibold text-emerald-300">Étiquette lue — {meta.label}</span>
        <span className="ml-auto text-xs text-slate-400">
          Confiance : {Math.round(confidence * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {ean && (
          <div className="bg-white/5 rounded-xl px-3 py-2">
            <div className="text-slate-400 text-xs mb-0.5">EAN</div>
            <div className="font-mono text-white font-bold tracking-wide">{ean}</div>
          </div>
        )}
        {eslPrice != null && (
          <div className="bg-white/5 rounded-xl px-3 py-2">
            <div className="text-slate-400 text-xs mb-0.5">Prix affiché</div>
            <div className="text-white font-bold text-lg">{fmt(eslPrice)}</div>
          </div>
        )}
        {productName && (
          <div className="col-span-2 bg-white/5 rounded-xl px-3 py-2">
            <div className="text-slate-400 text-xs mb-0.5">Produit</div>
            <div className="text-white capitalize">{productName}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Territory comparison panel ───────────────────────────────────────────────

function TerritoryComparison({ result, localPrice }: {
  result: ReturnType<typeof useProductLivePrices>['state']['result'];
  localPrice: number | null;
}) {
  if (!result) return null;
  const withData = result.byTerritory.filter((t) => t.count > 0);
  if (!withData.length) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-slate-400 text-sm">
        <MapPin size={20} className="mx-auto mb-2 opacity-50" />
        Aucun relevé Open Prices trouvé pour ce produit dans les DOM-TOM.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={14} className="text-violet-400" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          Prix dans les DOM-TOM
        </span>
        {localPrice && (
          <span className="ml-auto text-xs text-slate-500">
            Prix local : <strong className="text-white">{fmt(localPrice)}</strong>
          </span>
        )}
      </div>

      {result.byTerritory.map((t) => {
        const isCheapest = t.territory === result.cheapestTerritory;
        const diff = localPrice && t.min ? ((t.min - localPrice) / localPrice) * 100 : null;

        return (
          <div
            key={t.territory}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              isCheapest
                ? 'border-emerald-400/40 bg-emerald-900/15'
                : t.count > 0
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/5 bg-white/2 opacity-40'
            }`}
          >
            <span className="text-lg">{TERRITORY_FLAGS[t.territory]}</span>
            <span className={`text-sm flex-1 ${t.count > 0 ? 'text-white' : 'text-slate-500'}`}>
              {TERRITORY_NAMES[t.territory]}
            </span>
            <span className={`text-sm font-bold ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
              {t.count > 0 ? fmt(t.min) : '—'}
            </span>
            {diff != null && t.count > 0 && (
              <span className={`text-xs font-medium ${diff < -3 ? 'text-emerald-400' : diff > 3 ? 'text-red-400' : 'text-slate-400'}`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
              </span>
            )}
            {isCheapest && (
              <Star size={12} className="text-emerald-400 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Technical info card ──────────────────────────────────────────────────────

function TechInfoCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2"><Info size={14} /> Comment ça fonctionne ?</span>
        <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-xs text-slate-400 border-t border-white/10 pt-3">
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: '📷', title: 'Caméra + OCR', ok: true, text: 'Photo de l\'afficheur e-ink → extraction automatique du prix et du code EAN. Compatible toutes étiquettes.' },
              { icon: '📡', title: 'NFC (chip intégré)', ok: true, text: 'Chip NFC dans l\'ESL → lecture directe via Web NFC API. Requis : Chrome Android 89+. Compatible SES-imagotag VUSION, Hanshow, certains Pricer.' },
              { icon: '🔢', title: 'Code-barres EAN', ok: true, text: 'EAN affiché sur l\'étiquette → BarcodeDetector Web API. Rapide et précis.' },
              { icon: '📶', title: 'Bluetooth (BLE)', ok: false, text: 'Non supporté : Web Bluetooth = appareils appairés uniquement. Scan d\'advertisements BLE non accessible depuis un navigateur.' },
              { icon: '📻', title: 'RF propriétaire (433/868 MHz)', ok: false, text: 'Impossible sans matériel dédié. Protocoles Pricer/SES-imagotag sont propriétaires et chiffrés.' },
            ].map((item) => (
              <div key={item.title} className={`flex items-start gap-2 p-2 rounded-lg ${item.ok ? 'bg-emerald-900/20' : 'bg-slate-800/50'}`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <div>
                  <p className={`font-medium mb-0.5 ${item.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.ok ? '✅' : '❌'} {item.title}
                  </p>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ESLScannerPage() {
  const [activeMethod, setActiveMethod] = useState<ESLReadMethod>('ocr');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const eslScanner    = useESLScanner();
  const livePrices    = useProductLivePrices();
  const eslResult     = eslScanner.state.result;
  const pricesResult  = livePrices.state.result;

  // Start camera when ocr/barcode tab selected
  useEffect(() => {
    if (activeMethod !== 'ocr' && activeMethod !== 'barcode') {
      cameraStream?.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      return;
    }

    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {/* permission denied handled by eslScanner */});

    return () => {
      active = false;
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [activeMethod]);

  // When ESL result has an EAN → fetch live prices
  useEffect(() => {
    if (eslResult?.ean) {
      livePrices.scan(eslResult.ean);
    }
  }, [eslResult?.ean]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    eslScanner.scanOCR(videoRef.current);
  }, [eslScanner]);

  const handleMethodSwitch = useCallback((m: ESLReadMethod) => {
    eslScanner.reset();
    livePrices.clear();
    setActiveMethod(m);
  }, [eslScanner, livePrices]);

  return (
    <>
      <Helmet>
        <title>Lecteur EEG/ESL — Étiquettes électroniques de gondole | A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Lisez les étiquettes électroniques de gondole (EEG/ESL/EPL) par NFC, caméra ou code EAN et comparez les prix sur tous les DOM-TOM en temps réel."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-20">

        {/* Header */}
        <div className="px-4 pt-8 pb-5 max-w-xl mx-auto">
          <Link to="/" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-6 transition-colors">
            ← Accueil
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Tag size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Lecture EEG / ESL / EPL</h1>
              <p className="text-xs text-slate-400">Étiquettes électroniques de gondole</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs bg-teal-900/40 text-teal-400 border border-teal-400/20 px-2 py-1 rounded-full">
              <Zap size={10} />
              Temps réel
            </div>
          </div>
        </div>

        <div className="px-4 max-w-xl mx-auto space-y-5">

          {/* Method tabs */}
          <div className="flex gap-2">
            <MethodTab method="ocr"    active={activeMethod === 'ocr'}    onClick={() => handleMethodSwitch('ocr')} />
            <MethodTab method="nfc"    active={activeMethod === 'nfc'}    onClick={() => handleMethodSwitch('nfc')}
              disabled={eslScanner.nfcSupport === 'not-supported'} />
            <MethodTab method="manual" active={activeMethod === 'manual'} onClick={() => handleMethodSwitch('manual')} />
          </div>

          {/* Camera view */}
          {(activeMethod === 'ocr') && (
            <CameraView
              videoRef={videoRef}
              onCapture={handleCapture}
              scanning={eslScanner.state.status === 'scanning'}
            />
          )}

          {/* NFC view */}
          {activeMethod === 'nfc' && (
            <NFCView
              scanning={eslScanner.state.status === 'scanning'}
              nfcSupport={eslScanner.nfcSupport}
              onStart={() => eslScanner.scanNFC()}
            />
          )}

          {/* Manual view */}
          {activeMethod === 'manual' && (
            <ManualView onSubmit={(ean, price) => eslScanner.setManual(ean, price)} />
          )}

          {/* Scan error */}
          {eslScanner.state.error && (
            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-500/20 rounded-2xl">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium text-sm">Erreur de lecture</p>
                <p className="text-xs text-red-400/80 mt-0.5">{eslScanner.state.error}</p>
              </div>
            </div>
          )}

          {/* ESL read result */}
          {eslResult && (
            <ESLResult
              ean={eslResult.ean}
              price={eslResult.price}
              productName={eslResult.productName}
              method={eslResult.method}
              confidence={eslResult.confidence}
            />
          )}

          {/* Live price loading */}
          {livePrices.state.loading && (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl animate-pulse">
              <Loader2 size={18} className="animate-spin text-violet-400" />
              <span className="text-sm text-slate-400">Comparaison des prix DOM-TOM…</span>
            </div>
          )}

          {/* Product info */}
          {pricesResult?.product && (
            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
              {pricesResult.product.imageUrl && (
                <img src={pricesResult.product.imageUrl} alt={pricesResult.product.name}
                  className="w-14 h-14 object-contain rounded-xl bg-white/10 flex-shrink-0"
                  width={56} height={56} loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div>
                <p className="font-semibold text-white text-sm leading-tight">{pricesResult.product.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{pricesResult.product.brand}</p>
                {pricesResult.product.nutriscore && (
                  <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded mt-1 inline-block">
                    Nutri-Score {pricesResult.product.nutriscore.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Territory comparison */}
          {pricesResult && (
            <TerritoryComparison result={pricesResult} localPrice={eslResult?.price ?? null} />
          )}

          {/* Contribute CTA */}
          {eslResult?.ean && pricesResult && (
            <div className="flex items-start gap-3 p-4 bg-violet-900/20 border border-violet-400/20 rounded-2xl">
              <TrendingDown size={18} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-violet-300 font-medium">Vous voyez un meilleur prix ?</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Signalez le prix de cette étiquette dans votre magasin.
                </p>
                <Link
                  to="/contribuer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  Contribuer <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Reset */}
          {(eslResult || eslScanner.state.error) && (
            <button
              onClick={() => { eslScanner.reset(); livePrices.clear(); }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
            >
              <RefreshCcw size={14} /> Nouveau scan
            </button>
          )}

          {/* Technical info */}
          <TechInfoCard />

          {/* Link to full product lookup */}
          <Link
            to="/prix-produit"
            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
          >
            <div>
              <p className="font-medium text-white text-sm">Comparer par EAN</p>
              <p className="text-xs text-slate-400">Tableau complet 5 territoires</p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </Link>
        </div>
      </div>
    </>
  );
}
