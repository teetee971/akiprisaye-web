import { Link } from 'react-router-dom';
import { getTopActiveAlert } from '../services/alertsService';
import { getPreferredTerritory } from '../utils/userPreferences';

export default function AlertBanner() {
  const alert = getTopActiveAlert(getPreferredTerritory());

  if (!alert) return null;

  const tone = alert.severity === 'critical' ? 'border-red-700 bg-red-950/60' : alert.severity === 'warning' ? 'border-amber-700 bg-amber-950/40' : 'border-blue-700 bg-blue-950/40';

  return (
    <div className={`border-b ${tone}`}>
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm flex items-center justify-between gap-3">
        <p className="text-slate-100 truncate"><strong>{alert.title}</strong> — {alert.message}</p>
        <Link className="text-blue-300 shrink-0 underline" to="/alertes">Voir détails</Link>
      </div>
    </div>
  );
}
