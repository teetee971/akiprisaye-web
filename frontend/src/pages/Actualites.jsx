import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { newsFallback } from '../data/newsFallback';

const TERRITORY_LABELS = {
  all: 'Tous territoires',
  gp: 'Guadeloupe',
  mq: 'Martinique',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
  fr: 'France',
};

const TYPE_LABELS = {
  bons_plans: 'Bons plans',
  rappels: 'Rappels',
  reglementaire: 'Réglementaire',
  indice: 'Indice',
  dossiers: 'Dossiers',
  press: 'Presse',
  partner: 'Partenaire',
  user: 'Utilisateur',
};

const IMPACT_LABELS = { fort: 'Fort', moyen: 'Moyen', info: 'Info' };
const TYPE_OPTIONS = Object.keys(TYPE_LABELS);
const IMPACT_OPTIONS = Object.keys(IMPACT_LABELS);

export default function Actualites() {
  const [territory, setTerritory] = useState('all');
  const [type, setType] = useState('');
  const [impact, setImpact] = useState('');
  const [q, setQ] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [limit, setLimit] = useState(30);
  const [state, setState] = useState({ status: 'loading', items: [], mode: 'mock' });
  const [openEvidence, setOpenEvidence] = useState({});

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading' }));
      const params = new URLSearchParams({ territory, limit: String(limit) });
      if (type) params.set('type', type);
      if (impact) params.set('impact', impact);
      if (q.trim()) params.set('q', q.trim());

      try {
        const response = await fetch(`/api/news?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`api_${response.status}`);
        const payload = await response.json();
        if (!mounted) return;
        const items = Array.isArray(payload.items) ? payload.items : [];
        setState({ status: 'success', items, mode: payload.mode ?? 'mock' });
      } catch {
        if (!mounted) return;
        setState({ status: 'error', items: newsFallback, mode: 'degraded' });
      }
    };

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [territory, type, impact, q, limit]);

  const displayedItems = useMemo(() => {
    const sorted = [...state.items].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
    return verifiedOnly ? sorted.filter((item) => item.verified) : sorted;
  }, [state.items, verifiedOnly]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Actualités & Bons plans consommateurs | A KI PRI SA YÉ</title>
        <meta name="description" content="Rappels sanitaires, bons plans vérifiés, réglementaire et signaux conso avec source obligatoire." />
      </Helmet>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-2xl font-semibold">Actualités & Bons plans consommateurs</h1>
        <p className="mt-2 text-sm text-slate-300">Mode API: <span className="font-medium text-slate-100">{state.mode}</span></p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur space-y-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un mot-clé"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <select value={territory} onChange={(e) => setTerritory(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
            {Object.entries(TERRITORY_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Vérifiés seulement
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setType('')} className={`rounded-full px-3 py-1 text-xs ${!type ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>Tous modules</button>
          {TYPE_OPTIONS.map((value) => (
            <button key={value} onClick={() => setType(value)} className={`rounded-full px-3 py-1 text-xs ${type === value ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>
              {TYPE_LABELS[value]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setImpact('')} className={`rounded-full px-3 py-1 text-xs ${!impact ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>Tous impacts</button>
          {IMPACT_OPTIONS.map((value) => (
            <button key={value} onClick={() => setImpact(value)} className={`rounded-full px-3 py-1 text-xs ${impact === value ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>
              {IMPACT_LABELS[value]}
            </button>
          ))}
        </div>
      </section>

      {state.status === 'loading' && <p className="text-sm text-slate-400">Chargement des actualités...</p>}
      {state.status === 'error' && <p className="text-sm text-amber-300">API indisponible: fallback embarqué affiché.</p>}
      {displayedItems.length === 0 && state.status !== 'loading' && <p className="text-sm text-slate-400">Aucun résultat pour ces filtres.</p>}

      <section className="grid gap-4">
        {displayedItems.map((item) => {
          const evidenceOpen = Boolean(openEvidence[item.id]);
          return (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-slate-800 px-2 py-1">{TERRITORY_LABELS[item.territory] ?? item.territory}</span>
                <span className="rounded bg-slate-800 px-2 py-1">{IMPACT_LABELS[item.impact] ?? item.impact}</span>
                {item.verified && <span className="rounded bg-emerald-700/70 px-2 py-1">Vérifié</span>}
                {item.isSponsored && <span className="rounded bg-amber-700/70 px-2 py-1">Sponsorisé</span>}
              </div>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{item.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <a href={item.source_url} target="_blank" rel="noreferrer" className="underline">Source: {item.source_name}</a>
                <span>{new Date(item.published_at).toLocaleString('fr-FR')}</span>
                {item.canonical_url && <a href={item.canonical_url} target="_blank" rel="noreferrer" className="underline">Voir détail</a>}
              </div>

              {item.evidence && (
                <div className="mt-3">
                  <button className="text-xs underline" onClick={() => setOpenEvidence((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}>
                    {evidenceOpen ? 'Masquer' : 'Afficher'} les preuves
                  </button>
                  {evidenceOpen && (
                    <ul className="mt-2 list-disc pl-5 text-xs text-slate-300">
                      {Object.entries(item.evidence).map(([key, value]) => <li key={key}><strong>{key}</strong>: {String(value)}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <button onClick={() => setLimit((prev) => prev + 30)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm">
        Charger plus
      </button>
    </div>
  );
}
