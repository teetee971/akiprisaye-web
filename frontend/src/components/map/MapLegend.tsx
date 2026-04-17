import { getAllPriceCategories } from '../../utils/priceColors';

export default function MapLegend() {
  const categories = getAllPriceCategories();

  return (
    <div
      className="absolute bottom-6 right-4 bg-white shadow-lg rounded-lg p-3 z-[1000]"
      role="region"
      aria-label="Légende de la carte"
    >
      <h4 className="text-sm font-semibold text-slate-900 mb-2">Indice de prix</h4>
      <div className="space-y-2">
        {categories.map(({ category, config }) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: config.color }}
              aria-hidden="true"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-slate-700">{config.label}</span>
              <span className="text-xs text-slate-500 ml-1">
                ({config.range[0]}-{config.range[1]})
              </span>
            </div>
            <span className="text-sm" role="img" aria-label={config.label}>
              {config.icon}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          L'indice de prix compare les magasins sur un panier de référence
        </p>
      </div>
    </div>
  );
}
