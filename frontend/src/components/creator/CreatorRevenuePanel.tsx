import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { DailyStats } from '../../utils/priceClickTracker';

interface Analytics {
  weeklyRevenue: number;
  monthlyCtr: number;
  monthlyRevenue: number;
  payoutProgress: number;
}

interface CreatorRevenuePanelProps {
  analytics: Analytics;
  totalOnline: number;
  weeklyStats: DailyStats[];
}

const CreatorRevenuePanel: React.FC<CreatorRevenuePanelProps> = ({
  analytics,
  totalOnline,
  weeklyStats,
}) => (
  <>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Revenu 7j</p>
        <p className="text-3xl font-black text-emerald-400 mt-2">
          {analytics.weeklyRevenue.toFixed(2)} €
        </p>
      </article>
      <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">CTR mensuel</p>
        <p className="text-3xl font-black text-amber-400 mt-2">
          {(analytics.monthlyCtr * 100).toFixed(2)}%
        </p>
      </article>
      <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Audience live</p>
        <p className="text-3xl font-black text-fuchsia-400 mt-2">{totalOnline}</p>
      </article>
      <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Paiement estimé</p>
        <p className="text-3xl font-black text-slate-100 mt-2">
          {analytics.monthlyRevenue.toFixed(2)} €
        </p>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
          <div
            className="bg-emerald-500 h-1.5 rounded-full"
            style={{ width: `${Math.min(100, analytics.payoutProgress)}%` }}
          />
        </div>
      </article>
    </section>

    <section className="order-2 md:order-1 mb-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="text-emerald-400" /> Trackers d'engagement CPC
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gains sur les 30 derniers jours :{' '}
            <strong className="text-white">{analytics.monthlyRevenue.toFixed(2)} €</strong>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {weeklyStats
          .slice()
          .reverse()
          .map((stat) => (
            <div
              key={stat.date}
              className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition"
            >
              <p className="text-sm font-bold text-slate-300 w-24">
                {new Date(stat.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                })}
              </p>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="w-16 text-right">{stat.views} vues</span>
                <span className="w-16 text-right">{stat.clicks} clics</span>
              </div>
              <p className="text-lg font-black text-emerald-400 w-20 text-right">
                {stat.estimatedRevenue.toFixed(2)} €
              </p>
            </div>
          ))}
      </div>
    </section>
  </>
);

export default CreatorRevenuePanel;
