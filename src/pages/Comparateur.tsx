import React, { useEffect, useMemo, useState } from 'react';
import { PriceComparisonCard } from '@/components/PriceComparisonCard';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { fetchPricesByBarcode, type PricesByBarcodeResponse } from '@/services/pricesByBarcode';
import { fetchOffSearch, type OffSearchItem } from '@/services/offSearch';
import { isValidEAN13 } from '@/utils/ean13';
import {
  addToHistory,
  clearHistory,
  loadHistory,
  type BarcodeHistoryItem,
} from '@/utils/barcodeHistory';

const TERRITORIES = [
  { code: 'fr', label: 'France (FR)' },
  { code: 'gp', label: 'Guadeloupe (GP)' },
  { code: 'mq', label: 'Martinique (MQ)' },
  { code: 'gf', label: 'Guyane (GF)' },
  { code: 're', label: 'Réunion (RE)' },
  { code: 'yt', label: 'Mayotte (YT)' },
  { code: 'pm', label: 'Saint-Pierre-et-Miquelon (PM)' },
  { code: 'bl', label: 'Saint-Barthélemy (BL)' },
  { code: 'mf', label: 'Saint-Martin (MF)' },
] as const;

type TerritoryCode = (typeof TERRITORIES)[number]['code'];

type BundleProduct = {
  productName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
};

