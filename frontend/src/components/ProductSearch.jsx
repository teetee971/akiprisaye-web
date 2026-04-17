import { useState, useEffect, useRef } from 'react';

import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { normalizeText } from '../utils/text';
import { searchProductsByName } from '../data/seedProducts';
import { useToast } from '../hooks/useToast';

const DEBOUNCE = 250;
const MAX_RESULTS = 15;

export default function ProductSearch({ territory = 'Guadeloupe', onPickEAN, onQueryChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const toast = useToast();

  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  // ignoreBlurRef prevents blur from closing list when clicking an option
  const ignoreBlurRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  // Search products when query changes (debounced)
  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new window.AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        // Try to fetch from API first
        let data = [];
        try {
          const res = await fetch(
            `/api/products/search?q=${encodeURIComponent(trimmedQuery)}&territory=${encodeURIComponent(territory)}`,
            { signal: controller.signal }
          );
          if (res.ok) {
            data = await res.json();
          }
        } catch (_apiErr) {
          if (import.meta.env.DEV) {
            console.warn('API not available, using seed data');
          }
        }

        // Fallback to seed data if API fails or returns empty
        if (!data || data.length === 0) {
          const seedResults = searchProductsByName(trimmedQuery);
          data = seedResults.map((product) => ({
            ean: product.ean,
            name: product.name,
            brand: product.brand,
            image: null, // No images in seed data
          }));
        }

        // Apply fuzzy re-ranking with Fuse.js if we have results
        let rankedResults = data;
        if (data && data.length > 0) {
          const normalizedQuery = normalizeText(trimmedQuery);

          // Configure Fuse.js for fuzzy matching
          const fuse = new Fuse(data, {
            keys: [
              { name: 'name', weight: 0.6 },
              { name: 'brand', weight: 0.4 },
            ],
            threshold: 0.38,
            ignoreLocation: true,
            useExtendedSearch: false,
            // Use normalized query for better matching
            getFn: (obj, path) => {
              const value = obj[path];
              return value ? normalizeText(value) : '';
            },
          });

          const fuseResults = fuse.search(normalizedQuery);

          // If fuzzy search returns results, use them; otherwise fallback to original order
          rankedResults = fuseResults.length > 0 ? fuseResults.map((r) => r.item) : data;
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResults(rankedResults.slice(0, MAX_RESULTS));
        setIsOpen(rankedResults.length > 0);
        setActiveIndex(-1);

        // Show toast if no results found
        if (rankedResults.length === 0 && trimmedQuery.length >= 3) {
          toast.info('Aucun résultat trouvé', {
            duration: 3000,
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Erreur recherche produit :', err);
        if (requestId === requestIdRef.current) {
          setResults([]);
          setIsOpen(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, territory]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      // Esc closes even if no results
      if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
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
          handleSelectProduct(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        // Tab closes the list and allows normal focus flow
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleSelectProduct = (product) => {
    onPickEAN(product.ean);
    setQuery(product.name);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click selection to happen first
    setTimeout(() => {
      if (!ignoreBlurRef.current) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
      ignoreBlurRef.current = false;
    }, 200);
  };

  const handleMouseDown = () => {
    // Prevent blur from closing the list when clicking an option
    ignoreBlurRef.current = true;
  };

  const handleOptionKeyDown = (event, product) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectProduct(product);
    }
  };

  // Generate stable IDs for ARIA
  const getOptionId = (index) => `product-option-${index}`;
  const listboxId = 'product-listbox';

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Screen reader instructions */}
      <div className="sr-only" id="search-instructions">
        Use up and down arrow keys to navigate search results. Press Enter to select. Press Escape
        to close.
      </div>

      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
        aria-describedby="search-instructions"
        aria-label="Rechercher un produit"
        value={query}
        onChange={(e) => {
          const nextQuery = e.target.value;
          setQuery(nextQuery);
          onQueryChange?.(nextQuery);
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="🔍 Rechercher un produit (ex : riz basmati, lait, pâtes...)"
        className="w-full p-3 rounded-xl bg-slate-800 text-white outline-none placeholder-gray-400"
      />

      {/* Loading indicator */}
      {loading && <div className="absolute right-3 top-3 text-xs text-gray-400">Chargement…</div>}

      {/* Live region for loading state */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading ? 'Recherche en cours...' : ''}
      </div>

      {/* Live region for result count */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {!loading && isOpen && results.length > 0
          ? `${results.length} résultat${results.length > 1 ? 's' : ''} disponible${results.length > 1 ? 's' : ''}`
          : ''}
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Résultats de recherche produits"
          className="absolute z-20 mt-2 w-full bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl max-h-80 overflow-auto"
        >
          {results.map((product, index) => (
            <li
              key={product.ean}
              id={getOptionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={handleMouseDown}
              onClick={() => handleSelectProduct(product)}
              onKeyDown={(event) => handleOptionKeyDown(event, product)}
              className={`flex items-center gap-3 p-3 cursor-pointer ${
                index === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt=""
                  className="w-8 h-8 rounded object-cover"
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="text-gray-100 text-sm">{product.name}</div>
                <div className="text-gray-400 text-xs">{product.brand}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

ProductSearch.propTypes = {
  territory: PropTypes.string,
  onPickEAN: PropTypes.func.isRequired,
  onQueryChange: PropTypes.func,
};
