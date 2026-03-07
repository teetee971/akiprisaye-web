import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AlertProductImage from '../components/alerts/AlertProductImage';
import { useStoreSelection } from '../context/StoreSelectionContext';
import { getAlerts } from '../services/alertsService';

const severityOptions = [
  { value: '', label: 'Toutes sévérités' },
  { value: 'critical', label: 'Critique' },
  { value: 'important', label: 'Importante' },
  { value: 'info', label: 'Information' },
];

const categoryOptions = [
  { value: '', label: 'Toutes catégories' },
  { value: 'bébé', label: 'Bébé' },
  { value: 'épicerie', label: 'Épicerie' },
  { value: 'viande/poisson', label: 'Viande / poisson' },
  { value: 'hygiène', label: 'Hygiène' },
];

export default function Alertes() {
  const { selection } = useStoreSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const territory = selection?.territory ?? 'gp';

  const [onlyActive, setOnlyActive] = useState(searchParams.get('active') === '1');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [severity, setSeverity] = useState(searchParams.get('severity') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [alerts, setAlerts] = useState([]);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    let mounted = true;
    getAlerts({
      territory,
      onlyActive,
      category: category || undefined,
      severity: severity || undefined,
      q: q || undefined,
    }).then((result) => {
      if (!mounted) return;
      setAlerts(result.alerts);
      setMetadata(result.metadata);
    });

    return () => {
      mounted = false;
    };
  }, [territory, onlyActive, category, severity, q]);

  const syncQueryString = (next) => {
    const params = new window.URLSearchParams();
    if (next.onlyActive) params.set('active', '1');
    if (next.category) params.set('category', next.category);
    if (next.severity) params.set('severity', next.severity);
    if (next.q) params.set('q', next.q);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-bold mb-2">Alertes sanitaires</h1>
      <p className="text-sm text-slate-400 mb-6">Territoire: <strong className="uppercase">{territory}</strong></p>
      <p className="text-xs text-slate-500 mb-6">
        Source: {metadata?.source === 'fallback' ? 'fallback local' : 'RappelConso'}
        {metadata?.fetchedAt ? ` • fraîcheur ${new Date(metadata.fetchedAt).toLocaleString('fr-FR')}` : ''}
      </p>

      <section className="grid md:grid-cols-4 gap-3 mb-6">
        <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => {
              const nextValue = e.target.checked;
              setOnlyActive(nextValue);
              syncQueryString({ onlyActive: nextValue, category, severity, q });
            }}
          />
          <span className="text-sm">Actives uniquement</span>
        </label>

        <select
          className="bg-slate-900 border border-slate-700 rounded-lg p-2"
          value={category}
          onChange={(e) => {
            const nextValue = e.target.value;
            setCategory(nextValue);
            syncQueryString({ onlyActive, category: nextValue, severity, q });
          }}
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          className="bg-slate-900 border border-slate-700 rounded-lg p-2"
          value={severity}
          onChange={(e) => {
            const nextValue = e.target.value;
            setSeverity(nextValue);
            syncQueryString({ onlyActive, category, severity: nextValue, q });
          }}
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Rechercher (titre, marque, lot, EAN...)"
          value={q}
          className="bg-slate-900 border border-slate-700 rounded-lg p-2"
          onChange={(e) => {
            const nextValue = e.target.value;
            setQ(nextValue);
            syncQueryString({ onlyActive, category, severity, q: nextValue });
          }}
        />
      </section>

      <section className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs uppercase text-slate-400 mb-1">{alert.severity} • {alert.status}</p>
            <div className="flex gap-3 items-start">
              <AlertProductImage
                ean={alert.ean}
                category={alert.category}
                alt={alert.productName ?? alert.title}
                size={56}
              />
              <div>
                <h2 className="font-semibold text-lg">{alert.title}</h2>
                <p className="text-sm text-slate-300 mt-2">{alert.reason}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {alert.publishedAt ? `Publié le ${new Date(alert.publishedAt).toLocaleDateString('fr-FR')} • ` : ''}
              {alert.category ? `${alert.category} • ` : ''}
              {alert.brand ? `${alert.brand} • ` : ''}
              {alert.ean ? `EAN ${alert.ean} • ` : ''}
              {alert.lot ? `Lot ${alert.lot}` : ''}
            </p>
            <Link className="inline-block mt-3 text-blue-300 hover:text-blue-200 underline" to={`/alertes/${alert.id}`}>
              Voir détails
            </Link>
          </article>
        ))}

        {alerts.length === 0 && (
          <p className="text-slate-400">Aucune alerte sanitaire ne correspond à vos filtres.</p>
        )}
      </section>
    </div>
  );
}
