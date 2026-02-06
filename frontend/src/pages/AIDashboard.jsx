import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { checkIsAdmin } from '../services/adminPanieService';
import {
  getTodayBaskets,
  getForecast,
  computeKpis,
  generateRecommendations,
  prepareChartData,
} from '../services/aiDashboardService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AIDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [territory, setTerritory] = useState('');
  const [_baskets, setBaskets] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [kpis, setKpis] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, territory]);

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

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [basketsData, forecastData] = await Promise.all([
        getTodayBaskets(territory),
        getForecast(territory),
      ]);

      setBaskets(basketsData);
      setForecast(forecastData);

      const kpisData = computeKpis({ baskets: basketsData, forecast: forecastData });
      setKpis(kpisData);

      const recs = generateRecommendations({ baskets: basketsData, forecast: forecastData, kpis: kpisData });
      setRecommendations(recs);

      const chart = prepareChartData(forecastData);
      setChartData(chart);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === false) {
    return null;
  }

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div
          className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
          role="status"
        >
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    );
  }

  const _chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#cbd5e1' },
      },
      title: {
        display: true,
        text: 'Tendance 7 jours - Stock, Ventes & Prévisions IA',
        color: '#cbd5e1',
        font: { size: 16 },
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-600 bg-red-900/20';
      case 'medium':
        return 'border-yellow-600 bg-yellow-900/20';
      case 'low':
        return 'border-blue-600 bg-blue-900/20';
      default:
        return 'border-slate-600 bg-slate-900/20';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📊';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            🤖 Tableau de Bord IA - Ti-Panié
          </h1>
          <p className="text-slate-400">
            Analyse prédictive en temps réel des stocks et de la demande
          </p>
        </div>

        {/* Territory Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Filtrer par territoire
          </label>
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les territoires</option>
            <option value="Guadeloupe">Guadeloupe</option>
            <option value="Martinique">Martinique</option>
            <option value="Guyane">Guyane</option>
          </select>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-2">🧺</div>
            <div className="text-2xl font-bold text-blue-400">{kpis.totalBaskets || 0}</div>
            <div className="text-sm text-slate-400">Paniers du jour</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-400">{kpis.totalSavings || '0.00'}€</div>
            <div className="text-sm text-slate-400">Économies potentielles</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-yellow-400">{kpis.ruptureRate || 0}%</div>
            <div className="text-sm text-slate-400">Taux de rupture</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-blue-400">{kpis.inStockCount || 0}</div>
            <div className="text-sm text-slate-400">En stock</div>
          </div>
        </div>

        {/* Chart */}
        {chartData && chartData.labels && chartData.labels.length > 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8 text-center text-slate-400">
            <p>📊 Données de prévision disponibles (graphique désactivé temporairement)</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8 text-center text-slate-400">
            <p>📊 Aucune donnée de prévision disponible. Les données seront générées automatiquement par l'IA.</p>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Recommandations IA
          </h2>
          
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{getPriorityIcon(rec.priority)}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 mb-1">
                        {rec.priority === 'high' && 'URGENT'}
                        {rec.priority === 'medium' && 'ATTENTION'}
                        {rec.priority === 'low' && 'INFO'}
                      </div>
                      <p className="text-slate-300">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">
              Aucune recommandation pour le moment.
            </p>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Note:</strong> Les prévisions IA sont générées automatiquement toutes les 24h par analyse
            des tendances historiques. Les données sont mises à jour en temps réel depuis Firestore.
          </p>
        </div>
      </div>
    </div>
  );
}
