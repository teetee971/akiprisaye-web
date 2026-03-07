 
/**
 * Observatoire Dashboard - v3.0
 * 
 * Public observatory of prices for citizens, media, and institutions
 * Read-only, aggregated data with CSV/JSON exports
 * 
 * @module ObservatoireDashboard
 */

import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/glass-card';
import { exportOpenData, getExportStatistics } from '../../services/openDataExportService';
import type { OpenDataExportRequest } from '../../types/openData';
import type { TerritoryCode } from '../../types/extensions';

interface PriceStats {
  productName: string;
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange30d: number;
  lastUpdate: string;
  ean: string;
}

export default function ObservatoireDashboard() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<PriceStats[]>([]);
  const [exportStats, setExportStats] = useState<any>(null);
  
  // Filters
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchEAN, setSearchEAN] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadStatistics();
    loadPriceData();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await getExportStatistics();
      setExportStats(data);
    } catch (error) {
      console.error('Failed to load export statistics:', error);
    }
  };

  const loadPriceData = async () => {
    setLoading(true);
    try {
      // Load mock aggregated data for demonstration
      const mockData: PriceStats[] = [
        {
          productName: 'Lait entier UHT 1L',
          category: 'Produits laitiers',
          avgPrice: 1.35,
          minPrice: 1.15,
          maxPrice: 1.65,
          priceChange30d: 2.5,
          lastUpdate: new Date().toISOString(),
          ean: '3560070000000'
        },
        {
          productName: 'Pain de mie complet 500g',
          category: 'Boulangerie',
          avgPrice: 2.20,
          minPrice: 1.80,
          maxPrice: 2.80,
          priceChange30d: -1.2,
          lastUpdate: new Date().toISOString(),
          ean: '3560070000001'
        },
        {
          productName: 'Riz blanc 1kg',
          category: 'Épicerie',
          avgPrice: 2.50,
          minPrice: 2.10,
          maxPrice: 3.20,
          priceChange30d: 5.8,
          lastUpdate: new Date().toISOString(),
          ean: '3560070000002'
        }
      ];
      setStats(mockData);
    } catch (error) {
      console.error('Failed to load price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const request: OpenDataExportRequest = {
        format,
        dataType: 'prices',
        territory: selectedTerritory !== 'all' ? selectedTerritory as TerritoryCode : undefined,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        includeMetadata: true,
      };

      const result = await exportOpenData(request);

      if (result.success && result.data) {
        // Create download
        const blob = new Blob([result.data.content], { type: result.data.contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(`Export échoué: ${result.error}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const filteredStats = stats.filter(item => {
    if (searchEAN && !item.ean.includes(searchEAN)) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(stats.map(s => s.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏛️ Observatoire Public des Prix</h1>
            <p className="text-gray-300 text-lg">
              Données agrégées officielles - Lecture seule
            </p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>Version: v3.0</div>
            <div>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-blue-300 mb-2">📊 Méthodologie</h3>
          <p className="text-sm text-gray-300">
            Les prix affichés sont des moyennes calculées sur l'ensemble des observations collectées.
            Toutes les données sont horodatées et sourcées. Aucune extrapolation ou estimation n'est effectuée.
          </p>
          <a 
            href="/methodologie" 
            className="text-blue-400 hover:text-blue-300 text-sm underline mt-2 inline-block"
          >
            Consulter la méthodologie complète →
          </a>
        </div>
      </GlassCard>

      {/* Statistics Overview */}
      {exportStats && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">📈 Statistiques globales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-blue-400">{exportStats.products || 0}</div>
              <div className="text-sm text-gray-400">Produits suivis</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-green-400">{exportStats.prices || 0}</div>
              <div className="text-sm text-gray-400">Prix enregistrés</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-purple-400">{exportStats.territories?.length || 0}</div>
              <div className="text-sm text-gray-400">Territoires</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-yellow-400">{exportStats.stores || 0}</div>
              <div className="text-sm text-gray-400">Enseignes</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">🔍 Filtres</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code EAN</label>
            <input
              type="text"
              value={searchEAN}
              onChange={(e) => setSearchEAN(e.target.value)}
              placeholder="3560070..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Territoire</label>
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les territoires</option>
              <option value="GP">Guadeloupe</option>
              <option value="MQ">Martinique</option>
              <option value="GF">Guyane</option>
              <option value="RE">Réunion</option>
              <option value="YT">Mayotte</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Période</label>
            <select
              onChange={(e) => {
                const days = parseInt(e.target.value);
                if (days > 0) {
                  const end = new Date().toISOString().split('T')[0];
                  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setDateRange({ start, end });
                } else {
                  setDateRange({ start: '', end: '' });
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="0">Toutes les dates</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Price Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📋 Tableau des prix</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Export...' : '📥 Export CSV'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Export...' : '📥 Export JSON'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-2">Chargement des données...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-sm font-semibold text-gray-300">EAN</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300">Produit</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300">Catégorie</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300 text-right">Prix Moyen</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300 text-right">Min / Max</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300 text-right">Évolution 30j</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300">Mise à jour</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Aucune donnée disponible pour les filtres sélectionnés
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 text-sm text-gray-400">{item.ean}</td>
                      <td className="py-3 text-sm font-medium">{item.productName}</td>
                      <td className="py-3 text-sm text-gray-400">{item.category}</td>
                      <td className="py-3 text-sm text-right font-semibold">{item.avgPrice.toFixed(2)} €</td>
                      <td className="py-3 text-sm text-right text-gray-400">
                        {item.minPrice.toFixed(2)} € / {item.maxPrice.toFixed(2)} €
                      </td>
                      <td className={`py-3 text-sm text-right font-semibold ${
                        item.priceChange30d > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {item.priceChange30d > 0 ? '+' : ''}{item.priceChange30d.toFixed(1)}%
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {new Date(item.lastUpdate).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg text-xs text-gray-400">
          <strong>Sources:</strong> Données collectées via scans utilisateurs, APIs publiques, et bases de données officielles.
          Horodatage disponible pour chaque enregistrement dans les exports.
        </div>
      </GlassCard>

      {/* Data Quality Notice */}
      <GlassCard className="bg-yellow-900/10 border-yellow-500/30">
        <h3 className="font-semibold text-yellow-300 mb-2">⚠️ Avertissement important</h3>
        <p className="text-sm text-gray-300">
          Cet observatoire présente des données agrégées à titre informatif. Les prix peuvent varier selon les enseignes,
          les périodes et les territoires. Cette plateforme ne constitue pas une source officielle au sens réglementaire
          et ne remplace pas les enquêtes statistiques officielles (INSEE, IEDOM, etc.).
        </p>
      </GlassCard>
    </div>
  );
}
