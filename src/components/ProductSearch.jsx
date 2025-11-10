import { useState, useEffect, useRef } from 'react';

const DEBOUNCE = 250;
const SEARCH_HISTORY_KEY = 'akiprisaye_search_history';
const MAX_HISTORY_ITEMS = 5;

export default function ProductSearch({ territory, onPickEAN }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [trending, setTrending] = useState([]);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading search history:', err);
      }
    }
  }, []);

  // Fetch trending products when component mounts
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`/api/products/trending?territory=${encodeURIComponent(territory || 'Guadeloupe')}`);
        const data = await res.json();
        setTrending(data);
      } catch (err) {
        console.error('Erreur trending produits :', err);
      }
    };
    fetchTrending();
  }, [territory]);

  // Search products with debounce
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&territory=${encodeURIComponent(territory || 'Guadeloupe')}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Erreur recherche produit :', err);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);

    return () => clearTimeout(timer);
  }, [query, territory]);

  // Save successful search to history
  const saveToHistory = (searchQuery, hasResults) => {
    if (!searchQuery.trim() || searchQuery.length < 3 || !hasResults) return;

    const newHistory = [
      searchQuery,
      ...history.filter(q => q !== searchQuery)
    ].slice(0, MAX_HISTORY_ITEMS);

    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Clear search history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // Handle product selection
  const handleSelectProduct = (ean) => {
    saveToHistory(query, results.length > 0);
    onPickEAN(ean);
    setQuery('');
    setResults([]);
    setFocused(false);
  };

  // Handle history item click
  const handleHistoryClick = (searchQuery) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  const showTrending = focused && query.length < 3 && trending.length > 0;
  const showResults = results.length > 0;
  const showHistory = history.length > 0 && !query;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder="🔍 Rechercher un produit (ex : riz basmati, lait, pâtes...)"
        className="w-full p-3 rounded-xl bg-slate-800 text-white outline-none placeholder-gray-400"
      />
      {loading && <div className="absolute right-3 top-3 text-xs text-gray-400">Chargement…</div>}
      
      {/* Search History Chips */}
      {showHistory && (
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Recherches récentes :</span>
          {history.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleHistoryClick(item)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 text-xs rounded-full transition-colors"
            >
              {item}
            </button>
          ))}
          <button
            onClick={clearHistory}
            className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-full transition-colors"
          >
            Effacer
          </button>
        </div>
      )}

      {/* Trending Products */}
      {showTrending && (
        <div className="absolute z-20 mt-2 w-full bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl max-h-80 overflow-auto">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-xs font-semibold text-gray-300">⭐ Populaires dans votre zone</span>
          </div>
          <ul>
            {trending.map((p) => (
              <li
                key={p.ean}
                onClick={() => handleSelectProduct(p.ean)}
                className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer"
              >
                {p.image && (
                  <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
                )}
                <div>
                  <div className="text-gray-100 text-sm">{p.name}</div>
                  <div className="text-gray-400 text-xs">{p.brand}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <ul className="absolute z-20 mt-2 w-full bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl max-h-80 overflow-auto">
          {results.map((p) => (
            <li
              key={p.ean}
              onClick={() => handleSelectProduct(p.ean)}
              className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer"
            >
              {p.image && (
                <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
              )}
              <div>
                <div className="text-gray-100 text-sm">{p.name}</div>
                <div className="text-gray-400 text-xs">{p.brand}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
