import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShareButton from '../components/comparateur/ShareButton';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { useQuota } from '../hooks/useQuota';
import { usePlan } from '../hooks/usePlan';
import { cacheProductResults, saveGuestHistory, saveUserHistory } from '../services/freemium';

const sortResults = (items, sortBy, favoriteMerchants = new Set()) => {
  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'merchant') return String(a.merchant).localeCompare(String(b.merchant));
    return Number(a.price) - Number(b.price);
  });
  return sorted.sort((a, b) => {
    const aFav = favoriteMerchants.has(String(a.merchant || '').toLowerCase());
    const bFav = favoriteMerchants.has(String(b.merchant || '').toLowerCase());
    if (aFav === bFav) return 0;
    return aFav ? -1 : 1;
  });
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
  return raw.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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
const freshnessLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "mis à jour aujourd'hui";
  if (diffDays === 1) return 'mis à jour hier';
  if (diffDays < 7) return `mis à jour il y a ${diffDays} jours`;
  return 'donnée ancienne';
};

const defaultSearchSuggestions = ['lait', 'riz', 'huile', 'pâtes', 'yaourt', '3274080005003'];

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
  const [maxPriceFilter, setMaxPriceFilter] = useState(false);
  const [citizenOnlyFilter, setCitizenOnlyFilter] = useState(false);
  const [recentOnlyFilter, setRecentOnlyFilter] = useState(false);
  const [favoriteMerchants, setFavoriteMerchants] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = JSON.parse(
        window.localStorage.getItem('comparateur-favorite-merchants') || '[]'
      );
      return new Set(Array.isArray(stored) ? stored : []);
    } catch {
      return new Set();
    }
  });
  const [searchSuggestions, setSearchSuggestions] = useState(() => {
    if (typeof window === 'undefined') return defaultSearchSuggestions;
    try {
      const stored = JSON.parse(
        window.localStorage.getItem('comparateur-search-suggestions') || '[]'
      );
      const merged = [
        ...new Set([...defaultSearchSuggestions, ...(Array.isArray(stored) ? stored : [])]),
      ];
      return merged.slice(0, 20);
    } catch {
      return defaultSearchSuggestions;
    }
  });
  const [basketItems, setBasketItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = JSON.parse(window.localStorage.getItem('comparateur-basket-items') || '[]');
      return Array.isArray(stored) ? stored.slice(0, 20) : [];
    } catch {
      return [];
    }
  });
  const [paywall, setPaywall] = useState(null);
  const territory = useMemo(() => {
    if (typeof window === 'undefined') return 'gp';
    const stored =
      window.localStorage.getItem('akiprisaye-territory') ||
      window.localStorage.getItem('territory') ||
      'gp';
    return normalizeTerritoryCode(stored);
  }, []);

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      if (maxPriceFilter && Number(item.price) >= 5) return false;
      if (citizenOnlyFilter && !['observation', 'local-fallback'].includes(item.source))
        return false;
      if (recentOnlyFilter) {
        if (!item.observedAt) return false;
        const observedAt = new Date(item.observedAt);
        if (Number.isNaN(observedAt.getTime())) return false;
        const diffDays = (Date.now() - observedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      }
      return true;
    });
  }, [results, maxPriceFilter, citizenOnlyFilter, recentOnlyFilter]);
  const sorted = useMemo(
    () => sortResults(filteredResults, sortBy, favoriteMerchants),
    [filteredResults, sortBy, favoriteMerchants]
  );
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
    [sorted]
  );
  const staleLocalFallback = useMemo(() => {
    const localDates = sorted
      .filter((item) => item.source === 'local-fallback' && item.observedAt)
      .map((item) => new Date(item.observedAt));
    if (!localDates.length) return false;
    const newest = localDates.reduce(
      (max, current) => (current > max ? current : max),
      localDates[0]
    );
    const daysOld = (Date.now() - newest.getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 30;
  }, [sorted]);
  const averagePrice = useMemo(() => {
    if (!sorted.length) return null;
    const total = sorted.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return total / sorted.length;
  }, [sorted]);
  const bestPrice = sorted[0] ?? null;

  // DOM/métropole gap indicator — source: INSEE Enquête Budget de famille DOM 2017/2018
  const DOM_SURCOUT_ALIMENTAIRE = {
    gp: 13, // Guadeloupe
    mq: 11, // Martinique
    gf: 17, // Guyane
    re: 12, // La Réunion
    yt: 14, // Mayotte
    pm: 25, // Saint-Pierre-et-Miquelon
    bl: 45, // Saint-Barthélemy
    mf: 20, // Saint-Martin
  };
  const domGapInfo = useMemo(() => {
    const surcout = DOM_SURCOUT_ALIMENTAIRE[territory];
    if (!surcout || !averagePrice) return null;
    const refMetropole = averagePrice / (1 + surcout / 100);
    return { surcout, refMetropole };
  }, [territory, averagePrice]);

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
          .then((r) => (r.ok ? r.json() : { results: [] }))
          .catch(() => ({ results: [] })),
        // 2. /api/observations (contributions citoyennes, si barcode)
        isBarcode
          ? fetch(`/api/observations?barcode=${encodeURIComponent(trimmed)}&territory=${territory}`)
              .then((r) => (r.ok ? r.json() : { observations: [] }))
              .catch(() => ({ observations: [] }))
          : Promise.resolve({ observations: [] }),
        // 3. /api/web-price (Google Shopping enrichi)
        fetch(`/api/web-price?q=${encodeURIComponent(trimmed)}&territory=${territory}`)
          .then((r) => (r.ok ? r.json() : { results: [] }))
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
      if (typeof window !== 'undefined') {
        const nextSuggestions = [...new Set([trimmed, ...searchSuggestions])].slice(0, 20);
        setSearchSuggestions(nextSuggestions);
        window.localStorage.setItem(
          'comparateur-search-suggestions',
          JSON.stringify(nextSuggestions)
        );
      }
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
  const toggleFavoriteMerchant = (merchant) => {
    const key = String(merchant || '').toLowerCase();
    if (!key) return;
    setFavoriteMerchants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'comparateur-favorite-merchants',
          JSON.stringify(Array.from(next))
        );
      }
      return next;
    });
  };
  const addToBasket = (result) => {
    setBasketItems((prev) => {
      const exists = prev.some((item) => item.id === result.id);
      if (exists || prev.length >= 20) return prev;
      const next = [
        ...prev,
        {
          id: result.id,
          title: result.title,
          merchant: result.merchant,
          price: Number(result.price),
        },
      ];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('comparateur-basket-items', JSON.stringify(next));
      }
      return next;
    });
  };
  const removeFromBasket = (id) => {
    setBasketItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('comparateur-basket-items', JSON.stringify(next));
      }
      return next;
    });
  };
  const basketTotalsByMerchant = useMemo(() => {
    const totals = new Map();
    for (const item of basketItems) {
      const key = String(item.merchant || 'Inconnu');
      totals.set(key, (totals.get(key) || 0) + Number(item.price || 0));
    }
    return Array.from(totals.entries())
      .map(([merchant, total]) => ({ merchant, total }))
      .sort((a, b) => a.total - b.total);
  }, [basketItems]);

  return (
    <div className="max-w-5xl mx-auto p-4 pr-20 sm:pr-4 pb-28 sm:pb-6 space-y-4">
      <header className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 sm:p-5">
        <h1 className="text-3xl font-bold">Comparateur Prix</h1>
        <p className="mt-2 text-sm text-slate-300">
          Comparez rapidement les prix par enseigne et repérez le meilleur tarif avant d’acheter.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full border border-slate-600 text-slate-200">
            Territoire: <strong>{territory.toUpperCase()}</strong>
          </span>
          <span className="px-2 py-1 rounded-full border border-slate-600 text-slate-200">
            Plan: <strong>{plan}</strong>
          </span>
          <span className="px-2 py-1 rounded-full border border-slate-600 text-slate-200">
            Quota restant: <strong>{Math.max(status.remaining, 0)}</strong>
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-700/40 bg-slate-900/30 p-3 sm:p-4 space-y-3">
        <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            id="comp-query"
            name="query"
            className="flex-1 min-w-0 border border-slate-700 rounded-lg px-3 py-2.5 bg-slate-900/40"
            value={query}
            placeholder="Nom, marque ou code-barres"
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un produit par nom, marque ou code-barres"
            list="comparateur-query-suggestions"
          />
          <datalist id="comparateur-query-suggestions">
            {searchSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <button
            type="submit"
            className="w-full sm:w-auto flex-shrink-0 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium whitespace-nowrap disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </form>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <label htmlFor="comp-sort" className="text-sm">
            Tri:&nbsp;
            <select
              id="comp-sort"
              name="sort"
              className="ml-2 border border-slate-700 rounded px-2 py-1 bg-slate-900/40"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="merchant">Source</option>
            </select>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {sorted.length} résultat{sorted.length > 1 ? 's' : ''}
            </span>
            <Link className="text-blue-400 text-sm hover:underline" to="/historique">
              Voir historique
            </Link>
            <ShareButton
              title="Comparateur de prix — A KI PRI SA YÉ"
              description="Comparez les prix des produits dans votre territoire ultramarin"
              variant="compact"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setMaxPriceFilter((v) => !v)}
            className={`px-2.5 py-1 rounded-full text-xs border ${maxPriceFilter ? 'bg-blue-600 text-white border-blue-500' : 'border-slate-600 text-slate-300'}`}
          >
            {maxPriceFilter ? '✓ ' : ''}Moins de 5€
          </button>
          <button
            type="button"
            onClick={() => setCitizenOnlyFilter((v) => !v)}
            className={`px-2.5 py-1 rounded-full text-xs border ${citizenOnlyFilter ? 'bg-blue-600 text-white border-blue-500' : 'border-slate-600 text-slate-300'}`}
          >
            {citizenOnlyFilter ? '✓ ' : ''}Sources citoyennes uniquement
          </button>
          <button
            type="button"
            onClick={() => setRecentOnlyFilter((v) => !v)}
            className={`px-2.5 py-1 rounded-full text-xs border ${recentOnlyFilter ? 'bg-blue-600 text-white border-blue-500' : 'border-slate-600 text-slate-300'}`}
          >
            {recentOnlyFilter ? '✓ ' : ''}Vu &lt; 7 jours
          </button>
        </div>
      </section>

      {sorted.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-emerald-200">Meilleur prix</p>
            <p className="text-lg font-semibold text-white">
              {Number(bestPrice?.price || 0).toFixed(2)} €
            </p>
            <p className="text-xs text-emerald-100 truncate">{bestPrice?.merchant || '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-900/30 px-3 py-2">
            <p className="text-xs text-slate-400">Prix moyen</p>
            <p className="text-lg font-semibold text-white">
              {Number(averagePrice || 0).toFixed(2)} €
            </p>
            <p className="text-xs text-slate-400">
              sur {sorted.length} offre{sorted.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2">
            <p className="text-xs text-blue-200">Économie max</p>
            <p className="text-lg font-semibold text-white">
              {comparisonInsight ? `${comparisonInsight.savings.toFixed(2)} €` : '0.00 €'}
            </p>
            <p className="text-xs text-blue-100">entre l’offre la plus chère et la moins chère</p>
          </div>
        </section>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {!loading && sorted.length === 0 && (
        <p className="text-slate-500">Aucun résultat pour le moment.</p>
      )}
      {!loading && sorted.length === 0 && query.trim().length >= 2 && (
        <p className="text-xs text-slate-400">
          Astuce : essayez un terme plus générique (ex : “lait”, “riz”, “huile”) ou le code-barres.
        </p>
      )}
      {domGapInfo && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs text-amber-200 font-semibold">📊 Indicateur DOM / Métropole</p>
            <p className="text-xs text-amber-100 mt-0.5">
              Référence estimée en métropole :{' '}
              <strong>{domGapInfo.refMetropole.toFixed(2)} €</strong>
              &nbsp;·&nbsp; Surcoût alimentaire DOM : <strong>+{domGapInfo.surcout} %</strong>
            </p>
          </div>
          <p className="text-[10px] text-amber-300/70 italic">
            Source : INSEE — Enquête BDF DOM 2017/2018
          </p>
        </div>
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
          <li
            key={result.id}
            className="border border-slate-700/60 bg-slate-900/20 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate">{result.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm text-slate-500">{result.merchant}</p>
                <button
                  type="button"
                  onClick={() => toggleFavoriteMerchant(result.merchant)}
                  className="text-xs px-1.5 py-0.5 rounded border border-amber-300/50 text-amber-300"
                >
                  {favoriteMerchants.has(String(result.merchant || '').toLowerCase())
                    ? '★ Favori'
                    : '☆ Favori'}
                </button>
                {formatObservedAt(result.observedAt) && (
                  <span className="text-xs text-slate-400">
                    Vu le {formatObservedAt(result.observedAt)}
                  </span>
                )}
                {freshnessLabel(result.observedAt) && (
                  <span className="text-xs px-1.5 py-0.5 bg-slate-700/70 text-slate-200 rounded">
                    {freshnessLabel(result.observedAt)}
                  </span>
                )}
                {result.source === 'observation' && (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                    👥 Citoyen
                  </span>
                )}
                {(result.source === 'web' || result.source === 'price-search') && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                    🌐 Web
                  </span>
                )}
                {result.source === 'local-fallback' && (
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                    💾 Local
                  </span>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
              <p className="font-bold text-lg">{Number(result.price).toFixed(2)} €</p>
              <div className="flex gap-2 sm:justify-end mt-0.5">
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Voir →
                  </a>
                )}
                <button
                  type="button"
                  className="text-xs text-emerald-300 hover:underline"
                  onClick={() => addToBasket(result)}
                >
                  + Panier
                </button>
                <Link
                  to={`/produit/${encodeURIComponent(result.id)}`}
                  className="text-xs text-slate-400 hover:text-blue-600"
                >
                  Fiche
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">Mode comparatif panier (1 à 20 produits)</p>
          <span className="text-xs text-violet-100">{basketItems.length}/20</span>
        </div>
        {!basketItems.length && (
          <p className="text-sm text-violet-100 mt-2">
            Ajoutez des produits via “+ Panier” pour comparer le total par enseigne.
          </p>
        )}
        {basketItems.length > 0 && (
          <div className="mt-2 space-y-2">
            <ul className="space-y-1">
              {basketItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate">
                    {item.title} · {item.merchant}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromBasket(item.id)}
                    className="text-xs text-red-300 hover:underline"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-violet-400/30 pt-2 space-y-1">
              {basketTotalsByMerchant.map((row) => (
                <p key={row.merchant} className="text-sm flex justify-between">
                  <span>{row.merchant}</span>
                  <strong>{row.total.toFixed(2)} €</strong>
                </p>
              ))}
            </div>
          </div>
        )}
      </section>

      {!loading && sorted.length === 0 && (
        <div className="rounded-xl border border-blue-300/40 bg-blue-50/50 dark:bg-blue-900/10 px-3 py-3 text-sm">
          <p className="font-medium mb-1">Aucun prix trouvé pour l’instant.</p>
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
          <button
            className="px-3 py-2 border rounded text-sm"
            onClick={() => !isPro && setPaywall('pro_feature')}
          >
            Export CSV/PDF
          </button>
          <button
            className="px-3 py-2 border rounded text-sm"
            onClick={() => !isPro && setPaywall('pro_feature')}
          >
            Alertes prix
          </button>
          <button
            className="px-3 py-2 border rounded text-sm"
            onClick={() => !isPro && setPaywall('pro_feature')}
          >
            Insights complets
          </button>
        </div>
      </div>

      <PaywallModal
        open={Boolean(paywall)}
        reason={paywall || 'quota'}
        isGuest={!user}
        onClose={() => setPaywall(null)}
      />
    </div>
  );
}
