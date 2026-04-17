import React, { useEffect, useState } from 'react';
import { KpiCards, type KpiData } from '../components/executive/KpiCards';
import { StrategicAlertsSection } from '../components/executive/StrategicAlertsSection';
import { DecisionBacklogSection } from '../components/executive/DecisionBacklogSection';
import { computeKpis } from '../engine/analytics';
import { logEvent } from '../engine/analytics';

export function ExecutiveDashboardPage() {
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [healthScore, setHealthScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    logEvent('view_page', { page: 'executive' });

    const k = computeKpis();

    const ctrPct = Math.round(k.ctr * 100);
    const healthRaw = Math.min(
      100,
      Math.round(
        (k.totalClicks > 0 ? 30 : 0) +
          (k.totalViews > 0 ? 20 : 0) +
          (k.favoritesAdded > 0 ? 20 : 0) +
          Math.min(30, ctrPct * 3)
      )
    );

    setHealthScore(healthRaw);
    setKpis([
      { name: 'Vues produits', value: k.totalViews, trend: k.totalViews > 0 ? 'up' : 'stable' },
      { name: 'Clics CTA', value: k.totalClicks, trend: k.totalClicks > 0 ? 'up' : 'stable' },
      {
        name: 'CTR',
        value: `${ctrPct}%`,
        unit: '',
        trend: ctrPct >= 5 ? 'up' : ctrPct > 0 ? 'stable' : 'down',
      },
      {
        name: 'Favoris ajoutés',
        value: k.favoritesAdded,
        trend: k.favoritesAdded > 0 ? 'up' : 'stable',
      },
      { name: 'Variante CTA gagnante', value: k.ctaVariantWinner ?? '—', trend: 'stable' },
      { name: 'Top produit cliqué', value: k.topProducts[0]?.id ?? '—', trend: 'stable' },
    ]);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard Exécutif</h1>
      <p className="text-gray-400 text-sm mb-6">
        KPIs live · alertes stratégiques · backlog décisions
      </p>

      <div className="space-y-4">
        <KpiCards kpis={kpis} healthScore={healthScore} />
        <StrategicAlertsSection />
        <DecisionBacklogSection />
      </div>

      <p className="text-xs text-gray-600 text-center mt-8">
        Données localStorage · aucune donnée personnelle collectée · RGPD conforme.
      </p>
    </main>
  );
}

export default ExecutiveDashboardPage;
