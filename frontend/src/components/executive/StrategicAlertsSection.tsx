import React from 'react';

export interface StrategicRisk {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation?: string;
}

interface StrategicAlertsSectionProps {
  risks?: StrategicRisk[];
}

const severityStyles: Record<StrategicRisk['severity'], string> = {
  critical: 'border-red-600 bg-red-950',
  high: 'border-orange-600 bg-orange-950',
  medium: 'border-yellow-600 bg-yellow-950',
  low: 'border-gray-600 bg-gray-800',
};

const severityLabel: Record<StrategicRisk['severity'], string> = {
  critical: '🔴 Critique',
  high: '🟠 Élevé',
  medium: '🟡 Moyen',
  low: '⚪ Faible',
};

export function StrategicAlertsSection({ risks = [] }: StrategicAlertsSectionProps) {
  if (risks.length === 0) {
    return (
      <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">⚠️ Alertes stratégiques</h2>
        <p className="text-gray-400 text-sm">Aucune alerte stratégique détectée. Système stable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-3">
        ⚠️ Alertes stratégiques ({risks.length})
      </h2>
      <ul className="space-y-2">
        {risks.map((risk) => (
          <li key={risk.id} className={`border rounded-lg p-3 ${severityStyles[risk.severity]}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold">{severityLabel[risk.severity]}</span>
              <span className="text-xs text-gray-400">{risk.type}</span>
            </div>
            <p className="text-sm text-white">{risk.message}</p>
            {risk.recommendation && (
              <p className="text-xs text-gray-300 mt-1 italic">→ {risk.recommendation}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default StrategicAlertsSection;
