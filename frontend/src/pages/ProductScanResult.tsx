import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchCachedOrRemoteOffProduct, type OffFetchStatus, type OffProductMinimal } from '../services/openFoodFacts';
import { computePriceStats, getOffersForProduct } from '../services/prices';
import type { ProductOffer, ProductPriceStats } from '../types/store';

type LoadState = 'loading' | 'success' | 'notFound' | 'invalidBarcode' | 'error';

export default function ProductScanResult() {
  const { barcode = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const debugEnabled = useMemo(() => new URLSearchParams(location.search).get('debug') === '1', [location.search]);
  const [state, setState] = useState<LoadState>('loading');
  const [product, setProduct] = useState<OffProductMinimal | null>(null);
  const [offStatus, setOffStatus] = useState<OffFetchStatus | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [responseMs, setResponseMs] = useState<number | null>(null);
  const [offUrl, setOffUrl] = useState('');
  const [offersLoading, setOffersLoading] = useState(true);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [priceStats, setPriceStats] = useState<ProductPriceStats | null>(null);

  const formatObservedDate = useCallback((value?: string) => {
    if (!value) {
      return 'date n/d';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'date n/d';
    }

    return parsed.toLocaleDateString();
  }, []);

  const loadProduct = useCallback(async () => {
    setState('loading');
    const result = await fetchCachedOrRemoteOffProduct(barcode);
    setOffStatus(result.status);
    setCacheHit(result.cacheHit);
    setResponseMs(result.responseMs);
    setOffUrl(result.sourceUrl);

    if (debugEnabled) {
      console.info('[ProductScanResult][debug] OFF result', {
        status: result.status,
        cacheHit: result.cacheHit,
        responseMs: result.responseMs,
        sourceUrl: result.sourceUrl,
      });
    }

    if (result.status === 'OK' && result.product) {
      setProduct(result.product);
      setState('success');
      return;
    }

    if (result.status === 'NOT_FOUND') {
      setState('notFound');
      return;
    }

    if (result.status === 'INVALID') {
      setState('invalidBarcode');
      return;
    }

    setState('error');
  }, [barcode, debugEnabled]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    const loadOffers = async () => {
      setOffersLoading(true);
      const nextOffers = await getOffersForProduct({ barcode });
      setOffers(nextOffers);
      setPriceStats(computePriceStats(nextOffers));
      setOffersLoading(false);
    };

    void loadOffers();
  }, [barcode]);

  return (
    <div className="bg-slate-950 p-4 text-white">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fiche produit</h1>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">Code-barres {barcode}</span>
        </div>

        {state === 'loading' && <p className="text-slate-300">Chargement des données OpenFoodFacts…</p>}

        {state === 'notFound' && (
          <div className="space-y-4 rounded-xl border border-orange-700 bg-orange-500/10 p-4">
            <p className="font-semibold text-orange-200">Produit non référencé sur OpenFoodFacts.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/scanner')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">Rescanner</button>
              <Link to="/contribuer" className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10">Ajouter ce produit</Link>
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noreferrer" className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10">Voir sur OpenFoodFacts</a>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-4 rounded-xl border border-red-700 bg-red-500/10 p-4">
            <p className="font-semibold text-red-200">Service produit indisponible, réessayez.</p>
            <button onClick={() => void loadProduct()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700">Réessayer</button>
          </div>
        )}

        {state === 'invalidBarcode' && (
          <div className="space-y-4 rounded-xl border border-amber-700 bg-amber-500/10 p-4">
            <p className="font-semibold text-amber-200">Code-barres invalide. Veuillez rescanner le produit.</p>
            <button onClick={() => navigate('/scanner')} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold hover:bg-amber-700">Retour au scanner</button>
          </div>
        )}

        {state === 'success' && product && (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-semibold">{product.productName ?? 'Produit'}</h2>
              <p className="text-slate-300">{product.brands ?? 'Marque non renseignée'}{product.quantity ? ` · ${product.quantity}` : ''}</p>
              <p className="mt-1 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">Source: OpenFoodFacts</p>
            </header>

            {product.imageUrl && <img src={product.imageUrl} alt={product.productName ?? 'Produit'} className="max-h-64 w-full rounded-xl object-contain bg-white p-2" />}

            {product.categories && product.categories.length > 0 && (
              <section className="rounded-xl border border-slate-700 p-4">
                <h3 className="mb-2 text-lg font-semibold">Catégories</h3>
                <p className="text-sm text-slate-200">{product.categories.join(', ')}</p>
              </section>
            )}

            <section className="rounded-xl border border-slate-700 p-4">
              <h3 className="mb-3 text-lg font-semibold">Prix dans les magasins</h3>

              {offersLoading && <p className="text-sm text-slate-300">Chargement des prix…</p>}

              {!offersLoading && !priceStats && (
                <p className="text-sm text-slate-300">
                  Aucune donnée prix pour l’instant. <Link to="/contribuer-prix" className="underline underline-offset-2">Contribuer</Link>
                </p>
              )}

              {!offersLoading && priceStats && (
                <>
                  <div className="mb-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2">Min: <strong>{priceStats.min.toFixed(2)} €</strong></div>
                    <div className="rounded-lg bg-cyan-500/10 p-2">Médiane: <strong>{priceStats.median.toFixed(2)} €</strong></div>
                    <div className="rounded-lg bg-rose-500/10 p-2">Max: <strong>{priceStats.max.toFixed(2)} €</strong></div>
                  </div>

                  <ul className="space-y-2">
                    {offers.slice(0, 20).map((offer, index) => (
                      <li key={`${offer.storeId ?? offer.storeName ?? 'store'}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 p-2 text-sm">
                        <div>
                          <div className="font-medium text-white">{offer.storeName ?? 'Magasin non identifié'}</div>
                          <div className="text-slate-400">{offer.city ?? '—'} • {offer.territory ?? '—'} • {formatObservedDate(offer.observedAt)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-emerald-300">{offer.price.toFixed(2)} €</div>
                          {offer.storeId && (
                            <Link to={`/store/${offer.storeId}`} className="rounded-md border border-blue-500 px-2 py-1 text-xs text-blue-200 hover:bg-blue-500/10">
                              Choisir
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <div className="flex gap-3">
              <button onClick={() => navigate('/scanner')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">Rescanner</button>
              <a
                href={`https://world.openfoodfacts.org/product/${barcode}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-emerald-500 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/10"
              >
                Voir détails OFF
              </a>
              <Link to="/scanner" className="rounded-lg border border-slate-500 px-4 py-2 text-sm">Rechercher un autre code</Link>
            </div>
          </div>
        )}

        {debugEnabled && (
          <section className="mt-6 rounded-xl border border-cyan-700 bg-cyan-950/30 p-4 text-sm text-cyan-100">
            <h2 className="mb-2 text-base font-semibold">Debug OFF</h2>
            <ul className="space-y-1">
              <li>status OFF: {offStatus ?? '—'}</li>
              <li>cache: {cacheHit ? 'hit' : 'miss'}</li>
              <li>response: {responseMs ?? 0} ms</li>
              <li className="break-all">url: {offUrl || '—'}</li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
