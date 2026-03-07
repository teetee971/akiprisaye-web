import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreSelection } from '../context/StoreSelectionContext';
import { getAlerts } from '../services/alertsService';
import type { SanitaryAlert, TerritoryCode } from '../types/alerts';

export default function AlertBanner() {
  const { selection } = useStoreSelection();
  const [criticalActiveAlerts, setCriticalActiveAlerts] = useState<SanitaryAlert[]>([]);

  useEffect(() => {
    let active = true;
    const territory = (selection?.territory ?? 'gp') as TerritoryCode;

    void getAlerts({ territory, onlyActive: true, severity: 'critical' })
      .then((result) => {
        if (!active) return;
        setCriticalActiveAlerts(result.alerts);
      })
      .catch(() => {
        if (!active) return;
        setCriticalActiveAlerts([]);
      });

    return () => {
      active = false;
    };
  }, [selection?.territory]);

  if (criticalActiveAlerts.length === 0) return null;

  return (
    <div className="border-b border-amber-700/50 bg-amber-950/30">
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm text-amber-100 flex items-center justify-between gap-3">
        <p>
          Rappel produits : {criticalActiveAlerts.length} alerte(s) critique(s)
        </p>
        <Link className="underline text-amber-200 hover:text-amber-100" to="/alertes?severity=critical&active=1">
          Voir
        </Link>
      </div>
    </div>
  );
}
