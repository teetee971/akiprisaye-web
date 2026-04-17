import React, { useEffect, useMemo, useState } from 'react';

interface Product {
  id: string | number;
  name: string;
  brand: string;
  price: number;
  store: string;
  tags?: string[];
  normalizedSearchContent?: string;
}

interface RawCatalogueItem {
  id?: string | number;
  name?: string;
  brand?: string;
  price?: number | string;
  store?: string;
  category?: string;
  tags?: string[];
}

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    const catalogueUrl = `${baseUrl.replace(/\/+$/, '')}/data/catalogue.json`;

    fetch(catalogueUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: RawCatalogueItem[]) => {
        if (!mounted || !Array.isArray(data)) return;

        const normalizedCatalogue: Product[] = data
          .filter((item) => typeof item?.name === 'string')
          .map((item, index) => ({
            id: item.id ?? `catalogue-${index}`,
            name: item.name ?? 'Produit',
            brand: item.brand ?? item.category ?? 'Sans marque',
            price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
            store: item.store ?? 'Magasin non précisé',
            tags: item.tags ?? [],
            normalizedSearchContent: normalize(
              `${item.name ?? ''} ${item.brand ?? ''} ${item.store ?? ''}`
            ),
          }));

        setCatalogue(normalizedCatalogue);
        setLoadError(null);
      })
      .catch((err) => {
        console.error('Erreur gisement :', err);
        if (mounted) {
          setLoadError("Impossible de charger le catalogue pour l'instant.");
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const normalizedQuery = normalize(query.trim());

    return catalogue
      .filter((item) => {
        const searchContent =
          item.normalizedSearchContent ?? normalize(`${item.name} ${item.brand} ${item.store}`);
        return searchContent.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const aSouverain = a.tags?.includes('SOUVERAIN') ? 1 : 0;
        const bSouverain = b.tags?.includes('SOUVERAIN') ? 1 : 0;
        if (aSouverain !== bSouverain) return bSouverain - aSouverain;
        return a.price - b.price;
      });
  }, [query, catalogue]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-20">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
          <input
            type="text"
            placeholder="Farine, Huile, Riz..."
            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-lg font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Chargement du catalogue…
            </p>
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <p className="text-rose-600 dark:text-rose-400 font-medium">{loadError}</p>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-3xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm active:scale-[0.97] transition-all"
                >
                  <div className="flex flex-col flex-1 pr-4">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {item.brand}
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                      <span className="mr-1">📍</span> {item.store}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {item.price.toFixed(2)}€
                    </span>
                    {item.tags?.includes('SOUVERAIN') && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 mt-1 uppercase">
                        Souverain
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : query.length > 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 dark:text-slate-500 font-medium">
                  Aucun prix trouvé pour "{query}"
                </p>
              </div>
            ) : (
              <div className="text-center py-20 space-y-4 opacity-30 dark:opacity-60">
                <span className="text-6xl block">🛒</span>
                <p className="font-bold uppercase tracking-widest text-xs text-slate-900 dark:text-slate-100">
                  Catalogue Horizon v4.7
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
