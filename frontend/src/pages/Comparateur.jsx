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
      const response = await fetch(`/api/price-search?q=${encodeURIComponent(trimmed)}&territory=fr`);
      const payload = await response.json();
      const normalized = (payload.results ?? []).map((item, index) => ({ ...item, id: `${trimmed}-${index}` }));
      setResults(normalized);
      cacheProductResults(normalized);
      const entry = {
        query: trimmed,
        territory: 'fr',
        resultCount: normalized.length,
        topResult: normalized[0]
          ? { id: normalized[0].id, name: normalized[0].title, price: Number(normalized[0].price) }
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
        <label className="text-sm">Tri: 
          <select className="ml-2 border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
          <li key={result.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-semibold">{result.title}</p>
              <p className="text-sm text-slate-500">{result.merchant}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{result.price} €</p>
              <Link to={`/p/${encodeURIComponent(result.id)}`} className="text-sm text-blue-600">Détail produit</Link>
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
