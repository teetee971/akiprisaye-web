import { useMemo } from 'react';
import { ShoppingBasket, TrendingUp, Eye, Clock } from 'lucide-react';

interface QuickSummaryProps {
  averageBasket: number;
  territorialGap: number; // percentage
  productsUnderSurveillance: number;
  lastUpdate: Date;
  className?: string;
}

// Create DateTimeFormat instance once at module level for performance
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function QuickSummary({
  averageBasket,
  territorialGap,
  productsUnderSurveillance,
  lastUpdate,
  className,
}: QuickSummaryProps) {
  const formatDate = (date: Date) => {
    return dateFormatter.format(date);
  };

  // Memoize color and sign calculations to optimize re-renders
  const { gapColor, gapSign } = useMemo(() => {
    let color = 'text-gray-400';
    if (territorialGap > 0) color = 'text-rose-400';
    else if (territorialGap < 0) color = 'text-emerald-400';

    return {
      gapColor: color,
      gapSign: territorialGap > 0 ? '+' : '',
    };
  }, [territorialGap]);

  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 ${className || ''}`}
    >
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Résumé express</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Basket */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBasket className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Panier moyen observé
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-100">{averageBasket.toFixed(2)} €</p>
        </div>

        {/* Territorial Gap */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Écart territorial
            </span>
          </div>
          <p className={`text-2xl font-bold ${gapColor}`}>
            {gapSign}
            {territorialGap} %
          </p>
          <p className="text-xs text-gray-500 mt-1">vs métropole</p>
        </div>

        {/* Products Under Surveillance */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Produits surveillés
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-100">
            {productsUnderSurveillance.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Last Update */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Dernière mise à jour
            </span>
          </div>
          <p className="text-sm font-medium text-gray-200 leading-tight">
            {formatDate(lastUpdate)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-xs text-blue-200 text-center leading-relaxed">
          Données issues de sources publiques officielles (INSEE, OPMR, DGCCRF)
        </p>
      </div>
    </div>
  );
}
