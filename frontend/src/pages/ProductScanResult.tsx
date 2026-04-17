import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchOffProductDetails, type OffProductUiModel } from '../services/openFoodFacts';
import { fetchProductPrices, type PriceListing } from '../services/photoProductSearchService';
import { saveReport, getReportsByBarcode } from '../services/localStore';
import type { LocalPriceReport, OcrExtracted } from '../types/localProduct';
import PriceTrendWidget from '../components/PriceTrendWidget';
import ShareButton from '../components/comparateur/ShareButton';

type LoadState = 'loading' | 'success' | 'notFound' | 'errorNetwork';

function formatPrice(price: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/* ── Haversine distance in km ──────────────────────────────────────────── */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Resize an image File to a small JPEG data-URL (max 80 KB) ─────────── */
function resizeImageToDataUrl(file: File, maxPx = 600, quality = 0.55): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

/* ── Store shape from stores-database.json ─────────────────────────────── */
interface DbStore {
  id: string;
  name: string;
  territory: string;
  commune?: string;
  address?: string;
  lat?: number;
  lon?: number;
  phone?: string;
  services?: string[];
}

/* ── Stores section ─────────────────────────────────────────────────────── */
interface StoresSectionProps {
  territory: string;
}

function StoresSection({ territory }: StoresSectionProps) {
  const [stores, setStores] = useState<(DbStore & { distKm?: number })[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/data/stores-database.json')
      .then((r) => (r.ok ? (r.json() as Promise<{ stores?: DbStore[] }>) : null))
      .then((data) => {
        if (!data?.stores) return;
        const filtered = data.stores.filter(
          (s) => s.territory.toLowerCase() === territory.toLowerCase()
        );
        setStores(filtered);
      })
      .catch(() => {});
  }, [territory]);

  /* Optional: ask for geolocation to sort by distance */
  const requestGeo = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const displayStores = userPos
    ? [...stores]
        .map((s) => ({
          ...s,
          distKm:
            s.lat != null && s.lon != null
              ? haversineKm(userPos.lat, userPos.lon, s.lat, s.lon)
              : undefined,
        }))
        .sort((a, b) => (a.distKm ?? 9999) - (b.distKm ?? 9999))
    : stores;

  const visible = expanded ? displayStores : displayStores.slice(0, 4);

  if (stores.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">🏪 Magasins à proximité</h3>
        {!userPos && (
          <button
            type="button"
            onClick={requestGeo}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-600 text-white"
          >
            📍 Trier par distance
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {visible.map((s) => {
          const gmapsUrl =
            s.lat != null && s.lon != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`
              : `https://www.google.com/maps/search/${encodeURIComponent(s.name + ' ' + (s.commune ?? ''))}`;
          const wazeUrl =
            s.lat != null && s.lon != null
              ? `https://waze.com/ul?ll=${s.lat},${s.lon}&navigate=yes`
              : null;

          return (
            <li key={s.id} className="rounded-lg border border-slate-700 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {[s.address, s.commune].filter(Boolean).join(' · ')}
                  </p>
                  {s.distKm != null && (
                    <p className="text-xs text-blue-300 mt-0.5">
                      {s.distKm < 1
                        ? `${Math.round(s.distKm * 1000)} m`
                        : `${s.distKm.toFixed(1)} km`}
                    </p>
                  )}
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="text-xs text-teal-400 mt-0.5 block">
                      📞 {s.phone}
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-700 hover:bg-green-600 text-white whitespace-nowrap"
                  >
                    🗺️ Itinéraire
                  </a>
                  {wazeUrl && (
                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white whitespace-nowrap"
                    >
                      🚗 Waze
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {displayStores.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-2 w-full text-xs text-slate-400 hover:text-white py-1"
        >
          {expanded
            ? '▲ Moins de magasins'
            : `▼ Voir les ${displayStores.length - 4} autres magasins`}
        </button>
      )}
    </section>
  );
}

/* ── Inline price-report form ─────────────────────────────────────────────── */
interface ReportFormProps {
  barcode: string;
  productName: string;
  territory: string;
  onSaved: () => void;
}

type UnitType = 'unit' | 'kg' | 'l';

const MAX_PHOTOS = 5;

interface PhotoEntry {
  dataUrl: string;
  ocrStatus: 'idle' | 'running' | 'done' | 'error';
  ocrData?: OcrExtracted;
}

function InlineReportForm({ barcode, productName, territory, onSaved }: ReportFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [unit, setUnit] = useState<UnitType>('unit');
  const [observedAt, setObservedAt] = useState(today);
  const [note, setNote] = useState('');
  const [isPromo, setIsPromo] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Apply OCR suggestion to form fields (only if field is still empty) */
  const applySuggestion = useCallback(
    (ocr: OcrExtracted) => {
      if (!price && ocr.detectedPrices && ocr.detectedPrices.length > 0) {
        setPrice(String(ocr.detectedPrices[0]));
      }
      if (!store && ocr.detectedStore) {
        setStore(ocr.detectedStore);
      }
      if (observedAt === today && ocr.detectedDate) {
        setObservedAt(ocr.detectedDate);
      }
    },
    [price, store, observedAt, today]
  );

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = files.slice(0, remaining);

    // Resize all selected files and add as 'idle' entries immediately
    const newEntries: PhotoEntry[] = [];
    for (const file of toProcess) {
      try {
        const dataUrl = await resizeImageToDataUrl(file);
        newEntries.push({ dataUrl, ocrStatus: 'idle' });
      } catch {
        // skip unprocessable file
      }
    }

    if (newEntries.length === 0) return;

    setPhotos((prev) => {
      const updated = [...prev, ...newEntries];
      // Start OCR for each new photo
      newEntries.forEach((entry, i) => {
        const idx = prev.length + i;
        runOcrOnPhoto(entry.dataUrl, idx, updated.length);
      });
      return updated;
    });

    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const runOcrOnPhoto = async (dataUrl: string, idx: number, _total: number) => {
    // Mark as running
    setPhotos((prev) => prev.map((p, i) => (i === idx ? { ...p, ocrStatus: 'running' } : p)));
    try {
      const { extractFromPhoto } = await import('../services/photoOcrExtractor');
      const ocrData = await extractFromPhoto(dataUrl, 25000);
      setPhotos((prev) => {
        const updated = prev.map((p, i) =>
          i === idx ? { ...p, ocrStatus: 'done' as const, ocrData } : p
        );
        return updated;
      });
      applySuggestion(ocrData);
    } catch {
      setPhotos((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, ocrStatus: 'error' as const } : p))
      );
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(price.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setError('Prix invalide');
      return;
    }
    if (!store.trim()) {
      setError('Indiquer le magasin');
      return;
    }
    setError(null);

    const proofPhotos = photos.map((p) => p.dataUrl);
    const ocrData = photos.map((p) => p.ocrData).filter(Boolean) as OcrExtracted[];

    saveReport({
      barcode,
      territory,
      price: val,
      unit,
      store: store.trim(),
      observedAt,
      note: note.trim() || undefined,
      ...(isPromo ? ({ isPromo: true } as Record<string, unknown>) : {}),
      ...(proofPhotos.length > 0 ? { proofPhotos, proofPhoto: proofPhotos[0] } : {}),
      ...(ocrData.length > 0 ? { ocrData } : {}),
    });

    setSaved(true);
    onSaved();
  };

  if (saved) {
    return (
      <div className="rounded-xl border border-green-700 bg-green-500/10 p-4 text-center space-y-2">
        <p className="text-green-300 font-semibold">✅ Prix enregistré localement, merci !</p>
        {photos.length > 0 && (
          <p className="text-xs text-green-400">
            {photos.length} photo{photos.length > 1 ? 's' : ''} ·{' '}
            {photos.filter((p) => p.ocrData).length} analysée
            {photos.filter((p) => p.ocrData).length > 1 ? 's' : ''} par OCR
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setSaved(false);
            setPrice('');
            setStore('');
            setNote('');
            setPhotos([]);
          }}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
        >
          Signaler un autre prix
        </button>
      </div>
    );
  }

  const anyOcrRunning = photos.some((p) => p.ocrStatus === 'running');

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-sm">
      <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg">
        Produit : <span className="text-white font-medium">{productName}</span>
      </div>

      {/* ── Multi-photo section ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">
            📸 Photos preuves ({photos.length}/{MAX_PHOTOS})
          </span>
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white"
            >
              + Ajouter
            </button>
          )}
        </div>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative group">
                <img src={p.dataUrl} alt={`Miniature ${i + 1}`} />
                {/* OCR status badge */}
                <span
                  className={`absolute top-0.5 left-0.5 text-[9px] px-1 rounded font-bold ${
                    p.ocrStatus === 'running'
                      ? 'bg-yellow-500 text-black animate-pulse'
                      : p.ocrStatus === 'done'
                        ? 'bg-green-500 text-white'
                        : p.ocrStatus === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-600 text-white'
                  }`}
                >
                  {p.ocrStatus === 'running'
                    ? 'OCR…'
                    : p.ocrStatus === 'done'
                      ? '✓ OCR'
                      : p.ocrStatus === 'error'
                        ? '✗'
                        : `#${i + 1}`}
                </span>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label={`Supprimer la photo ${i + 1}`}
                >
                  ×
                </button>
                {/* OCR tooltip */}
                {p.ocrStatus === 'done' && p.ocrData && (
                  <div className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block w-48 rounded-lg bg-slate-900 border border-slate-600 p-2 text-[10px] text-slate-300 shadow-xl">
                    {p.ocrData.detectedStore && <p>🏪 {p.ocrData.detectedStore}</p>}
                    {p.ocrData.detectedPrices && p.ocrData.detectedPrices.length > 0 && (
                      <p>
                        💶{' '}
                        {p.ocrData.detectedPrices
                          .slice(0, 3)
                          .map((v) => `${v}€`)
                          .join(', ')}
                      </p>
                    )}
                    {p.ocrData.detectedDate && <p>📅 {p.ocrData.detectedDate}</p>}
                    {p.ocrData.detectedProducts && p.ocrData.detectedProducts.length > 0 && (
                      <p className="truncate">📦 {p.ocrData.detectedProducts[0]}</p>
                    )}
                    <p className="text-slate-500 mt-0.5">
                      Confiance: {Math.round(p.ocrData.confidence)}%
                    </p>
                  </div>
                )}
              </div>
            ))}
            {/* Add more slot */}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-600 hover:border-purple-500 text-slate-500 hover:text-purple-400 flex items-center justify-center text-2xl transition-colors"
                aria-label="Ajouter une photo"
              >
                +
              </button>
            )}
          </div>
        )}

        {/* OCR suggestions banner */}
        {anyOcrRunning && (
          <p className="text-xs text-yellow-400 animate-pulse">
            🔍 Analyse OCR en cours… les champs seront pré-remplis automatiquement
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handlePhotos}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-300">Prix (€) *</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 3.50"
            required
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-300">Unité</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitType)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
          >
            <option value="unit">Unité</option>
            <option value="kg">kg</option>
            <option value="l">Litre</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-300">Magasin *</span>
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          placeholder="Ex: Carrefour, Leader Price…"
          required
          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-300">Date observée</span>
        <input
          type="date"
          value={observedAt}
          onChange={(e) => setObservedAt(e.target.value)}
          required
          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
        />
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPromo}
          onChange={(e) => setIsPromo(e.target.checked)}
          className="rounded border-slate-600"
        />
        <span className="text-xs text-slate-300">🏷️ Prix en promotion</span>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-300">Note (optionnel)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Informations complémentaires…"
          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white resize-none"
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!price || !store || anyOcrRunning}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50"
      >
        {anyOcrRunning ? '⏳ OCR en cours…' : 'Enregistrer ce prix'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Données sauvegardées localement · contribuent à l'observatoire citoyen
      </p>
    </form>
  );
}

