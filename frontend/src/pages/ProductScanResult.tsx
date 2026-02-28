import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchOffProductDetails, type OffProductUiModel } from '../services/openFoodFacts';

type LoadState = 'loading' | 'success' | 'notFound' | 'errorNetwork';

export default function ProductScanResult() {
  const { barcode = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [product, setProduct] = useState<OffProductUiModel | null>(null);
  const [productSource, setProductSource] = useState<'openfoodfacts' | 'local_override' | null>(null);

  const loadProduct = useCallback(async () => {
    setState('loading');
    const result = await fetchOffProductDetails(barcode);

    if (result.status === 'OK' && result.ui) {
      setProduct(result.ui);
      setProductSource(result.source ?? result.ui.source ?? null);
      setState('success');
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
              {productSource === 'local_override' && (
                <p className="mt-1 text-xs text-slate-400">Source: Catalogue interne</p>
              )}
            </header>

            {product.image && <img src={product.image} alt={product.name ?? 'Produit'} className="max-h-64 w-full rounded-xl object-contain bg-white p-2" />}

            <div className="flex flex-wrap gap-2 text-sm">
              {product.nutriScore && <span className="rounded-full bg-green-500/20 px-3 py-1">Nutri-Score {product.nutriScore}</span>}
              {product.nova && <span className="rounded-full bg-purple-500/20 px-3 py-1">NOVA {product.nova}</span>}
              {product.ecoScore && <span className="rounded-full bg-emerald-500/20 px-3 py-1">EcoScore {product.ecoScore}</span>}
            </div>

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
