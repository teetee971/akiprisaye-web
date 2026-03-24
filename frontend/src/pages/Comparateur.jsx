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

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const scoreProductMatch = (product, query) => {
  const q = normalize(query);
  if (!q) return 0;

  const fields = [
    product.name,
    product.brand,
    product.ean,
    ...(Array.isArray(product.synonyms) ? product.synonyms : []),
  ].map((item) => normalize(item));

  if (fields.some((field) => field === q)) return 100;
  if (fields.some((field) => field.startsWith(q))) return 80;
  if (fields.some((field) => field.includes(q))) return 60;
  return 0;
};

const normalizeTerritoryCode = (territory) => {
  const cleaned = normalize(territory).replace(/[^a-z0-9]/g, '');
  if (!cleaned) return 'gp';
  if (cleaned === 'france' || cleaned === 'metropole') return 'fr';
  return cleaned;
};

const formatStoreLabel = (storeId) => {
  const raw = String(storeId ?? '').trim();
  if (!raw) return 'Prix local';
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatObservedAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const searchLocalFallback = async (query) => {
  try {
    const base = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${base}data/expanded-prices.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const products = Array.isArray(payload?.products) ? payload.products : [];
    const observations = Array.isArray(payload?.observations) ? payload.observations : [];
    if (!products.length || !observations.length) return [];

    const matchedProducts = products
      .map((product) => ({ product, score: scoreProductMatch(product, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.product);

    if (!matchedProducts.length) return [];

    const productMap = new Map(matchedProducts.map((product) => [product.id, product]));
    const latestByProductStore = new Map();

    for (const obs of observations) {
      const productId = obs?.productId;
      if (!productMap.has(productId)) continue;
      const storeKey = `${productId}::${obs.storeId || 'store'}`;
      const previous = latestByProductStore.get(storeKey);
      if (!previous || String(obs.observedAt || '') > String(previous.observedAt || '')) {
        latestByProductStore.set(storeKey, obs);
      }
    }

    return Array.from(latestByProductStore.values())
      .filter((obs) => Number(obs.price) > 0)
      .map((obs, index) => {
        const product = productMap.get(obs.productId);
        return {
          id: `local-${obs.productId}-${obs.storeId || index}`,
          title: product?.name || query,
          merchant: formatStoreLabel(obs.storeId),
          price: Number(obs.price),
          url: '',
          observedAt: obs.observedAt || null,
          source: 'local-fallback',
        };
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 20);
  } catch {
    return [];
  }
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
  const territory = useMemo(() => {
    if (typeof window === 'undefined') return 'gp';
    const stored = window.localStorage.getItem('akiprisaye-territory')
      || window.localStorage.getItem('territory')
      || 'gp';
    return normalizeTerritoryCode(stored);
  }, []);

  const sorted = useMemo(() => sortResults(results, sortBy), [results, sortBy]);
  const comparisonInsight = useMemo(() => {
    if (sorted.length < 2) return null;
    const cheapest = sorted[0];
    const priciest = sorted[sorted.length - 1];
    const savings = Number(priciest.price) - Number(cheapest.price);
    if (savings <= 0) return null;
    return {
      cheapest,
      priciest,
      savings,
    };
  }, [sorted]);
  const usesLocalFallback = useMemo(
    () => sorted.some((item) => item.source === 'local-fallback'),
    [sorted],
  );
  const staleLocalFallback = useMemo(() => {
    const localDates = sorted
      .filter((item) => item.source === 'local-fallback' && item.observedAt)
      .map((item) => new Date(item.observedAt));
    if (!localDates.length) return false;
    const newest = localDates.reduce((max, current) => (current > max ? current : max), localDates[0]);
    const daysOld = (Date.now() - newest.getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 30;
  }, [sorted]);

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
        observedAt: item.observedAt ?? null,
        source: 'price-search',
      }));

      const fromObs = (obsPayload.observations ?? []).map((obs) => ({
        id: `obs-${obs.id}`,
        title: obs.productName ?? trimmed,
        merchant: obs.storeName ?? obs.storeId ?? 'Contribution citoyenne',
        price: Number(obs.price ?? 0),
        url: '',
        observedAt: obs.observedAt ?? null,
        source: 'observation',
      }));

      const fromWeb = (webPayload.results ?? []).map((item, i) => ({
        id: `web-${trimmed}-${i}`,
        title: item.title ?? trimmed,
        merchant: item.merchant ?? 'Web',
        price: Number(item.price ?? 0),
        url: item.url ?? '',
        observedAt: item.observedAt ?? null,
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

      const fallback = normalized.length === 0 ? await searchLocalFallback(trimmed) : [];
      const mergedResults = normalized.length > 0 ? normalized : fallback;

      setResults(mergedResults);
      cacheProductResults(mergedResults);
      const entry = {
        query: trimmed,
        territory,
        resultCount: mergedResults.length,
        topResult: mergedResults[0]
          ? { id: mergedResults[0].id, name: mergedResults[0].title, price: mergedResults[0].price }
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
        Territoire: <strong>{territory.toUpperCase()}</strong> · Plan: <strong>{plan}</strong> · Quota restant: <strong>{Math.max(status.remaining, 0)}</strong>
      </p>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          id="comp-query"
          name="query"
          className="flex-1 min-w-0 border rounded px-3 py-2"
          value={query}
          placeholder="Nom, marque ou code-barres"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un produit par nom, marque ou code-barres"
        />
        <button type="submit" className="flex-shrink-0 px-4 py-2 rounded bg-blue-600 text-white whitespace-nowrap" disabled={loading}>
          {loading ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <label htmlFor="comp-sort" className="text-sm">Tri:&nbsp;
          <select id="comp-sort" name="sort" className="ml-2 border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="merchant">Source</option>
          </select>
        </label>
        <Link className="text-blue-600 text-sm" to="/historique">Voir historique</Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!loading && sorted.length === 0 && <p className="text-slate-500">Aucun résultat pour le moment.</p>}
      {!loading && sorted.length === 0 && query.trim().length >= 2 && (
        <p className="text-xs text-slate-400">
          Astuce : essayez un terme plus générique (ex : “lait”, “riz”, “huile”) ou le code-barres.
        </p>
      )}
      {comparisonInsight && (
        <div className="rounded border border-emerald-300/50 bg-emerald-50/60 dark:bg-emerald-900/20 px-3 py-2 text-sm">
          💡 Économie potentielle : <strong>{comparisonInsight.savings.toFixed(2)} €</strong> entre{' '}
          <strong>{comparisonInsight.cheapest.merchant}</strong> et{' '}
          <strong>{comparisonInsight.priciest.merchant}</strong>.
        </div>
      )}
      {usesLocalFallback && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Données de secours locales affichées. Vérifiez le prix en magasin avant achat.
        </p>
      )}
      {staleLocalFallback && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Les dernières observations locales datent de plus de 30 jours.
        </p>
      )}

      <ul className="space-y-2">
        {sorted.map((result) => (
          <li key={result.id} className="border rounded p-3 flex justify-between items-center gap-4">
            <div className="min-w-0">
              <p className="font-semibold truncate">{result.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm text-slate-500">{result.merchant}</p>
                {formatObservedAt(result.observedAt) && (
                  <span className="text-xs text-slate-400">Vu le {formatObservedAt(result.observedAt)}</span>
                )}
                {result.source === 'observation' && (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">👥 Citoyen</span>
                )}
                {(result.source === 'web' || result.source === 'price-search') && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">🌐 Web</span>
                )}
                {result.source === 'local-fallback' && (
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">💾 Local</span>
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

      {!loading && sorted.length === 0 && (
        <div className="rounded border border-blue-300/40 bg-blue-50/50 dark:bg-blue-900/10 px-3 py-2 text-sm">
          Vous ne trouvez pas ce produit ?{' '}
          <Link className="text-blue-700 dark:text-blue-300 underline" to="/signalement">
            Signaler un prix en 30 secondes
          </Link>
          .
        </div>
      )}

      <div className="border rounded p-3">
        <p className="font-medium mb-2">Fonctions Pro</p>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 border rounded text-sm" onClick={() => !isPro && setPaywall('pro_feature')}>Export CSV/PDF</button>
          <button className="px-3 py-2 border rounded text-sm" onClick={() => !isPro && setPaywall('pro_feature')}>Alertes prix</button>
          <button className="px-3 py-2 border rounded text-sm" onClick={() => !isPro && setPaywall('pro_feature')}>Insights complets</button>
        </div>
      </div>

      <PaywallModal open={Boolean(paywall)} reason={paywall || 'quota'} isGuest={!user} onClose={() => setPaywall(null)} />
    </div>
  );
}
