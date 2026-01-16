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
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
    setSelectedIndex(-1); // Reset selection when query changes
    
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
    setSelectedIndex(-1);
    onSearch([product]);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch(products);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
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
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Rechercher un produit, une marque..."}
          className="search-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
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
        <div 
          className="suggestions-dropdown"
          id="search-suggestions"
          role="listbox"
        >
          {suggestions.map((product, index) => (
            <div 
              key={product.id}
              id={`suggestion-${index}`}
              onClick={() => handleSelect(product)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
              tabIndex={-1}
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
