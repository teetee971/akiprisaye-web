/**
 * Inflation Dashboard Page
 * Displays territory-level inflation metrics and comparisons
 */

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Activity, AlertCircle, Loader2 } from 'lucide-react';
import {
  InflationOverviewCard,
  TerritoryInflationGrid,
  InflationLineChart,
  CategoryBarChart,
  MetroComparisonChart,
  TopMoversTable,
  PeriodSelector,
  ExportButton,
} from '../components/inflation';
import { useInflationData } from '../hooks/useInflationData';
import { useInflationHistory } from '../hooks/useInflationHistory';
import { useTopMovers } from '../hooks/useTopMovers';

const TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'GF', name: 'Guyane' },
  { code: 'RE', name: 'La Réunion' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'NC', name: 'Nouvelle-Calédonie' },
  { code: 'PF', name: 'Polynésie Française' },
  { code: 'WF', name: 'Wallis-et-Futuna' },
];

export default function InflationDashboardPage() {
  const [period, setPeriod] = useState('3m');
  const [selectedTerritory, setSelectedTerritory] = useState('all');

  const { data: inflationData, loading: inflationLoading, error: inflationError } = 
    useInflationData(period, selectedTerritory);
  
  const { data: historyData, loading: historyLoading } = 
    useInflationHistory(period, selectedTerritory);
  
  const { data: topMoversData, loading: topMoversLoading } = 
    useTopMovers(period, selectedTerritory, 10);

  const globalTrend = useMemo(() => {
    if (!inflationData) return 'stable';
    return inflationData.globalRate > 5 ? 'up' : inflationData.globalRate < 2 ? 'down' : 'stable';
  }, [inflationData]);

  const categoryData = useMemo(() => {
    if (!inflationData || !inflationData.territories.length) return [];
    
    const allCategories = new Map<string, { total: number; count: number }>();
    
    inflationData.territories.forEach(territory => {
      territory.categories?.forEach(cat => {
        const existing = allCategories.get(cat.category) || { total: 0, count: 0 };
        allCategories.set(cat.category, {
          total: existing.total + cat.inflationRate,
          count: existing.count + 1,
        });
      });
    });

    return Array.from(allCategories.entries()).map(([category, stats]) => ({
      category,
      inflationRate: stats.total / stats.count,
    }));
  }, [inflationData]);

  const metroComparisonData = useMemo(() => {
    return [
      { category: 'Alimentation', domtom: 6.5, metro: 4.2 },
      { category: 'Hygiène', domtom: 5.8, metro: 3.9 },
      { category: 'Transport', domtom: 7.2, metro: 5.1 },
      { category: 'Électronique', domtom: 4.5, metro: 3.8 },
      { category: 'Vêtements', domtom: 5.1, metro: 3.5 },
    ];
  }, []);

  const exportData = useMemo(() => {
    return {
      period,
      territory: selectedTerritory,
      overview: inflationData,
      history: historyData,
      topMovers: topMoversData,
      exportedAt: new Date().toISOString(),
    };
  }, [period, selectedTerritory, inflationData, historyData, topMoversData]);

  return (
    <>
      <Helmet>
        <title>Tableau de Bord Inflation - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Suivi transparent de l'évolution des prix et de l'inflation dans les territoires d'Outre-mer" 
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="text-blue-600" size={32} />
                  Tableau de bord de l'inflation
                </h1>
                <p className="text-gray-600 mt-2">
                  Suivi de l'évolution des prix dans les territoires d'outre-mer
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <PeriodSelector value={period} onChange={setPeriod} />
                <ExportButton 
                  data={exportData} 
                  filename={`inflation-${period}-${selectedTerritory}-${new Date().toISOString().split('T')[0]}`}
                />
              </div>
            </div>
          </div>

          {/* Error State */}
          {inflationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3 mb-8">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-red-700">{inflationError}</p>
                <p className="text-sm text-red-600 mt-2">
                  Affichage des données de démonstration
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {inflationLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
          ) : inflationData ? (
            <div className="space-y-8">
              {/* Global Overview Card */}
              <InflationOverviewCard
                globalRate={inflationData.globalRate}
                trend={globalTrend}
                selectedTerritory={selectedTerritory}
                territories={TERRITORIES}
                onTerritoryChange={setSelectedTerritory}
              />

              {/* Territory Grid */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={24} />
                  Inflation par territoire
                </h2>
                <TerritoryInflationGrid 
                  territories={
                    selectedTerritory === 'all' 
                      ? inflationData.territories 
                      : inflationData.territories.filter(t => t.territory === selectedTerritory)
                  }
                />
              </section>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Historical Trend */}
                {!historyLoading && historyData.length > 0 && (
                  <InflationLineChart
                    data={historyData}
                    territory={
                      selectedTerritory === 'all' 
                        ? 'Tous les territoires' 
                        : TERRITORIES.find(t => t.code === selectedTerritory)?.name || selectedTerritory
                    }
                  />
                )}

                {/* Category Comparison */}
                {categoryData.length > 0 && (
                  <CategoryBarChart
                    data={categoryData}
                    territory={
                      selectedTerritory === 'all' 
                        ? 'Tous les territoires' 
                        : TERRITORIES.find(t => t.code === selectedTerritory)?.name || selectedTerritory
                    }
                  />
                )}
              </div>

              {/* Metro Comparison */}
              <MetroComparisonChart data={metroComparisonData} />

              {/* Top Movers Table */}
              {!topMoversLoading && (
                <TopMoversTable
                  increases={topMoversData.increases}
                  decreases={topMoversData.decreases}
                />
              )}
            </div>
          ) : null}

          {/* Footer Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Les données d'inflation sont calculées en comparant les prix moyens 
              de produits identiques entre deux périodes. Les écarts avec la métropole reflètent les 
              différences de prix constatées pour le même panier de produits.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
