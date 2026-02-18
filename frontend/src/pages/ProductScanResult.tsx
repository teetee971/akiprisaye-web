import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TERRITORIES } from '../constants/territories';
import { fetchOffProductDetails, type OffProductUiModel } from '../services/openFoodFacts';
import { searchProductPrices } from '../services/priceSearch/priceSearch.service';
import type { PriceSearchResult, TerritoryCode } from '../services/priceSearch/price.types';

type LoadState = 'loading' | 'success' | 'notFound' | 'errorNetwork';

const TERRITORY_CHOICES: TerritoryCode[] = ['gp', 'mq', 'fr'];

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Prix non renseigné';
  }
  return `${value.toFixed(2)} €`;
}

export default function ProductScanResult() {
  const { barcode = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [product, setProduct] = useState<OffProductUiModel | null>(null);
  const [territory, setTerritory] = useState<TerritoryCode>('gp');
  const [priceResult, setPriceResult] = useState<PriceSearchResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const loadProduct = useCallback(async () => {
    setState('loading');
    const result = await fetchOffProductDetails(barcode);

    if (result.status === 'OK' && result.ui) {
      setProduct(result.ui);
      setState('success');
      return;
    }

    if (result.status === 'NOT_FOUND') {
      setState('notFound');
      return;
    }

    setState('errorNetwork');
  }, [barcode]);

  const loadPrices = useCallback(async () => {
    if (!barcode) {
      setPriceResult(null);
      return;
    }

    setPriceLoading(true);
    try {
      const result = await searchProductPrices({
        barcode,
        territory,
      });
      setPriceResult(result);
    } finally {
      setPriceLoading(false);
    }
  }, [barcode, territory]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  const sortedPrices = useMemo(() => {
    if (!priceResult) {
      return [];
    }

    return [...priceResult.observations].sort((a, b) => {
      const aValue = Number.isFinite(a.price) ? a.price : Number.POSITIVE_INFINITY;
      const bValue = Number.isFinite(b.price) ? b.price : Number.POSITIVE_INFINITY;
      return aValue - bValue;
    });
  }, [priceResult]);

  const availablePrices = sortedPrices.filter((item) => Number.isFinite(item.price)).map((item) => item.price);

  const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null;
  const maxPrice = availablePrices.length > 0 ? Math.max(...availablePrices) : null;
  const medianPrice =
    availablePrices.length >= 3
      ? availablePrices[Math.floor(availablePrices.length / 2)]
      : null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 pt-24 text-white">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fiche produit</h1>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">EAN {barcode}</span>
        </div>

        {state === 'loading' && <p className="text-slate-300">Chargement des données OpenFoodFacts…</p>}

        {state === 'notFound' && (
          <div className="space-y-4 rounded-xl border border-orange-700 bg-orange-500/10 p-4">
            <p className="font-semibold text-orange-200">Produit introuvable sur OpenFoodFacts.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/scanner')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">Rescanner</button>
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noreferrer" className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10">Voir sur OpenFoodFacts</a>
            </div>
          </div>
        )}

        {state === 'errorNetwork' && (
          <div className="space-y-4 rounded-xl border border-red-700 bg-red-500/10 p-4">
            <p className="font-semibold text-red-200">Erreur réseau lors de la récupération du produit.</p>
            <button onClick={() => void loadProduct()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700">Réessayer</button>
          </div>
        )}

        {state === 'success' && product && (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-semibold">{product.name ?? 'Produit sans nom'}</h2>
              <p className="text-slate-300">{product.brand ?? 'Marque non renseignée'}{product.quantity ? ` · ${product.quantity}` : ''}</p>
            </header>

            {product.image && <img src={product.image} alt={product.name ?? 'Produit'} className="max-h-64 w-full rounded-xl object-contain bg-white p-2" />}

            <div className="flex flex-wrap gap-2 text-sm">
              {product.nutriScore && <span className="rounded-full bg-green-500/20 px-3 py-1">Nutri-Score {product.nutriScore}</span>}
              {product.nova && <span className="rounded-full bg-purple-500/20 px-3 py-1">NOVA {product.nova}</span>}
              {product.ecoScore && <span className="rounded-full bg-emerald-500/20 px-3 py-1">EcoScore {product.ecoScore}</span>}
              {product.source === 'local_override' && <span className="rounded-full bg-slate-700 px-3 py-1">Source: Catalogue interne (produit)</span>}
            </div>

            <section className="rounded-xl border border-slate-700 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Prix (territoire: {TERRITORIES[territory].label})</h3>
                <label className="text-sm text-slate-300">
                  Territoire{' '}
                  <select
                    className="ml-2 rounded border border-slate-600 bg-slate-800 px-2 py-1"
                    value={territory}
                    onChange={(event) => setTerritory(event.target.value as TerritoryCode)}
                  >
                    {TERRITORY_CHOICES.map((item) => (
                      <option key={item} value={item}>
                        {TERRITORIES[item].label} — {TERRITORIES[item].name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {priceLoading && <p className="text-sm text-slate-300">Chargement des prix…</p>}

              {!priceLoading && sortedPrices.length === 0 && (
                <p className="text-sm text-slate-300">Aucun prix disponible pour ce territoire.</p>
              )}

              {!priceLoading && sortedPrices.length > 0 && (
                <div className="space-y-3 text-sm text-slate-200">
                  <ul className="space-y-2">
                    {sortedPrices.map((entry, index) => (
                      <li key={`${entry.metadata?.retailer ?? 'retailer'}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2">
                        <span className="capitalize">{entry.metadata?.retailer ?? entry.metadata?.store ?? 'Enseigne'}</span>
                        <span>{formatPrice(entry.price)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>Min: {minPrice === null ? 'n/d' : formatPrice(minPrice)}</div>
                    <div>Médiane: {medianPrice === null ? 'n/d' : formatPrice(medianPrice)}</div>
                    <div>Max: {maxPrice === null ? 'n/d' : formatPrice(maxPrice)}</div>
                  </div>

                  {priceResult?.sourcesUsed.includes('local_override') && (
                    <p className="text-xs text-slate-400">Source: Catalogue interne (prix)</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-700 p-4">
              <h3 className="mb-3 text-lg font-semibold">Nutrition (pour 100g)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
                <div>kcal: {product.nutriments.kcal ?? 'n/d'}</div>
                <div>Sucres: {product.nutriments.sugars ?? 'n/d'} g</div>
                <div>Matières grasses: {product.nutriments.fat ?? 'n/d'} g</div>
                <div>Sel: {product.nutriments.salt ?? 'n/d'} g</div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 p-4">
              <h3 className="mb-2 text-lg font-semibold">Ingrédients / Allergènes</h3>
              <p className="text-sm text-slate-200">{product.ingredients ?? 'Ingrédients non disponibles.'}</p>
              <p className="mt-2 text-sm text-slate-300"><strong>Allergènes:</strong> {product.allergens ?? 'Non renseignés'}</p>
            </section>

            <div className="flex gap-3">
              <button onClick={() => navigate('/scanner')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">Rescanner</button>
              <Link to="/scanner" className="rounded-lg border border-slate-500 px-4 py-2 text-sm">Rechercher un autre code</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
