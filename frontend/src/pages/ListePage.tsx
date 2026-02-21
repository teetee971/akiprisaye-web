import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntitlements } from '../billing/useEntitlements';
import { assertQuotaOrThrow, QuotaExceededError } from '../billing/quotaService';
import { decideForItem } from '../domain/decision/decisionEngine';
import { addShoppingListItem, getShoppingListItems, removeShoppingListItem } from '../store/useShoppingListStore';

export default function ListePage() {
  const { can, quota, explain } = useEntitlements();
  const [items, setItems] = useState(() => getShoppingListItems());
  const [name, setName] = useState('');
  const [territories, setTerritories] = useState<string[]>(['Guadeloupe']);
  const [alerts, setAlerts] = useState<{ threshold?: number; dropPercent?: number }>({});

  const stats = useMemo(() => {
    const prices = items.flatMap((it) => it.history ?? []).filter((n): n is number => Number.isFinite(n));
    if (!prices.length) return null;
    const sum = prices.reduce((a, b) => a + b, 0);
    const sorted = [...prices].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / prices.length,
      p90: sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1],
      vol: sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0,
    };
  }, [items]);

  const recommendations = useMemo(
    () =>
      items.map((item) => ({
        itemId: item.id,
        rec: decideForItem(
          { id: item.id },
          (item.history ?? []).map((price, i) => ({
            source: item.source ?? 'local',
            price,
            currency: 'EUR',
            observedAt: item.lastObservedAt ?? new Date(Date.now() - i * 3600 * 1000).toISOString(),
          })),
        ),
      })),
    [items],
  );

  const onAdd = () => {
    if (!name.trim()) return;
    const result = addShoppingListItem(
      {
        id: name.toLowerCase(),
        name,
        quantity: 1,
        source: 'manuel',
        lastObservedAt: new Date().toISOString(),
        history: [2.4, 2.3, 2.6],
      },
      quota('maxItems'),
    );
    if (result.ok) {
      setItems(result.items);
      setName('');
    }
  };

  const refreshPrices = () => {
    try {
      assertQuotaOrThrow('refreshPerDay', quota('refreshPerDay'));
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          history: [...(it.history ?? []), Number((Math.random() * 5 + 1).toFixed(2))],
          lastObservedAt: new Date().toISOString(),
          source: it.source ?? 'refresh_local',
        })),
      );
    } catch (error) {
      if (!(error instanceof QuotaExceededError)) throw error;
    }
  };

  const exportData = () => {
    const payload = can('EXPORT_ADVANCED')
      ? JSON.stringify(items, null, 2)
      : JSON.stringify(items.map(({ id, name: itemName, quantity }) => ({ id, name: itemName, quantity })));
    const blob = new Blob([payload], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'liste-courses.json';
    a.click();
    URL.revokeObjectURL(href);
  };

  const isAtMax = items.length >= quota('maxItems');

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Liste de Courses Intelligente</h1>
      <div className="flex gap-2">
        <input className="rounded border border-slate-700 bg-slate-900 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ajouter un article" />
        <button className="rounded bg-blue-600 px-4 py-2" onClick={onAdd}>Ajouter</button>
        <button className="rounded bg-slate-700 px-4 py-2" onClick={refreshPrices}>Refresh prix</button>
        <button className="rounded bg-emerald-700 px-4 py-2" onClick={exportData}>Exporter</button>
      </div>

      {isAtMax && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-900/20 p-3 text-sm text-amber-200">
          Limite FREE atteinte ({quota('maxItems')} articles). <Link to="/upgrade" className="underline font-semibold">Passer Pro</Link>
        </div>
      )}

      <div className="rounded-lg border border-slate-700 p-3">
        <h2 className="font-semibold">Territoires</h2>
        <p className="text-sm text-slate-300">{can('MULTI_TERRITORY') ? 'Multi-territoires activé' : explain('MULTI_TERRITORY')}</p>
        <div className="mt-2 flex gap-2">
          {['Guadeloupe', 'Martinique', 'Guyane'].map((t) => (
            <button
              key={t}
              onClick={() => setTerritories((prev) => (can('MULTI_TERRITORY') ? Array.from(new Set([...prev, t])) : [prev[0] ?? 'Guadeloupe']))}
              className="rounded border border-slate-600 px-3 py-1 text-sm"
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Sélection: {territories.join(', ')}</p>
      </div>

      <div className="rounded-lg border border-slate-700 p-3">
        <h2 className="font-semibold">Historique prix</h2>
        {can('PRICE_HISTORY_ADVANCED') && stats ? (
          <p className="text-sm text-slate-200">Min: {stats.min.toFixed(2)} · Max: {stats.max.toFixed(2)} · Moy: {stats.avg.toFixed(2)} · P90: {stats.p90.toFixed(2)} · Volatilité: {stats.vol.toFixed(2)}</p>
        ) : (
          <p className="text-sm text-slate-300">Historique simple disponible (dernière observation affichée).</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-700 p-3">
        <h2 className="font-semibold">Alertes prix</h2>
        {can('PRICE_ALERTS') ? (
          <div className="flex gap-2 text-sm">
            <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1" type="number" placeholder="Seuil prix" onChange={(e) => setAlerts((a) => ({ ...a, threshold: Number(e.target.value) }))} />
            <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1" type="number" placeholder="Baisse %" onChange={(e) => setAlerts((a) => ({ ...a, dropPercent: Number(e.target.value) }))} />
            <span>Alertes actives: {alerts.threshold || alerts.dropPercent ? 'Oui' : 'Non'}</span>
          </div>
        ) : (
          <p className="text-sm text-slate-300">{explain('PRICE_ALERTS')}</p>
        )}
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const lastPrice = item.history?.[item.history.length - 1];
          const rec = recommendations.find((r) => r.itemId === item.id)?.rec;
          return (
            <li key={item.id} className="rounded border border-slate-700 p-3">

              <div className="flex items-start gap-3">
                {item.imageThumbUrl ? (
                  <img
                    data-testid="item-thumb"
                    src={item.imageThumbUrl}
                    alt={item.name ?? 'Produit'}
                    className="h-14 w-14 rounded-md object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div data-testid="item-thumb-placeholder" className="h-14 w-14 rounded-md border border-slate-700 bg-slate-800/80" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span>{item.name} × {item.quantity}</span>
                    <button className="text-red-300" onClick={() => setItems(removeShoppingListItem(item.id))}>Retirer</button>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Dernier prix: {lastPrice ? `${lastPrice.toFixed(2)} €` : 'N/A'} · Source: {item.source ?? 'local'} · Date: {item.lastObservedAt ? new Date(item.lastObservedAt).toLocaleString() : 'N/A'}
                  </div>
                  {rec && (
                    <div className="mt-1 text-sm text-blue-200">
                      Décision: <strong>{rec.verdict}</strong> — {rec.reason}
                    </div>
                  )}
                </div>
              </div>

            </li>
          );
        })}
      </ul>
    </div>
  );
}
