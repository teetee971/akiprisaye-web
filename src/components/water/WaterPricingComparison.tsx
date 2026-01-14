/**
 * Water Pricing Comparison Component
 * Comparaison des prix de l'eau par territoire
 */

import React, { useEffect, useState } from 'react';
import type { WaterPricing, Territory } from '../../types/waterComparison';
import {
  getWaterPricing,
  comparePricing,
  calculateAnnualCost,
} from '../../services/waterPricingServiceExtended';

interface WaterPricingComparisonProps {
  territory: Territory;
  consumptionM3?: number;
}

export default function WaterPricingComparison({
  territory,
  consumptionM3 = 120, // Default: 120m³/year (average household)
}: WaterPricingComparisonProps) {
  const [pricings, setPricings] = useState<WaterPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsumption, setSelectedConsumption] = useState(consumptionM3);

  useEffect(() => {
    loadPricing();
  }, [territory]);

  async function loadPricing() {
    try {
      setLoading(true);
      setError(null);
      const data = await getWaterPricing(territory);
      setPricings(data);
    } catch (err) {
      console.error('Error loading pricing:', err);
      setError('Erreur lors du chargement des tarifs');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  if (pricings.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
        <p>Aucune donnée tarifaire disponible pour ce territoire</p>
      </div>
    );
  }

  const comparison = comparePricing(pricings);

  return (
    <div className="space-y-6">
      {/* Consumption selector */}
      <div className="bg-slate-800 rounded-lg p-4">
        <label htmlFor="consumption" className="block text-sm font-medium text-slate-300 mb-2">
          Consommation annuelle estimée
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            id="consumption"
            min="50"
            max="300"
            step="10"
            value={selectedConsumption}
            onChange={(e) => setSelectedConsumption(parseInt(e.target.value))}
            className="flex-1"
          />
          <div className="text-white font-medium w-24 text-right">
            {selectedConsumption} m³
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Moyenne nationale: ~120 m³/an pour un foyer
        </p>
      </div>

      {/* Comparison summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.cheapest && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="text-sm text-green-300 mb-1">Moins cher</div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {calculateAnnualCost(comparison.cheapest, selectedConsumption).toFixed(2)} €
            </div>
            <div className="text-sm text-green-300">{comparison.cheapest.provider}</div>
          </div>
        )}

        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Moyenne</div>
          <div className="text-2xl font-bold text-white mb-1">
            {comparison.average.toFixed(2)} €
          </div>
          <div className="text-sm text-slate-400">Par an</div>
        </div>

        {comparison.mostExpensive && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-sm text-red-300 mb-1">Plus cher</div>
            <div className="text-2xl font-bold text-red-400 mb-1">
              {calculateAnnualCost(comparison.mostExpensive, selectedConsumption).toFixed(2)} €
            </div>
            <div className="text-sm text-red-300">{comparison.mostExpensive.provider}</div>
          </div>
        )}
      </div>

      {/* Detailed pricing table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Fournisseur
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                Prix/m³
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                Assainissement
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                Abonnement
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                Coût annuel
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {pricings.map((pricing, index) => {
              const annualCost = calculateAnnualCost(pricing, selectedConsumption);
              const isCheapest = pricing.id === comparison.cheapest?.id;
              const isMostExpensive = pricing.id === comparison.mostExpensive?.id;

              return (
                <tr
                  key={pricing.id}
                  className={`${
                    isCheapest
                      ? 'bg-green-500/5'
                      : isMostExpensive
                      ? 'bg-red-500/5'
                      : ''
                  } hover:bg-slate-750 transition-colors`}
                >
                  <td className="px-4 py-3 text-white">
                    <div>
                      {pricing.provider}
                      {isCheapest && ' 🏆'}
                    </div>
                    {pricing.commune && (
                      <div className="text-xs text-slate-400">{pricing.commune}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {pricing.pricing.pricePerM3.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {pricing.pricing.sanitationPerM3?.toFixed(2) || '—'} €
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {pricing.pricing.subscriptionAnnual.toFixed(2)} €/an
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-cyan-400">
                      {annualCost.toFixed(2)} €
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Source information */}
      <div className="text-xs text-slate-400">
        <p>
          💡 Ces tarifs sont indicatifs et peuvent varier selon votre commune et votre consommation.
        </p>
        <p className="mt-1">
          Sources: Offices de l'eau, régies municipales, rapports publics
        </p>
      </div>
    </div>
  );
}
