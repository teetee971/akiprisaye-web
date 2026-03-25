/**
 * Admin Dashboard
 * Overview page with statistics and recent activity
 */

import { useEffect, useMemo, useState } from 'react';
import { Store, Package, DollarSign, MapPin } from 'lucide-react';
import { GlassCard } from '../../components/ui/glass-card';

interface DashboardStats {
  storesCount: number;
  productsCount: number;
  pricesCount: number;
  territoriesCount: number;
}

interface RecentActivity {
  id: string;
  type: 'store' | 'product' | 'price';
  action: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    storesCount: 0,
    productsCount: 0,
    pricesCount: 0,
    territoriesCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | RecentActivity['type']>('all');
  const lastUpdated = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  useEffect(() => {
    loadDashboardData(true);
  }, []);

  const loadDashboardData = async (withPageLoader = false) => {
    try {
      if (withPageLoader) setLoading(true);
      // Mock data for now - replace with actual API calls
      setStats({
        storesCount: 156,
        productsCount: 2400,
        pricesCount: 12000,
        territoriesCount: 7,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'store',
          action: 'Super U Raizet ajouté',
          timestamp: 'il y a 2h',
        },
        {
          id: '2',
          type: 'product',
          action: '45 produits importés',
          timestamp: 'il y a 5h',
        },
        {
          id: '3',
          type: 'price',
          action: 'Prix Carrefour MAJ',
          timestamp: 'hier',
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Enseignes',
      value: stats.storesCount,
      icon: Store,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Articles',
      value: stats.productsCount.toLocaleString(),
      icon: Package,
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Prix',
      value: stats.pricesCount.toLocaleString(),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Territoires',
      value: stats.territoriesCount,
      icon: MapPin,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const alertItems = [
    {
      id: 'a1',
      level: 'Critique',
      message: '12 prix à valider depuis plus de 24h',
      tone: 'border-red-400/40 bg-red-500/15 text-red-100',
    },
    {
      id: 'a2',
      level: 'Important',
      message: '3 imports en échec nécessitent une reprise',
      tone: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
    },
  ];

  const activityTypeMeta: Record<RecentActivity['type'], { label: string; badgeClass: string }> = {
    store: {
      label: 'Enseigne',
      badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    },
    product: {
      label: 'Article',
      badgeClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
    },
    price: {
      label: 'Prix',
      badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    },
  };

  const filteredActivities = useMemo(
    () => recentActivity.filter((activity) => activityFilter === 'all' || activity.type === activityFilter),
    [recentActivity, activityFilter]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Tableau de bord
        </h1>
        <p className="text-slate-300">
          Vue d'ensemble de la plateforme A KI PRI SA YÉ
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-400">
            Dernière mise à jour : {lastUpdated}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs px-2.5 py-1 rounded-md border border-white/20 text-slate-200 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Alert Priority */}
      <GlassCard className="border-red-400/30">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
              Alertes prioritaires
            </h2>
            <p className="text-sm text-slate-300">
              Actions urgentes à traiter en premier.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full border border-red-300/40 bg-red-500/20 text-red-100">
            {alertItems.length} ouvertes
          </span>
        </div>
        <div className="space-y-2">
          {alertItems.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border px-3 py-2 text-sm ${alert.tone}`}
            >
              <p className="font-semibold">{alert.level}</p>
              <p className="opacity-95">{alert.message}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.name}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-none">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">{stat.name}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Activity */}
      <GlassCard>
        <div className="p-4 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-100">
              Dernières modifications
            </h2>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: 'Tout' },
                { key: 'store', label: 'Enseignes' },
                { key: 'product', label: 'Articles' },
                { key: 'price', label: 'Prix' },
              ] as const).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActivityFilter(filter.key)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    activityFilter === filter.key
                      ? 'bg-white/15 border-white/35 text-white'
                      : 'bg-transparent border-white/15 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Aucune activité pour ce filtre
              </p>
            ) : (
              filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${activityTypeMeta[activity.type].badgeClass}`}
                  >
                    {activityTypeMeta[activity.type].label}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-100">{activity.action}</p>
                  </div>
                  <p className="text-sm text-slate-300 tabular-nums">{activity.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24 sm:pb-0">
        <GlassCard>
          <div className="text-center p-6">
            <Store className="w-12 h-12 mx-auto mb-4 text-slate-100" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Gérer les enseignes
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Ajouter, modifier ou supprimer des magasins
            </p>
            <a
              href="#/admin/stores"
              className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Accéder
            </a>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-center p-6">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-100" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Gérer les articles
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Ajouter, modifier ou supprimer des produits
            </p>
            <a
              href="#/admin/products"
              className="inline-block px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Accéder
            </a>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-center p-6">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-100" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Import en masse
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Importer des données via CSV ou Excel
            </p>
            <a
              href="#/admin/import"
              className="inline-block px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Accéder
            </a>
          </div>
        </GlassCard>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/90 backdrop-blur-md border-t border-white/10 sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          <a
            href="#/admin/products/new"
            className="text-center px-3 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm font-medium transition-colors"
          >
            Ajouter un prix
          </a>
          <a
            href="#/admin/import"
            className="text-center px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            Importer
          </a>
        </div>
      </div>
    </div>
  );
}