export default function Comparateur() {
  const [territory, setTerritory] = useState<TerritoryCode>('gp');
  const [maxAgeDays, setMaxAgeDays] = useState(90);
  const [basketSize, setBasketSize] = useState(30);

  const [q, setQ] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<OffSearchItem[]>([]);

  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PricesByBarcodeResponse | null>(null);

  const [scanOpen, setScanOpen] = useState(false);
  const [history, setHistory] = useState<BarcodeHistoryItem[]>([]);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function runSearch() {
    const term = q.trim();
    if (term.length < 2) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const data = await fetchOffSearch({ q: term, page: 1, pageSize: 12, lang: 'fr' });
      setResults(data.products ?? []);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erreur recherche';
      setSearchError(message);
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function runBarcodeLookup(nextBarcode: string) {
    const normalizedBarcode = nextBarcode.trim();

    setLoading(true);
    setError(null);

    if (!normalizedBarcode) {
      setLoading(false);
      return;
    }

    if (!isValidEAN13(normalizedBarcode)) {
      setError('Code-barres invalide (EAN-13). Vérifie ou rescane.');
      setLoading(false);
      return;
    }

    setBundle(null);

    try {
      const data = await fetchPricesByBarcode({
        barcode: normalizedBarcode,
        territory,
        maxAgeDays,
      });
      setBundle(data);
      setHistory(addToHistory(normalizedBarcode));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erreur chargement prix';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function onPickProduct(item: OffSearchItem) {
    if (!item.barcode) {
      return;
    }

    setBarcode(item.barcode);
    runBarcodeLookup(item.barcode);
  }

  useEffect(() => {
    if (!barcode.trim()) {
      return;
    }

    runBarcodeLookup(barcode);
  }, [territory, maxAgeDays]);

  const cardProduct: BundleProduct | null = bundle?.product && typeof bundle.product === 'object'
    ? (bundle.product as BundleProduct)
    : null;

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-b from-neutral-950 to-neutral-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Comparateur de prix</h1>
        <p className="text-neutral-400 mt-2">
          Recherche un produit, sélectionne-le, puis compare la médiane territoire vs France
          (si territoire ≠ FR).
        </p>

        <div className="mt-6 rounded-2xl bg-neutral-900/70 backdrop-blur border border-neutral-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-sm text-neutral-300">
              Territoire
              <select
                className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 p-2 text-white"
                value={territory}
                onChange={(event) => setTerritory(event.target.value as TerritoryCode)}
              >
                {TERRITORIES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-neutral-300">
              Fraîcheur (jours)
              <input
                className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 p-2 text-white"
                type="number"
                min={1}
                max={365}
                value={maxAgeDays}
                onChange={(event) => setMaxAgeDays(Math.max(1, Number(event.target.value || 90)))}
              />
            </label>

            <label className="text-sm text-neutral-300">
              Panier (nb achats)
              <input
                className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 p-2 text-white"
                type="number"
                min={1}
                max={300}
                value={basketSize}
                onChange={(event) => setBasketSize(Math.max(1, Number(event.target.value || 30)))}
              />
            </label>

            <label className="text-sm text-neutral-300">
              Code-barres
              <div className="mt-1 flex gap-2">
                <input
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 p-2 text-white"
                  placeholder="Ex: 3017624010701"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                />
                <button
                  className="rounded-xl px-4 bg-white text-black font-medium disabled:opacity-50"
                  disabled={!barcode.trim() || loading}
                  onClick={() => runBarcodeLookup(barcode)}
                  type="button"
                >
                  Go
                </button>
                <button
                  className="rounded-xl px-4 bg-neutral-900 text-white border border-neutral-700 disabled:opacity-50"
                  disabled={loading}
                  onClick={() => setScanOpen(true)}
                  type="button"
                >
                  Scan
                </button>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-neutral-900/70 backdrop-blur border border-neutral-700 p-4">
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl bg-neutral-950 border border-neutral-700 p-2 text-white"
              placeholder="Rechercher un produit (ex: lait, riz, coca...)"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  runSearch();
                }
              }}
            />
            <button
              className="rounded-xl px-4 bg-white text-black font-medium disabled:opacity-50"
              disabled={!canSearch || searchLoading}
              onClick={runSearch}
              type="button"
            >
              {searchLoading ? '...' : 'Chercher'}
            </button>
          </div>

          {searchError && <p className="mt-2 text-sm text-red-400">{searchError}</p>}

          {results.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {results.map((result) => (
                <button
                  key={result.barcode ?? `${result.productName}-${result.brand}`}
                  className="text-left rounded-xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-950/70 p-3"
                  onClick={() => onPickProduct(result)}
                  type="button"
                >
                  <div className="flex gap-3 items-center">
                    {result.imageUrl && (
                      <img
                        src={result.imageUrl}
                        alt={result.productName ?? ''}
                        className="w-10 h-10 object-contain rounded bg-white"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {result.productName ?? 'Produit'}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {result.brand ?? '—'} • {result.barcode ?? '—'}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500">Sélectionner</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-4 rounded-2xl bg-neutral-900/70 backdrop-blur border border-neutral-700 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white font-medium">Historique</div>
              <button
                className="text-xs text-neutral-300 hover:text-white"
                onClick={() => {
                  clearHistory();
                  setHistory([]);
                }}
                type="button"
              >
                Effacer
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {history.map((entry) => (
                <button
                  key={entry.barcode}
                  className="px-3 py-2 rounded-full bg-neutral-950 border border-neutral-800 text-xs text-white"
                  onClick={() => {
                    setBarcode(entry.barcode);
                    runBarcodeLookup(entry.barcode);
                  }}
                  type="button"
                >
                  {entry.barcode}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          {loading && <p className="text-neutral-400">Chargement…</p>}
          {error && <p className="text-red-400">{error}</p>}

          {bundle && (
            <PriceComparisonCard
              product={cardProduct}
              territory={bundle.territory}
              stats={bundle.stats}
              comparison={bundle.comparison}
              observationCount={bundle.observationCount}
              status={bundle.status}
              maxAgeDays={bundle.maxAgeDays}
              observations={bundle.observations}
              basketSize={basketSize}
            />
          )}
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(detectedBarcode) => {
          const clean = detectedBarcode.trim();
          if (!isValidEAN13(clean)) {
            setError('Scan détecté, mais code invalide (EAN-13). Essaie à nouveau.');
            return;
          }

          setBarcode(clean);
          runBarcodeLookup(clean);
        }}
      />
    </div>
  );
}
