/* eslint-env browser */
import { useState, useEffect } from 'react';

const DEBOUNCE = 250;

/* eslint-disable react/prop-types */
export default function ProductSearch({ territory, onPickEAN }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&territory=${encodeURIComponent(territory || 'Guadeloupe')}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error:', errorText);
          setError('Erreur lors de la recherche');
          setResults([]);
          setHasSearched(true);
          return;
        }
        
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
        setSelectedIndex(-1);
        setHasSearched(true);
      } catch (err) {
        console.error('Erreur recherche produit :', err);
        setError('Erreur lors de la recherche');
        setResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);

    return () => clearTimeout(timer);
  }, [query, territory]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectProduct(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll selected item into view when navigating with keyboard
  useEffect(() => {
    if (selectedIndex >= 0) {
      const element = document.getElementById(`product-option-${selectedIndex}`);
      element?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const handleSelectProduct = (product) => {
    onPickEAN(product.ean);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-label="Rechercher un produit par nom"
          aria-autocomplete="list"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="product-search-listbox"
          aria-activedescendant={
            selectedIndex >= 0 ? `product-option-${selectedIndex}` : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="🔍 Rechercher un produit (ex : riz basmati, lait, pâtes...)"
          className="w-full p-3 rounded-xl bg-slate-800 text-white outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <div
            className="absolute right-3 top-3 text-xs text-gray-400"
            role="status"
            aria-live="polite"
            aria-label="Chargement des résultats en cours"
          >
            Chargement…
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id="product-search-listbox"
          role="listbox"
          aria-label="Résultats de recherche de produits"
          className="absolute z-20 mt-2 w-full bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl max-h-80 overflow-auto"
        >
          {results.map((p, index) => (
            <li
              key={p.ean}
              id={`product-option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelectProduct(p)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-blue-600/30' : 'hover:bg-white/5'
              }`}
            >
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  className="w-8 h-8 rounded object-cover"
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="text-gray-100 text-sm">{p.name}</div>
                {p.brand && (
                  <div className="text-gray-400 text-xs">{p.brand}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {loading && 'Recherche en cours'}
        {!loading && error && error}
        {!loading && !error && hasSearched && isOpen && results.length > 0 && `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
        {!loading && !error && hasSearched && results.length === 0 && 'Aucun résultat trouvé'}
      </div>
    </div>
  );
}
