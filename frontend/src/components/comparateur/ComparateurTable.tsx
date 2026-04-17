type ObservatoireData = {
  commune: string;
  enseigne: string;
  categorie: string;
  produit: string;
  ean: string;
  unite: string;
  prix: number;
};

type ComparateurTableProps = {
  data: ObservatoireData[];
  selectedProduct: string;
};

export default function ComparateurTable({ data, selectedProduct }: ComparateurTableProps) {
  if (!selectedProduct || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {!selectedProduct ? 'Sélectionnez un produit' : 'Aucun résultat'}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {!selectedProduct
            ? 'Choisissez un produit dans les filtres ci-dessus pour voir la comparaison des prix.'
            : 'Aucun prix trouvé pour cette combinaison de filtres.'}
        </p>
      </div>
    );
  }

  // Trouver les prix min et max
  const prices = data.map((item) => item.prix);
  const minPrix = Math.min(...prices);
  const maxPrix = Math.max(...prices);

  // Grouper par commune si plusieurs communes
  const communes = [...new Set(data.map((item) => item.commune))];
  const groupByCommune = communes.length > 1;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {data.length} {data.length > 1 ? 'résultats trouvés' : 'résultat trouvé'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {data[0]?.produit} ({data[0]?.unite})
            </p>
          </div>
          {data.length > 0 && (
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600 px-6 py-3 rounded-xl">
                <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                  🟢 Prix minimum
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {minPrix.toFixed(2)} €
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-500 dark:border-red-600 px-6 py-3 rounded-xl">
                <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                  🔴 Prix maximum
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {maxPrix.toFixed(2)} €
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results by Commune */}
      {groupByCommune ? (
        <div className="space-y-6">
          {communes.map((commune) => {
            const communeData = data.filter((item) => item.commune === commune);
            return (
              <div
                key={commune}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📍</span>
                    <span>{commune}</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Enseigne
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Indicateur
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {communeData.map((item, idx) => {
                        const isMin = item.prix === minPrix;
                        const isMax = item.prix === maxPrix;
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🏪</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {item.enseigne}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`text-xl font-bold ${
                                  isMin
                                    ? 'text-green-600 dark:text-green-400'
                                    : isMax
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {item.prix.toFixed(2)} €
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isMin && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-md">
                                  <span>🟢</span>
                                  <span>Moins cher</span>
                                </span>
                              )}
                              {isMax && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full shadow-md">
                                  <span>🔴</span>
                                  <span>Plus cher</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Single table for one commune
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Enseigne
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Indicateur
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.map((item, idx) => {
                  const isMin = item.prix === minPrix;
                  const isMax = item.prix === maxPrix;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏪</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {item.enseigne}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-xl font-bold ${
                            isMin
                              ? 'text-green-600 dark:text-green-400'
                              : isMax
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.prix.toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isMin && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-md">
                            <span>🟢</span>
                            <span>Moins cher</span>
                          </span>
                        )}
                        {isMax && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full shadow-md">
                            <span>🔴</span>
                            <span>Plus cher</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile-Friendly Card View */}
      <div className="md:hidden space-y-4">
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 px-2">
          Vue mobile optimisée :
        </div>
        {groupByCommune
          ? communes.map((commune) => {
              const communeData = data.filter((item) => item.commune === commune);
              return (
                <div key={commune} className="space-y-3">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📍</span>
                      <span>{commune}</span>
                    </h4>
                  </div>
                  {communeData.map((item, idx) => {
                    const isMin = item.prix === minPrix;
                    const isMax = item.prix === maxPrix;
                    return (
                      <div
                        key={idx}
                        className={`bg-white dark:bg-slate-900 rounded-xl border-2 ${
                          isMin
                            ? 'border-green-500'
                            : isMax
                              ? 'border-red-500'
                              : 'border-slate-200 dark:border-slate-700'
                        } p-4 shadow-md`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏪</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {item.enseigne}
                            </span>
                          </div>
                          {isMin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                              <span>🟢</span>
                            </span>
                          )}
                          {isMax && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                              <span>🔴</span>
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            isMin
                              ? 'text-green-600'
                              : isMax
                                ? 'text-red-600'
                                : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.prix.toFixed(2)} €
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          : data.map((item, idx) => {
              const isMin = item.prix === minPrix;
              const isMax = item.prix === maxPrix;
              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-slate-900 rounded-xl border-2 ${
                    isMin
                      ? 'border-green-500'
                      : isMax
                        ? 'border-red-500'
                        : 'border-slate-200 dark:border-slate-700'
                  } p-4 shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏪</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {item.enseigne}
                      </span>
                    </div>
                    {isMin && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        <span>🟢</span>
                      </span>
                    )}
                    {isMax && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        <span>🔴</span>
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isMin
                        ? 'text-green-600'
                        : isMax
                          ? 'text-red-600'
                          : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.prix.toFixed(2)} €
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
