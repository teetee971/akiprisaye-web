import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import type { SearchBarProps, Product } from '../types';

// Fuse.js configuration constant
const FUSE_OPTIONS = {
  keys: ['name', 'brand', 'synonyms', 'category', 'ean'],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2
};

export function SearchBar({ products, onSearch, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fuse.js instance
  const fuse = useRef(new Fuse(products, FUSE_OPTIONS));

  // Update fuse instance when products change
  useEffect(() => {
    fuse.current = new Fuse(products, FUSE_OPTIONS);
  }, [products]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      onSearch(products);
      return;
    }

    const results = fuse.current.search(value);
    const matches = results.map(r => r.item);
    
    setSuggestions(matches.slice(0, 5)); // Top 5 suggestions
    setShowSuggestions(true);
    onSearch(matches);
  };

  const handleSelect = (product: Product) => {
    setQuery(product.name);
    setShowSuggestions(false);
    onSearch([product]);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch(products);
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder || "Rechercher un produit, une marque..."}
          className="search-input"
        />
        {query && (
          <button 
            onClick={handleClear}
            className="search-clear"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map(product => (
            <div 
              key={product.id} 
              onClick={() => handleSelect(product)}
              className="suggestion-item"
            >
              <div className="suggestion-content">
                <span className="suggestion-name">{product.name}</span>
                <span className="suggestion-brand">{product.brand}</span>
              </div>
              <span className="suggestion-price">{product.basePrice.toFixed(2)}€</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
