/**
 * Water Consumption Calculator
 * Calculateur de consommation et économies d'eau
 */

import React, { useState, useEffect } from 'react';
import type { WaterConsumptionProfile, Territory } from '../../types/waterComparison';
import {
  estimateConsumption,
  calculateTotalSavings,
  getEasyWins,
} from '../../services/waterConsumptionService';

export default function ConsumptionCalculator() {
  const [profile, setProfile] = useState<WaterConsumptionProfile>({
    householdSize: 3,
    showers: 21, // 3 showers/day * 7 days
    baths: 0,
    dishwasher: true,
    washingMachine: true,
    garden: false,
    pool: false,
  });

  const [territory, setTerritory] = useState<Territory>('GP');
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateEstimate();
  }, [profile, territory]);

  async function calculateEstimate() {
    setLoading(true);
    try {
      const result = await estimateConsumption(profile, territory);
      setEstimate(result);
    } catch (error) {
      console.error('Error calculating estimate:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalSavings = estimate ? calculateTotalSavings(estimate) : null;
  const easyWins = estimate ? getEasyWins(estimate) : [];

  return (
    <div className="space-y-6">
      {/* Profile configuration */}
      <div className="bg-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Votre profil</h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre de personnes
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={profile.householdSize}
            onChange={(e) =>
              setProfile({ ...profile, householdSize: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Douches par semaine
          </label>
          <input
            type="number"
            min="0"
            value={profile.showers}
            onChange={(e) =>
              setProfile({ ...profile, showers: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={profile.dishwasher}
              onChange={(e) =>
                setProfile({ ...profile, dishwasher: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700"
            />
            <span>Lave-vaisselle</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={profile.washingMachine}
              onChange={(e) =>
                setProfile({ ...profile, washingMachine: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700"
            />
            <span>Lave-linge</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={profile.garden}
              onChange={(e) =>
                setProfile({ ...profile, garden: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700"
            />
            <span>Jardin</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={profile.pool}
              onChange={(e) =>
                setProfile({ ...profile, pool: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700"
            />
            <span>Piscine</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : estimate ? (
        <>
          {/* Consumption estimate */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-400">
                {estimate.estimation.dailyM3.toFixed(1)} m³
              </div>
              <div className="text-sm text-slate-400">Par jour</div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-400">
                {estimate.estimation.monthlyM3.toFixed(0)} m³
              </div>
              <div className="text-sm text-slate-400">Par mois</div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-400">
                {estimate.estimation.annualM3.toFixed(0)} m³
              </div>
              <div className="text-sm text-slate-400">Par an</div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-400">
                {estimate.estimation.annualCost.toFixed(0)} €
              </div>
              <div className="text-sm text-slate-400">Coût annuel</div>
            </div>
          </div>

          {/* Easy wins */}
          {easyWins.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">
                💡 Économies faciles
              </h3>
              <div className="space-y-3">
                {easyWins.map((saving, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="text-green-400 mt-1">✓</div>
                    <div className="flex-1">
                      <div className="text-white">{saving.action}</div>
                      <div className="text-sm text-green-300">
                        Économie: {saving.savingsM3.toFixed(1)} m³/an (~
                        {saving.savingsEuros.toFixed(0)} €/an)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total savings potential */}
          {totalSavings && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Potentiel d'économie total
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {totalSavings.totalM3.toFixed(0)} m³
                  </div>
                  <div className="text-sm text-slate-400">Économie/an</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {totalSavings.totalEuros.toFixed(0)} €
                  </div>
                  <div className="text-sm text-slate-400">Économie/an</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {totalSavings.percentageReduction.toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-400">Réduction</div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
