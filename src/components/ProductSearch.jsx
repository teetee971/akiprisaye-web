import { useState, useEffect, useRef } from 'react';

const DEBOUNCE = 250;

export default function ProductSearch({ territory, onPickEAN }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  const ignoreBlurRef = useRef(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&territory=${encodeURIComponent(territory || 'Guadeloupe')}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error('Erreur recherche produit :', err);
        setError('Erreur de recherche');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);

    return () => clearTimeout(timer);
  }, [query, territory]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setQuery('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          selectProduct(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  const selectProduct = (product) => {
    onPickEAN(product.ean);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleBlur = () => {
    if (!ignoreBlurRef.current) {
      setTimeout(() => {
        setIsOpen(false);
        setActiveIndex(-1);
      }, 200);
    }
  };

  const handleMouseDown = () => {
    ignoreBlurRef.current = true;
    setTimeout(() => {
      ignoreBlurRef.current = false;
    }, 0);
  };

  const getAriaLiveMessage = () => {
    if (loading) return 'Chargement en cours…';
    if (error) return error;
    if (results.length > 0) return `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`;
    if (query.trim().length >= 3 && !loading) return 'Aucun résultat';
    return '';
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="🔍 Rechercher un produit (ex : riz basmati, lait, pâtes...)"
          className="w-full p-3 rounded-xl bg-slate-800 text-white outline-none placeholder-gray-400"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="product-search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `product-option-${activeIndex}` : undefined}
          aria-label="Rechercher un produit"
          aria-describedby="search-instructions"
        />
        {loading && (
          <div className="absolute right-3 top-3 text-xs text-gray-400" aria-hidden="true">
            Chargement…
          </div>
        )}
      </div>
      
      {/* Screen reader only instructions */}
      <div id="search-instructions" className="sr-only">
        Utilisez les flèches haut et bas pour naviguer dans les suggestions, Entrée pour sélectionner, Échap pour fermer.
      </div>
      
      {/* Aria-live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {getAriaLiveMessage()}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listboxRef}
          id="product-search-listbox"
          role="listbox"
          aria-label="Suggestions de produits"
          onMouseDown={handleMouseDown}
          className="absolute z-20 mt-2 w-full bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl max-h-80 overflow-auto"
        >
          {results.map((p, index) => (
            <li
              key={p.ean}
              id={`product-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => selectProduct(p)}
              className={`flex items-center gap-3 p-3 cursor-pointer ${
                index === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              {p.image && (
                <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
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
