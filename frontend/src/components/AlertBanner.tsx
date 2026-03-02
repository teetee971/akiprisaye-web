import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useStoreSelection } from '../context/StoreSelectionContext';
import { getAlerts } from '../services/alertsService';
import type { TerritoryCode } from '../services/priceSearch/price.types';

function isTerritoryCode(v: unknown): v is TerritoryCode {
  return (
    v === 'fr' ||
    v === 'gp' ||
    v === 'mq' ||
    v === 'gf' ||
    v === 're' ||
    v === 'yt' ||
    v === 'pm' ||
    v === 'bl' ||
    v === 'mf'
  );
}

export default function AlertBanner() {
  const { selection } = useStoreSelection();

  // fallback dur : on ne laisse jamais undefined passer à getAlerts
  const territory = useMemo<TerritoryCode>(() => {
    const t = selection?.territory;
    return isTerritoryCode(t) ? t : 'gp';
  }, [selection?.territory]);

  const [criticalActiveAlerts, setCriticalActiveAlerts] = useState<unknown[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getAlerts({ territory, onlyActive: true, severity: 'critical' } as any);
        const list = Array.isArray(res) ? res : (res as any)?.alerts;
        if (alive) setCriticalActiveAlerts(Array.isArray(list) ? list : []);
      } catch {
        if (alive) setCriticalActiveAlerts([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [territory]);

  if (criticalActiveAlerts.length === 0) return null;

  return (
    <div className="border-b border-amber-700/50 bg-amber-950/30">
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm text-amber-100 flex items-center justify-between gap-3">
        <p>Rappel produits : {criticalActiveAlerts.length} alerte(s) critique(s)</p>
        <Link className="underline text-amber-200 hover:text-amber-100" to="/alertes?severity=critical&active=1">
          Voir
        </Link>
      </div>
    </div>
  );
}