/* ── Community-reported prices from localStorage ─────────────────────────── */
interface CommunityPricesProps {
  barcode: string;
  refreshKey: number;
}

function CommunityPrices({ barcode, refreshKey }: CommunityPricesProps) {
  const [reports, setReports] = useState<LocalPriceReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setReports(getReportsByBarcode(barcode));
  }, [barcode, refreshKey]);

  if (reports.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-semibold mb-3">📋 Prix signalés localement ({reports.length})</h3>
      <ul className="space-y-2">
        {reports.map((r) => {
          const photos = r.proofPhotos ?? (r.proofPhoto ? [r.proofPhoto] : []);
          const hasOcr = r.ocrData && r.ocrData.length > 0;
          const isExpanded = expandedId === r.id;
          return (
            <li
              key={r.id}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm"
            >
              <div className="flex gap-3 items-start">
                {/* Thumbnails */}
                {photos.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {photos.slice(0, 3).map((src, i) => (
                      <img key={i} src={src} alt={`Miniature ${i + 1}`} />
                    ))}
                    {photos.length > 3 && (
                      <div className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                        +{photos.length - 3}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-emerald-400 text-base">
                      {formatPrice(r.price, r.currency)}
                      {r.unit && r.unit !== 'unit' ? `/${r.unit}` : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasOcr && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">
                          🔍 OCR
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatDate(r.observedAt)}</span>
                    </div>
                  </div>
                  {r.store && <p className="text-xs text-slate-300 truncate">🏪 {r.store}</p>}
                  {r.isPromo && (
                    <span className="inline-block text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full mt-0.5">
                      🏷️ Promo
                    </span>
                  )}
                  {r.note && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.note}</p>}
                  {/* OCR details toggle */}
                  {hasOcr && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 mt-1"
                    >
                      {isExpanded ? '▲ Masquer données OCR' : '▼ Voir données OCR'}
                    </button>
                  )}
                </div>
              </div>
              {/* OCR data panel */}
              {isExpanded && r.ocrData && r.ocrData.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 space-y-2">
                  {r.ocrData.map((ocr, i) => (
                    <div key={i} className="rounded-lg bg-slate-900 p-2 text-xs space-y-0.5">
                      <p className="font-semibold text-slate-400">
                        📷 Photo {i + 1} — Confiance {Math.round(ocr.confidence)}%
                      </p>
                      {ocr.detectedStore && (
                        <p className="text-slate-300">🏪 {ocr.detectedStore}</p>
                      )}
                      {ocr.detectedPrices && ocr.detectedPrices.length > 0 && (
                        <p className="text-slate-300">
                          💶 {ocr.detectedPrices.map((p) => `${p}€`).join(', ')}
                        </p>
                      )}
                      {ocr.detectedDate && <p className="text-slate-300">📅 {ocr.detectedDate}</p>}
                      {ocr.detectedProducts && ocr.detectedProducts.length > 0 && (
                        <div>
                          <p className="text-slate-400">📦 Produits détectés:</p>
                          <ul className="list-disc list-inside text-slate-300 ml-2">
                            {ocr.detectedProducts.slice(0, 5).map((name, j) => (
                              <li key={j} className="truncate">
                                {name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ocr.rawText && (
                        <details className="mt-1">
                          <summary className="text-slate-500 cursor-pointer">
                            Texte brut OCR
                          </summary>
                          <pre className="mt-1 text-[9px] text-slate-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                            {ocr.rawText.slice(0, 500)}
                            {ocr.rawText.length > 500 ? '…' : ''}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProductScanResult() {
  const { barcode = '' } = useParams();
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territoire') ?? 'mq';
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [product, setProduct] = useState<OffProductUiModel | null>(null);
  const [productSource, setProductSource] = useState<'openfoodfacts' | 'local_override' | null>(
    null
  );
  const [prices, setPrices] = useState<PriceListing[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [showReportForm, setShowReportForm] = useState(false);

  const loadProduct = useCallback(async () => {
    setState('loading');
    const result = await fetchOffProductDetails(barcode);

    if (result.status === 'OK' && result.ui) {
      setProduct(result.ui);
      setProductSource(result.source ?? result.ui.source ?? null);
      setState('success');

      // Load prices in parallel (non-blocking)
      setPricesLoading(true);
      fetchProductPrices(barcode)
        .then(setPrices)
        .finally(() => setPricesLoading(false));
      return;
    }

    if (result.status === 'NOT_FOUND') {
      setState('notFound');
      return;
    }

    setState('errorNetwork');
  }, [barcode]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const bestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;
  const latestPrice = prices[0]?.price ?? null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 pt-14 text-white">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fiche produit</h1>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
            EAN {barcode}
          </span>
        </div>

        {state === 'loading' && (
          <p className="text-slate-300">Chargement des données OpenFoodFacts…</p>
        )}

        {state === 'notFound' && (
          <div className="space-y-4 rounded-xl border border-orange-700 bg-orange-500/10 p-4">
            <p className="font-semibold text-orange-200">Produit introuvable sur OpenFoodFacts.</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/scanner')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
              >
                Rescanner
              </button>
              <a
                href={`https://world.openfoodfacts.org/product/${barcode}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10"
              >
                Voir sur OpenFoodFacts
              </a>
            </div>
          </div>
        )}

        {state === 'errorNetwork' && (
          <div className="space-y-4 rounded-xl border border-red-700 bg-red-500/10 p-4">
            <p className="font-semibold text-red-200">
              Erreur réseau lors de la récupération du produit.
            </p>
            <button
              onClick={() => void loadProduct()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {state === 'success' && product && (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-semibold">{product.name ?? 'Produit sans nom'}</h2>
              <p className="text-slate-300">
                {product.brand ?? 'Marque non renseignée'}
                {product.quantity ? ` · ${product.quantity}` : ''}
              </p>
              {productSource === 'local_override' && (
                <p className="mt-1 text-xs text-slate-400">Source: Catalogue interne</p>
              )}
            </header>

            {product.image && (
              <img
                src={product.image}
                alt={product.name ?? 'Produit'}
                width={400}
                height={256}
                loading="lazy"
                className="max-h-64 w-full rounded-xl object-contain bg-white p-2"
              />
            )}

            {/* ── Tendance des prix (données observatoire réelles) ── */}
            <PriceTrendWidget productName={product.name} territory={territory} />

            <div className="flex flex-wrap gap-2 text-sm">
              {product.nutriScore && (
                <span className="rounded-full bg-green-500/20 px-3 py-1">
                  Nutri-Score {product.nutriScore}
                </span>
              )}
              {product.nova && (
                <span className="rounded-full bg-purple-500/20 px-3 py-1">NOVA {product.nova}</span>
              )}
              {product.ecoScore && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1">
                  EcoScore {product.ecoScore}
                </span>
              )}
            </div>

            {/* ── CTA : comparaison prix DOM-TOM ── */}
            <Link
              to={`/produit/${barcode}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <div>
                <p className="font-bold text-sm">🏷️ Comparer les prix en DOM-TOM</p>
                <p className="text-xs text-blue-100 mt-0.5">
                  Enseignes locales, prix en temps réel
                </p>
              </div>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            {/* ── Prix observés (Open Prices) ── */}
            <section className="rounded-xl border border-slate-700 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">💰 Prix observés (monde entier)</h3>
                <a
                  href={`https://prices.openfoodfacts.org/products/${barcode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Open Prices →
                </a>
              </div>
              {pricesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : prices.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun prix relevé pour ce produit.</p>
              ) : (
                <div className="space-y-3">
                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-2">
                    {bestPrice !== null && (
                      <div className="rounded-lg bg-green-500/10 border border-green-600/40 p-2.5 text-center">
                        <p className="text-xs text-green-300 font-medium">Meilleur prix</p>
                        <p className="text-xl font-bold text-green-400">{formatPrice(bestPrice)}</p>
                      </div>
                    )}
                    {latestPrice !== null && (
                      <div className="rounded-lg bg-blue-500/10 border border-blue-600/40 p-2.5 text-center">
                        <p className="text-xs text-blue-300 font-medium">Dernier relevé</p>
                        <p className="text-xl font-bold text-blue-400">
                          {formatPrice(latestPrice)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Store comparison list — all entries sorted by price */}
                  {(() => {
                    const sorted = [...prices].sort((a, b) => a.price - b.price);
                    const worst = sorted[sorted.length - 1]?.price ?? null;
                    return sorted.map((listing, i) => {
                      const isBest = listing.price === bestPrice;
                      const savingVsWorst =
                        worst && worst > listing.price
                          ? Math.round(((worst - listing.price) / worst) * 100)
                          : 0;
                      const storeLine = [
                        listing.locationName,
                        listing.locationCity,
                        listing.locationCountry,
                      ]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-3 text-sm ${isBest ? 'border-green-500 bg-green-500/10' : 'border-slate-700'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-slate-500 w-5 flex-shrink-0">
                                #{i + 1}
                              </span>
                              <div className="min-w-0">
                                {storeLine && (
                                  <p className="font-medium text-white truncate">🏪 {storeLine}</p>
                                )}
                                {listing.date && (
                                  <p className="text-xs text-slate-500">
                                    {formatDate(listing.date)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span
                                className={`text-lg font-bold ${isBest ? 'text-green-400' : 'text-white'}`}
                              >
                                {formatPrice(listing.price, listing.currency)}
                              </span>
                              {isBest && (
                                <span className="block text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full text-center mt-0.5">
                                  🏆 Meilleur
                                </span>
                              )}
                              {savingVsWorst > 0 && isBest && (
                                <span className="block text-xs text-green-400 font-medium">
                                  -{savingVsWorst}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  <p className="text-xs text-slate-500">
                    Source:{' '}
                    <a
                      href="https://prices.openfoodfacts.org"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Open Prices
                    </a>{' '}
                    · {prices.length} relevé{prices.length > 1 ? 's' : ''} citoyen
                    {prices.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-700 p-4">
              <h3 className="mb-3 text-lg font-semibold">Nutrition (pour 100g)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
                <div>kcal: {product.nutriments.kcal ?? 'n/d'}</div>
                <div>Énergie: {product.nutritionPer100g?.energyKj ?? 'n/d'} kJ</div>
                <div>Sucres: {product.nutriments.sugars ?? 'n/d'} g</div>
                <div>Matières grasses: {product.nutriments.fat ?? 'n/d'} g</div>
                <div>Acides gras saturés: {product.nutritionPer100g?.saturatedFat ?? 'n/d'} g</div>
                <div>Glucides: {product.nutritionPer100g?.carbs ?? 'n/d'} g</div>
                <div>Fibres: {product.nutritionPer100g?.fiber ?? 'n/d'} g</div>
                <div>Protéines: {product.nutritionPer100g?.protein ?? 'n/d'} g</div>
                <div>Sel: {product.nutriments.salt ?? 'n/d'} g</div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 p-4">
              <h3 className="mb-2 text-lg font-semibold">Ingrédients / Allergènes</h3>
              <p className="text-sm text-slate-200">
                {product.ingredients ?? 'Ingrédients non disponibles.'}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                <strong>Allergènes:</strong> {product.allergens ?? 'Non renseignés'}
              </p>
            </section>

            {/* ── Stores section ── */}
            <StoresSection territory={territory} />

            {/* ── Community prices (locally stored) ── */}
            <CommunityPrices barcode={barcode} refreshKey={reportRefreshKey} />

            {/* ── Report a price ── */}
            <section className="rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">📣 Signaler un prix</h3>
                {!showReportForm && (
                  <button
                    type="button"
                    onClick={() => setShowReportForm(true)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    + Ajouter
                  </button>
                )}
              </div>
              {showReportForm && (
                <InlineReportForm
                  barcode={barcode}
                  productName={product.name ?? `EAN ${barcode}`}
                  territory={territory}
                  onSaved={() => {
                    setReportRefreshKey((k) => k + 1);
                    setShowReportForm(false);
                  }}
                />
              )}
              {!showReportForm && (
                <p className="text-xs text-slate-500">
                  Vous avez vu ce produit en magasin ? Indiquez le prix avec preuve photo pour
                  enrichir l'observatoire citoyen.
                </p>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/scanner')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
              >
                Rescanner
              </button>
              <button
                onClick={() => navigate('/scan-photo')}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-700"
              >
                📷 Par photo
              </button>
              <Link to="/scanner" className="rounded-lg border border-slate-500 px-4 py-2 text-sm">
                Autre code
              </Link>
              <ShareButton
                title={product.name ?? `Produit EAN ${barcode}`}
                description={`Comparez les prix de ce produit dans les supermarchés DOM-TOM sur A KI PRI SA YÉ`}
                productId={barcode}
                variant="default"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
