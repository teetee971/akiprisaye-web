import { useEffect, useMemo, useState } from 'react';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { fetchProductFromOpenFoodFacts } from '../data/openFoodFacts';

type CatalogueItem = {
  ean: string;
  name: string;
  brand?: string | null;
  size?: string | null;
  category?: string | null;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
  priceLabel?: string | null;
  ingredients?: string | null;
  nutriScore?: string | null;
  ecoScore?: string | null;
  source?: string;
};

const fallbackCategory = 'Autres';
const CATEGORY_LABELS: Record<string, string> = {
  boissons: 'Boissons',
  épicerie: 'Épicerie',
  laitage: 'Laitages',
  laitages: 'Laitages',
  apéritif: 'Apéritif',
  'petit-déjeuner': 'Petit-déjeuner',
};
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  boissons: 'Sodas, eaux, jus et boissons chaudes.',
  épicerie: 'Pâtes, riz, huiles et essentiels du placard.',
  laitage: 'Produits frais, laits et fromages.',
  laitages: 'Produits frais, laits et fromages.',
  apéritif: 'Chips, snacks et produits apéritifs.',
  'petit-déjeuner': 'Céréales, pâtes à tartiner et cafés.',
};

export default function CatalogueProduits() {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let isActive = true;

    const loadCatalogue = async () => {
      setLoading(true);

      const baseItems = SEED_PRODUCTS.map((product) => {
        const prices = product.prices || [];
        const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;
        const currency = prices[0]?.currency ?? 'EUR';
        const priceLabel = minPrice !== null
          ? `à partir de ${minPrice.toFixed(2)} ${currency === 'EUR' ? '€' : currency}`
          : null;

        return {
          ean: product.ean,
          name: product.name,
          brand: product.brand,
          size: product.size,
          category: product.category,
          image: product.image || null,
          price: minPrice,
          currency,
          priceLabel,
          source: 'seed',
        };
      });

      const enriched = await Promise.all(
        baseItems.map(async (item) => {
          const offProduct = await fetchProductFromOpenFoodFacts(item.ean);

          if (!offProduct) {
            return item;
          }

          return {
            ...item,
            name: offProduct.name || item.name,
            brand: offProduct.brand || item.brand,
            size: offProduct.quantity || item.size,
            category: offProduct.category || item.category,
            image: offProduct.imageSmallUrl || offProduct.imageUrl || item.image,
            ingredients: offProduct.ingredients,
            nutriScore: offProduct.nutriScore,
            ecoScore: offProduct.ecoScore,
            source: offProduct.source || item.source,
          };
        }),
      );

      if (isActive) {
        setItems(enriched);
        setLoading(false);
      }
    };

    loadCatalogue();

    return () => {
      isActive = false;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(
      items.map((item) => item.category?.trim()).filter(Boolean) as string[],
    );
    return [fallbackCategory, ...Array.from(unique).sort()];
  }, [items]);

  const categoryStats = useMemo(() => {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
      const categoryKey = item.category?.trim() || fallbackCategory;
      acc[categoryKey] = (acc[categoryKey] || 0) + 1;
      return acc;
    }, {});

    return categories.map((category) => ({
      key: category,
      label: CATEGORY_LABELS[category] || category,
      description: CATEGORY_DESCRIPTIONS[category] || 'Sélection de produits du catalogue.',
      count: counts[category] || 0,
    }));
  }, [categories, items]);

  const activeCategoryMeta = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        label: 'Toutes les catégories',
        description: 'Parcourez l’ensemble des produits disponibles.',
        count: items.length,
      };
    }

    const match = categoryStats.find((category) => category.key === selectedCategory);
    return match
      ? { label: match.label, description: match.description, count: match.count }
      : { label: selectedCategory, description: 'Sélection de produits du catalogue.', count: 0 };
  }, [categoryStats, items.length, selectedCategory]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return items;
    }
    if (selectedCategory === fallbackCategory) {
      return items.filter((item) => !item.category);
    }
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white dark:bg-slate-900 shadow-md border-b border-blue-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧺</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Catalogue Produits
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Parcourez les produits par catégorie avec photos et informations détaillées.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Catégories
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              Toutes ({items.length})
            </button>
            {categoryStats.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setSelectedCategory(category.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === category.key
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {activeCategoryMeta.label} • {activeCategoryMeta.count} article{activeCategoryMeta.count > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {activeCategoryMeta.description}
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`catalogue-skeleton-${index}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse"
              >
                <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-600 dark:text-slate-300">
              Aucun produit disponible pour cette catégorie pour le moment.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.ean}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg flex flex-col gap-4"
              >
                <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.category || fallbackCategory}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.name}
                  </h3>
                  {item.brand && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Marque : <span className="font-semibold">{item.brand}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {item.size && (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                      {item.size}
                    </span>
                  )}
                  {item.priceLabel && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {item.priceLabel}
                    </span>
                  )}
                  {item.nutriScore && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                      Nutri-Score {item.nutriScore.toUpperCase()}
                    </span>
                  )}
                  {item.ecoScore && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      Eco-Score {item.ecoScore.toUpperCase()}
                    </span>
                  )}
                </div>
                {item.ingredients && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Ingrédients
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4">
                      {item.ingredients}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Source : {item.source === 'openfoodfacts' ? 'Open Food Facts' : 'Base locale'}
                </p>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
