import React from 'react';
import { KpiCards } from '../components/executive/KpiCards';
import { StrategicAlertsSection } from '../components/executive/StrategicAlertsSection';
import { DecisionBacklogSection } from '../components/executive/DecisionBacklogSection';

export function ExecutiveDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard Exécutif</h1>
      <p className="text-gray-400 text-sm mb-6">KPIs plateforme, alertes stratégiques et backlog décisions</p>

      <div className="space-y-4">
        <KpiCards />
        <StrategicAlertsSection />
        <DecisionBacklogSection />
      </div>

      <p className="text-xs text-gray-600 text-center mt-8">
        Données générées par Executive OS — mise à jour automatique via workflow.
      </p>
    </main>
  );
}

export default ExecutiveDashboardPage;
