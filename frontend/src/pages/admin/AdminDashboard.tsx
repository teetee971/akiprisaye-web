/**
 * Admin Dashboard
 * Overview page with statistics and recent activity
 */

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.name}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
                  <p className="text-sm text-slate-300">{stat.name}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Activity */}
      <GlassCard>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-slate-100">
            Dernières modifications
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Aucune activité récente
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-slate-900">{activity.action}</p>
                  </div>
                  <p className="text-sm text-slate-500">{activity.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard>
          <div className="text-center p-6">
            <Store className="w-12 h-12 mx-auto mb-4 text-slate-900" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Gérer les enseignes
            </h3>
            <p className="text-sm text-slate-600 mb-4">
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
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-900" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Gérer les articles
            </h3>
            <p className="text-sm text-slate-600 mb-4">
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
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-900" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Import en masse
            </h3>
            <p className="text-sm text-slate-600 mb-4">
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
    </div>
  );
}
