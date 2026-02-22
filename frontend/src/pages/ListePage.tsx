import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntitlements } from '../billing/useEntitlements';
import { assertQuotaOrThrow, QuotaExceededError } from '../billing/quotaService';
import { decideForItem } from '../domain/decision/decisionEngine';
import { addShoppingListItem, getShoppingListItems, getUserAccessState, isPremiumAccessActive, removeShoppingListItem, setUserPlan, startPremiumTrial } from '../store/useShoppingListStore';
import { simulateMonthlySavings } from '../domain/shoppingList/premium';

export default function ListePage() {
  const { can, quota, explain } = useEntitlements();
  const [items, setItems] = useState(() => getShoppingListItems());
  const [name, setName] = useState('');
  const [territories, setTerritories] = useState<string[]>(['Guadeloupe']);
  const [alerts, setAlerts] = useState<{ threshold?: number; dropPercent?: number }>({});
  const [userAccess, setUserAccess] = useState(() => getUserAccessState());
  const [isPremiumEnabled, setIsPremiumEnabled] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPremium = isPremiumAccessActive(userAccess);

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


  const savingsSimulation = useMemo(() => simulateMonthlySavings(
    items.map((item) => ({
      quantity: item.quantity,
      lastPrice: item.history?.[item.history.length - 1],
      trend30: item.premium?.trend30,
      priceHistory: (item.history ?? []).map((price, index, array) => ({
        price,
        observedAt: new Date(Date.now() - ((array.length - 1 - index) * 24 * 60 * 60 * 1000)).toISOString(),
      })),
    })),
  ), [items]);

  const displaySavings = isPremium ? `${savingsSimulation.potentialSavings.toFixed(2)} €` : `${Math.floor(savingsSimulation.potentialSavings)}€ ···`;

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


      <div className="rounded-lg border border-slate-700 p-3">
        <h2 className="font-semibold">Mode Premium</h2>
        <p className="text-sm text-slate-300">
          Plan actuel: <strong>{userAccess.userPlan === 'premium' ? 'Premium' : 'Gratuit'}</strong>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            className="rounded border border-slate-600 px-3 py-1 text-sm"
            onClick={() => {
              setUserPlan('free');
              setUserAccess(getUserAccessState());
              setIsPremiumEnabled(false);
            }}
          >
            Basculer en Free
          </button>
          <button
            className="rounded border border-emerald-600 px-3 py-1 text-sm"
            onClick={() => {
              setUserPlan('premium');
              setUserAccess(getUserAccessState());
            }}
          >
            Basculer en Premium
          </button>
          <button
            className="rounded border border-indigo-500 px-3 py-1 text-sm"
            onClick={() => {
              startPremiumTrial();
              setUserAccess(getUserAccessState());
              setShowUpgradeModal(false);
            }}
          >
            Essai gratuit 7 jours
          </button>
          <label className="ml-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPremiumEnabled}
              disabled={!isPremium}
              onChange={(event) => setIsPremiumEnabled(event.target.checked)}
            />
            Activer l'affichage premium
          </label>
        </div>
        <div className="mt-3 rounded border border-indigo-500/40 bg-indigo-950/20 p-3 text-sm">
          <p className="font-medium">Simulateur d'économie mensuelle</p>
          <p className="text-indigo-100">Vous auriez pu économiser ce mois-ci : <strong>{displaySavings}</strong></p>
          {!isPremium && (
            <button className="mt-2 rounded bg-indigo-600 px-3 py-1 text-xs" onClick={() => setShowUpgradeModal(true)}>
              Débloquer analyse complète
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {['Voir tendance 30 jours', 'Voir recommandation détaillée', 'Activer alerte personnalisée'].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded border border-slate-600 px-2 py-1"
              onClick={() => {
                if (!isPremium) setShowUpgradeModal(true);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const lastPrice = item.history?.[item.history.length - 1];
          const rec = recommendations.find((r) => r.itemId === item.id)?.rec;
          return (
            <li key={item.id} className="rounded border border-slate-700 p-3">
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
                  {isPremiumEnabled && isPremium && (
                    <div className="mt-1 rounded border border-indigo-500/40 bg-indigo-900/20 px-2 py-1 text-xs text-indigo-100">
                      <span>
                        {item.normalized?.normalizedLabel ?? 'Prix unitaire indisponible'} · Trend 7j: {item.premium?.trend7 ?? 'flat'} · Trend 30j: {item.premium?.trend30 ?? 'flat'}
                      </span>
                      <span className="ml-2">Score: {item.premium?.score ?? 0}/100</span>
                      {item.premium?.alerts?.length ? <span className="ml-2">Alertes: {item.premium.alerts.join(' | ')}</span> : null}
                    </div>
                  )}
                  {rec && (
                    <div className="mt-1 text-sm text-blue-200">
                      Décision: <strong>{rec.verdict}</strong> — {rec.reason}
                    </div>
                  )}
                </div>
              </div>
<<<<<<< HEAD

=======
>>>>>>> origin/main
            </li>
          );
        })}
      </ul>

      {showUpgradeModal && !isPremium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-indigo-500/40 bg-slate-900 p-5">
            <h3 className="text-xl font-semibold">Optimisez vos achats intelligemment</h3>
            <p className="mt-2 text-sm text-slate-300">
              Détection automatique des meilleures périodes, alertes personnalisées, comparaison multi-magasins et simulation d'économies mensuelles.
            </p>
            <div className="mt-4 rounded border border-indigo-500/30 bg-indigo-950/20 p-3 text-sm">
              <p>Premium: <strong>2.99€ / mois</strong> ou <strong>24.99€ / an</strong></p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="rounded bg-indigo-600 px-3 py-2 text-sm"
                onClick={() => {
                  startPremiumTrial();
                  setUserAccess(getUserAccessState());
                  setShowUpgradeModal(false);
                }}
              >
                Essai gratuit 7 jours
              </button>
              <button className="rounded border border-slate-600 px-3 py-2 text-sm" onClick={() => setShowUpgradeModal(false)}>
                Continuer en version gratuite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
