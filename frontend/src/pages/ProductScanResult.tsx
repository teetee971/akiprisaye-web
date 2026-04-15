import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchOffProductDetails, type OffProductUiModel } from '../services/openFoodFacts';
import { fetchProductPrices, type PriceListing } from '../services/photoProductSearchService';
import PriceTrendWidget from '../components/PriceTrendWidget';
import ShareButton from '../components/comparateur/ShareButton';

type LoadState = 'loading' | 'success' | 'notFound' | 'errorNetwork';

function formatPrice(price: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  } catch { return dateStr; }
}

export default function ProductScanResult() {
  const { barcode = '' } = useParams();
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territoire') ?? 'mq';
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [product, setProduct] = useState<OffProductUiModel | null>(null);
  const [productSource, setProductSource] = useState<'openfoodfacts' | 'local_override' | null>(null);
  const [prices, setPrices] = useState<PriceListing[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

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
              {productSource === 'local_override' && (
                <p className="mt-1 text-xs text-slate-400">Source: Catalogue interne</p>
              )}
            </header>

            {product.image && <img src={product.image} alt={product.name ?? 'Produit'} width={400} height={256} loading="lazy" className="max-h-64 w-full rounded-xl object-contain bg-white p-2" />}

            {/* ── Tendance des prix (données observatoire réelles) ── */}
            <PriceTrendWidget
              productName={product.name}
              territory={territory}
            />

            <div className="flex flex-wrap gap-2 text-sm">
              {product.nutriScore && <span className="rounded-full bg-green-500/20 px-3 py-1">Nutri-Score {product.nutriScore}</span>}
              {product.nova && <span className="rounded-full bg-purple-500/20 px-3 py-1">NOVA {product.nova}</span>}
              {product.ecoScore && <span className="rounded-full bg-emerald-500/20 px-3 py-1">EcoScore {product.ecoScore}</span>}
            </div>

            {/* ── CTA : comparaison prix DOM-TOM ── */}
            <Link
              to={`/produit/${barcode}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <div>
                <p className="font-bold text-sm">🏷️ Comparer les prix en DOM-TOM</p>
                <p className="text-xs text-blue-100 mt-0.5">Enseignes locales, prix en temps réel</p>
              </div>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
                  {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-slate-800 animate-pulse" />)}
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
                        <p className="text-xl font-bold text-blue-400">{formatPrice(latestPrice)}</p>
                      </div>
                    )}
                  </div>

                  {/* Store comparison list — all entries sorted by price */}
                  {(() => {
                    const sorted = [...prices].sort((a, b) => a.price - b.price);
                    const worst = sorted[sorted.length - 1]?.price ?? null;
                    return sorted.map((listing, i) => {
                      const isBest = listing.price === bestPrice;
                      const savingVsWorst = worst && worst > listing.price
                        ? Math.round(((worst - listing.price) / worst) * 100)
                        : 0;
                      const storeLine = [listing.locationName, listing.locationCity, listing.locationCountry]
                        .filter(Boolean).join(' · ');
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-3 text-sm ${isBest ? 'border-green-500 bg-green-500/10' : 'border-slate-700'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-slate-500 w-5 flex-shrink-0">#{i + 1}</span>
                              <div className="min-w-0">
                                {storeLine && (
                                  <p className="font-medium text-white truncate">🏪 {storeLine}</p>
                                )}
                                {listing.date && (
                                  <p className="text-xs text-slate-500">{formatDate(listing.date)}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className={`text-lg font-bold ${isBest ? 'text-green-400' : 'text-white'}`}>
                                {formatPrice(listing.price, listing.currency)}
                              </span>
                              {isBest && (
                                <span className="block text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full text-center mt-0.5">
                                  🏆 Meilleur
                                </span>
                              )}
                              {savingVsWorst > 0 && isBest && (
                                <span className="block text-xs text-green-400 font-medium">-{savingVsWorst}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  <p className="text-xs text-slate-500">
                    Source: <a href="https://prices.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">Open Prices</a> · {prices.length} relevé{prices.length > 1 ? 's' : ''} citoyen{prices.length > 1 ? 's' : ''}
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
              <p className="text-sm text-slate-200">{product.ingredients ?? 'Ingrédients non disponibles.'}</p>
              <p className="mt-2 text-sm text-slate-300"><strong>Allergènes:</strong> {product.allergens ?? 'Non renseignés'}</p>
            </section>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/scanner')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">Rescanner</button>
              <button onClick={() => navigate('/scan-photo')} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-700">📷 Par photo</button>
              <Link to="/scanner" className="rounded-lg border border-slate-500 px-4 py-2 text-sm">Autre code</Link>
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

