import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { useQuota } from '../hooks/useQuota';
import { usePlan } from '../hooks/usePlan';
import { cacheProductResults, saveGuestHistory, saveUserHistory } from '../services/freemium';

const sortResults = (items, sortBy) => {
  if (sortBy === 'price_desc') return [...items].sort((a, b) => Number(b.price) - Number(a.price));
  if (sortBy === 'merchant') return [...items].sort((a, b) => String(a.merchant).localeCompare(String(b.merchant)));
  return [...items].sort((a, b) => Number(a.price) - Number(b.price));
};

export default function Comparateur() {
  const { user } = useAuth();
  const { plan, isPro } = usePlan();
  const { status, consume } = useQuota();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [sortBy, setSortBy] = useState('price_asc');
  const [paywall, setPaywall] = useState(null);

  const sorted = useMemo(() => sortResults(results, sortBy), [results, sortBy]);

  const onSearch = async (event) => {
    event.preventDefault();
    setError('');
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError('Saisissez au moins 2 caractères.');
      return;
    }

    try {
      const quota = await consume();
      if (!quota.allowed && quota.remaining === 0) {
        setPaywall('quota');
        return;
      }
    } catch {
      setError('Impossible de vérifier le quota.');
      return;
    }

    setLoading(true);
    try {
      // Fetch from all sources in parallel
      const territory = 'gp';
      const isBarcode = /^\d{8,14}$/.test(trimmed);

      const [searchRes, obsRes, webRes] = await Promise.allSettled([
        // 1. /api/price-search (SerpAPI Google Shopping)
        fetch(`/api/price-search?q=${encodeURIComponent(trimmed)}&territory=${territory}`)
          .then((r) => r.ok ? r.json() : { results: [] })
          .catch(() => ({ results: [] })),
        // 2. /api/observations (contributions citoyennes, si barcode)
        isBarcode
          ? fetch(`/api/observations?barcode=${encodeURIComponent(trimmed)}&territory=${territory}`)
            .then((r) => r.ok ? r.json() : { observations: [] })
            .catch(() => ({ observations: [] }))
          : Promise.resolve({ observations: [] }),
        // 3. /api/web-price (Google Shopping enrichi)
        fetch(`/api/web-price?q=${encodeURIComponent(trimmed)}&territory=${territory}`)
          .then((r) => r.ok ? r.json() : { results: [] })
          .catch(() => ({ results: [] })),
      ]);

      const searchPayload = searchRes.status === 'fulfilled' ? searchRes.value : { results: [] };
      const obsPayload = obsRes.status === 'fulfilled' ? obsRes.value : { observations: [] };
      const webPayload = webRes.status === 'fulfilled' ? webRes.value : { results: [] };

      // Normalize all results to the same format
      const fromSearch = (searchPayload.results ?? []).map((item, i) => ({
        id: `search-${trimmed}-${i}`,
        title: item.title ?? item.name ?? trimmed,
        merchant: item.merchant ?? item.source ?? 'Web',
        price: Number(item.price ?? item.extracted_price ?? 0),
        url: item.url ?? item.link ?? '',
        source: 'price-search',
      }));

      const fromObs = (obsPayload.observations ?? []).map((obs) => ({
        id: `obs-${obs.id}`,
        title: obs.productName ?? trimmed,
        merchant: obs.storeName ?? obs.storeId ?? 'Contribution citoyenne',
        price: Number(obs.price ?? 0),
        url: '',
        source: 'observation',
      }));

      const fromWeb = (webPayload.results ?? []).map((item, i) => ({
        id: `web-${trimmed}-${i}`,
        title: item.title ?? trimmed,
        merchant: item.merchant ?? 'Web',
        price: Number(item.price ?? 0),
        url: item.url ?? '',
        source: 'web',
      }));

      // Merge and deduplicate by merchant+price
      const all = [...fromObs, ...fromSearch, ...fromWeb];
      const seen = new Set();
      const normalized = all
        .filter((item) => item.price > 0)
        .filter((item) => {
          const key = `${item.merchant.toLowerCase()}-${item.price.toFixed(2)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((item, index) => ({ ...item, id: item.id || `${trimmed}-${index}` }));

      setResults(normalized);
      cacheProductResults(normalized);
      const entry = {
        query: trimmed,
        territory,
        resultCount: normalized.length,
        topResult: normalized[0]
          ? { id: normalized[0].id, name: normalized[0].title, price: normalized[0].price }
          : undefined,
      };
      if (user) {
        await saveUserHistory(user.uid, entry);
      } else {
        saveGuestHistory(entry);
      }
    } catch {
      setError('Erreur de recherche. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">Comparateur Prix</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Territoire: <strong>FR</strong> · Plan: <strong>{plan}</strong> · Quota restant: <strong>{Math.max(status.remaining, 0)}</strong>
      </p>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          id="comp-query"
          name="query"
          className="flex-1 border rounded px-3 py-2"
          value={query}
          placeholder="Nom, marque ou code-barres"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un produit par nom, marque ou code-barres"
        />
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>
          {loading ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      <div className="flex justify-between items-center">
        <label htmlFor="comp-sort" className="text-sm">Tri:&nbsp;
          <select id="comp-sort" name="sort" className="ml-2 border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="merchant">Source</option>
          </select>
        </label>
        <Link className="text-blue-600" to="/historique">Voir historique</Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!loading && sorted.length === 0 && <p className="text-slate-500">Aucun résultat pour le moment.</p>}

      <ul className="space-y-2">
        {sorted.map((result) => (
          <li key={result.id} className="border rounded p-3 flex justify-between items-center gap-4">
            <div className="min-w-0">
              <p className="font-semibold truncate">{result.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm text-slate-500">{result.merchant}</p>
                {result.source === 'observation' && (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">👥 Citoyen</span>
                )}
                {(result.source === 'web' || result.source === 'price-search') && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">🌐 Web</span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-lg">{Number(result.price).toFixed(2)} €</p>
              <div className="flex gap-2 justify-end mt-0.5">
                {result.url && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    Voir →
                  </a>
                )}
                <Link to={`/produit/${encodeURIComponent(result.id)}`} className="text-xs text-slate-400 hover:text-blue-600">Fiche</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border rounded p-3">
        <p className="font-medium mb-2">Fonctions Pro</p>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => !isPro && setPaywall('pro_feature')}>Export CSV/PDF</button>
          <button className="px-3 py-2 border rounded" onClick={() => !isPro && setPaywall('pro_feature')}>Alertes prix</button>
          <button className="px-3 py-2 border rounded" onClick={() => !isPro && setPaywall('pro_feature')}>Insights complets</button>
        </div>
      </div>

      <PaywallModal open={Boolean(paywall)} reason={paywall || 'quota'} isGuest={!user} onClose={() => setPaywall(null)} />
    </div>
  );
}
