import { useMemo, useState } from 'react';
import { filterActiveAlerts } from '../services/alertsService';
import { getPreferredTerritory } from '../utils/userPreferences';

export default function Alertes() {
  const [territory, setTerritory] = useState(getPreferredTerritory());
  const [severity, setSeverity] = useState('all');

  const alerts = useMemo(() => filterActiveAlerts({ territory, severity: severity === 'all' ? undefined : severity }), [territory, severity]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-bold mb-4">Alertes prix</h1>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={territory} onChange={(e) => setTerritory(e.target.value)}>
          <option value="gp">Guadeloupe</option>
          <option value="mq">Martinique</option>
          <option value="fr">France hexagonale</option>
        </select>
        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="all">Toutes sévérités</option>
          <option value="critical">Critique</option>
          <option value="warning">Avertissement</option>
          <option value="info">Information</option>
        </select>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs uppercase text-slate-400 mb-1">{alert.severity}</p>
            <h2 className="font-semibold">{alert.title}</h2>
            <p className="text-sm text-slate-300">{alert.message}</p>
            <p className="text-xs text-slate-500 mt-2">Source: {alert.sourceName}</p>
          </article>
        ))}
        {alerts.length === 0 && <p className="text-slate-400">Aucune alerte active pour ces filtres.</p>}
      </div>
    </main>
  );
}
