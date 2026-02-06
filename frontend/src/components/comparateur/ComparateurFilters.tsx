type Product = {
  ean: string;
  produit: string;
  unite: string;
};

type ComparateurFiltersProps = {
  products: Product[];
  communes: string[];
  selectedProduct: string;
  selectedCommune: string;
  onProductChange: (ean: string) => void;
  onCommuneChange: (commune: string) => void;
};

export default function ComparateurFilters({
  products,
  communes,
  selectedProduct,
  selectedCommune,
  onProductChange,
  onCommuneChange,
}: ComparateurFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🔎</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Filtrer les résultats
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sélectionnez un produit et optionnellement une commune
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Filter */}
        <div>
          <label htmlFor="product-filter" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Produit
          </label>
          <select
            id="product-filter"
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Sélectionner un produit...</option>
            {products.map((product) => (
              <option key={product.ean} value={product.ean}>
                {product.produit} ({product.unite})
              </option>
            ))}
          </select>
        </div>

        {/* Commune Filter */}
        <div>
          <label htmlFor="commune-filter" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Commune (optionnel)
          </label>
          <select
            id="commune-filter"
            value={selectedCommune}
            onChange={(e) => onCommuneChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Toutes les communes</option>
            {communes.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedProduct || selectedCommune) && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Filtres actifs :
            </span>
            {selectedProduct && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                {products.find((p) => p.ean === selectedProduct)?.produit || 'Produit'}
              </span>
            )}
            {selectedCommune && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                📍 {selectedCommune}
              </span>
            )}
            <button
              onClick={() => {
                onProductChange('');
                onCommuneChange('');
              }}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline ml-2"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
