/**
 * Route Before/After Comparison Component
 * 
 * Displays a side-by-side comparison of unoptimized vs optimized routes
 * Shows savings in distance, time, fuel, and CO2 emissions
 */

import { TrendingDown, Clock, MapPin, Fuel, Leaf, ArrowRight } from 'lucide-react';
import type { OptimalRoute } from '../utils/routeOptimization';

interface RouteBeforeAfterComparisonProps {
  route: OptimalRoute;
  className?: string;
}

export default function RouteBeforeAfterComparison({ 
  route, 
  className = '' 
}: RouteBeforeAfterComparisonProps) {
  // Calculate unoptimized metrics (each store visited individually)
  const unoptimizedDistance = route.stores.reduce((sum, store) => sum + (store.distance * 2), 0);
  const unoptimizedTime = Math.round((unoptimizedDistance / 30) * 60); // 30 km/h average
  const unoptimizedFuel = (unoptimizedDistance * 6) / 100; // 6L/100km
  const unoptimizedCO2 = unoptimizedFuel * 2.3; // 2.3 kg CO2/L

  // Optimized metrics
  const optimizedDistance = route.totalDistance;
  const optimizedTime = route.totalTime;
  const optimizedFuel = (optimizedDistance * 6) / 100;
  const optimizedCO2 = optimizedFuel * 2.3;

  // Calculate percentage savings (guard against division by zero)
  const distanceSavingsPercent = unoptimizedDistance > 0 
    ? ((unoptimizedDistance - optimizedDistance) / unoptimizedDistance * 100).toFixed(0)
    : '0';
  const timeSavingsPercent = unoptimizedTime > 0
    ? ((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(0)
    : '0';
  const fuelSavingsPercent = unoptimizedFuel > 0
    ? ((unoptimizedFuel - optimizedFuel) / unoptimizedFuel * 100).toFixed(0)
    : '0';
  const co2SavingsPercent = unoptimizedCO2 > 0
    ? ((unoptimizedCO2 - optimizedCO2) / unoptimizedCO2 * 100).toFixed(0)
    : '0';

  return (
    <div className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-emerald-300">
          Comparaison Avant / Après Optimisation
        </h3>
      </div>

      {/* Main comparison grid */}
      <div className="space-y-4">
        {/* Distance */}
        <ComparisonRow
          icon={<MapPin className="w-5 h-5 text-blue-400" />}
          label="Distance totale"
          before={unoptimizedDistance.toFixed(1)}
          after={optimizedDistance.toFixed(1)}
          unit="km"
          savingsPercent={distanceSavingsPercent}
          savings={route.savings.distance.toFixed(1)}
        />

        {/* Time */}
        <ComparisonRow
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          label="Temps de trajet"
          before={unoptimizedTime.toString()}
          after={optimizedTime.toString()}
          unit="min"
          savingsPercent={timeSavingsPercent}
          savings={(unoptimizedTime - optimizedTime).toFixed(0)}
        />

        {/* Fuel */}
        <ComparisonRow
          icon={<Fuel className="w-5 h-5 text-orange-400" />}
          label="Carburant"
          before={unoptimizedFuel.toFixed(1)}
          after={optimizedFuel.toFixed(1)}
          unit="L"
          savingsPercent={fuelSavingsPercent}
          savings={route.savings.fuel.toFixed(1)}
        />

        {/* CO2 */}
        <ComparisonRow
          icon={<Leaf className="w-5 h-5 text-green-400" />}
          label="Émissions CO₂"
          before={unoptimizedCO2.toFixed(1)}
          after={optimizedCO2.toFixed(1)}
          unit="kg"
          savingsPercent={co2SavingsPercent}
          savings={route.savings.co2.toFixed(1)}
        />
      </div>

      {/* Summary badge */}
      <div className="mt-5 p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-300 font-medium">Économie globale</p>
            <p className="text-xs text-emerald-400/80">En optimisant votre itinéraire</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-300">
              {distanceSavingsPercent}%
            </p>
            <p className="text-xs text-emerald-400/80">de distance en moins</p>
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-xs text-blue-200">
          <strong>Méthode :</strong> L'itinéraire "avant" correspond à des allers-retours séparés vers chaque magasin. 
          L'itinéraire "après" utilise l'algorithme du voyageur de commerce pour minimiser la distance totale.
        </p>
      </div>
    </div>
  );
}

/**
 * Individual comparison row component
 */
interface ComparisonRowProps {
  icon: React.ReactNode;
  label: string;
  before: string;
  after: string;
  unit: string;
  savingsPercent: string;
  savings: string;
}

function ComparisonRow({ 
  icon, 
  label, 
  before, 
  after, 
  unit, 
  savingsPercent, 
  savings 
}: ComparisonRowProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      {/* Label with icon */}
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>

      {/* Comparison */}
      <div className="flex items-center justify-between gap-3">
        {/* Before */}
        <div className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1">Avant</div>
          <div className="text-lg font-bold text-red-400">
            {before} <span className="text-sm font-normal text-gray-500">{unit}</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <ArrowRight className="w-5 h-5 text-emerald-400" />
        </div>

        {/* After */}
        <div className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1">Après</div>
          <div className="text-lg font-bold text-emerald-400">
            {after} <span className="text-sm font-normal text-gray-500">{unit}</span>
          </div>
        </div>

        {/* Savings badge */}
        <div className="flex-shrink-0 ml-2">
          <div className="bg-emerald-900/40 border border-emerald-600/50 rounded-lg px-3 py-2 min-w-[80px]">
            <div className="text-xs text-emerald-300 font-semibold text-center">
              -{savingsPercent}%
            </div>
            <div className="text-[10px] text-emerald-400/70 text-center">
              -{savings} {unit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
