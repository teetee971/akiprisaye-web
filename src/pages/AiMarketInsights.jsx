import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkIsAdmin } from '../services/adminPanieService';
import {
  getMarketInsights,
  getInsightsHistory,
  formatPercent,
  getAlertColor,
  getCategoryColor,
} from '../services/marketInsightsService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function AiMarketInsights() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const admin = await checkIsAdmin(user);
    setIsAdmin(admin);

    if (!admin) {
      navigate('/');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [insights, historyData] = await Promise.all([
        getMarketInsights(),
        getInsightsHistory(7), // Last 7 days
      ]);
      setData(insights);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading market insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === false) {
    return null;
  }

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"
            role="status"
          >
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="text-blue-400">Chargement des données économiques...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">📊 Aucune donnée disponible</p>
          <p className="text-sm">Les analyses seront générées automatiquement chaque jour.</p>
        </div>
      </div>
    );
  }

  // Prepare category chart data
  const categoryChartData = {
    labels: data.byCategory?.map((r) => r.category) || [],
    datasets: [
      {
        label: 'Écart DOM vs Hexagone (%)',
        data: data.byCategory?.map((r) => r.avgDiff.toFixed(1)) || [],
        backgroundColor: data.byCategory?.map((r) => getCategoryColor(r.avgDiff)) || [],
      },
    ],
  };

  // Prepare territory chart data
  const territoryChartData = {
    labels: data.byTerritory?.map((r) => r.territory) || [],
    datasets: [
      {
        label: 'Écart moyen par territoire (%)',
        data: data.byTerritory?.map((r) => r.avgDiff.toFixed(1)) || [],
        backgroundColor: data.byTerritory?.map((r) => getCategoryColor(r.avgDiff)) || [],
      },
    ],
  };

  // Prepare historical trend data
  const trendData = {
    labels: history.map((h) => new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })).reverse(),
    datasets: [
      {
        label: 'Indice global (%)',
        data: history.map((h) => h.globalIndex).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#cbd5e1' },
      },
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            📊 Indice IA — Vie Chère DOM-COM
          </h1>
          <p className="text-slate-400">
            Analyse économique des écarts de prix entre les territoires d'Outre-mer et l'Hexagone
          </p>
        </div>

        {/* Main Index Card */}
        <div className={`border rounded-lg p-6 mb-8 ${getAlertColor(data.alertLevel)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-300 mb-1">
                Dernière mise à jour : {new Date(data.date).toLocaleString('fr-FR')}
              </p>
              <p className="text-4xl font-bold mb-2">{data.globalIndex.toFixed(2)}%</p>
              <p className="text-lg font-semibold">{data.alert}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Produits analysés</p>
              <p className="text-2xl font-bold">{data.metadata?.domProductsCount || 0}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4 pt-4 border-t border-current/20">
            <h3 className="text-sm font-semibold mb-2">💡 Recommandations IA</h3>
            <ul className="space-y-1">
              {data.recommendations?.map((rec, index) => (
                <li key={index} className="text-sm">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Analysis */}
          {data.byCategory && data.byCategory.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Écarts par Catégorie</h2>
              <div style={{ height: '300px' }}>
                <Bar data={categoryChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Territory Analysis */}
          {data.byTerritory && data.byTerritory.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Écarts par Territoire</h2>
              <div style={{ height: '300px' }}>
                <Bar data={territoryChartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Historical Trend */}
        {history.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Tendance 7 jours</h2>
            <div style={{ height: '250px' }}>
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Top Price Gaps */}
        {data.byCategory && data.byCategory.some((cat) => cat.topGaps && cat.topGaps.length > 0) && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Écarts les plus importants</h2>
            <div className="space-y-4">
              {data.byCategory.map(
                (cat) =>
                  cat.topGaps &&
                  cat.topGaps.length > 0 && (
                    <div key={cat.category}>
                      <h3 className="text-lg font-medium text-blue-400 mb-2">{cat.category}</h3>
                      <div className="space-y-2">
                        {cat.topGaps.map((product, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded"
                          >
                            <span className="text-sm">{product.title}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-400">
                                DOM: {product.domPrice.toFixed(2)}€ | Hex: {product.hexPrice.toFixed(2)}€
                              </span>
                              <span
                                className={`text-sm font-semibold ${
                                  product.diff > 20 ? 'text-red-400' : product.diff > 10 ? 'text-amber-400' : 'text-green-400'
                                }`}
                              >
                                {formatPercent(product.diff)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Note:</strong> Les données sont mises à jour automatiquement chaque jour à minuit (heure de Paris).
            L'analyse compare les prix des produits disponibles en DOM-COM avec les prix de référence de l'Hexagone.
          </p>
        </div>
      </div>
    </div>
  );
}
