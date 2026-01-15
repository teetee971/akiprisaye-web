/**
 * Enhanced Product Search Component
 * 
 * Features:
 * - Intelligent search with synonyms and fuzzy matching
 * - Clear user feedback at each step
 * - No results state with helpful suggestions
 * - Loading states
 * - Reliability-based sorting
 */

import { useState, useEffect, useRef } from 'react';
import { searchProducts } from '../../services/enhancedPriceService';
import ProductImage from '../product/ProductImage';
import type { ProductSearchResult, EnhancedSearchFilters } from '../../types/enhancedPrice';

interface EnhancedSearchProps {
  territory?: string;
  onSelectProduct: (ean: string, productName: string) => void;
  placeholder?: string;
}

export default function EnhancedSearch({
  territory = 'GP',
  onSelectProduct,
  placeholder = '🔍 Rechercher un produit (ex : lait, riz, yaourt...)',
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const ignoreBlurRef = useRef(false);
  
  // Debounced search
  useEffect(() => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setSearchPerformed(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchPerformed(true);
      
      try {
        const filters: EnhancedSearchFilters = {
          query: trimmedQuery,
          territory,
          sortBy: 'relevance',
          sortOrder: 'desc',
        };
        
        const searchResults = await searchProducts(filters);
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, territory]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
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
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };
  
  const handleSelectProduct = (result: ProductSearchResult) => {
    onSelectProduct(result.product.ean, result.product.name);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setSearchPerformed(false);
    inputRef.current?.focus();
  };
  
  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };
  
  const handleInputBlur = () => {
    setTimeout(() => {
      if (!ignoreBlurRef.current) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
      ignoreBlurRef.current = false;
    }, 200);
  };
  
  const handleMouseDown = () => {
    ignoreBlurRef.current = true;
  };
  
  const getOptionId = (index: number) => `enhanced-product-option-${index}`;
  const listboxId = 'enhanced-product-listbox';
  
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Screen reader instructions */}
      <div className="sr-only" id="enhanced-search-instructions">
        Utilisez les flèches haut et bas pour naviguer dans les résultats. Appuyez sur Entrée pour sélectionner. Appuyez sur Échap pour fermer.
      </div>
      
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
          aria-describedby="enhanced-search-instructions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Search icon when not loading */}
        {!loading && query.length === 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
        )}
      </div>
      
      {/* Live region for loading state */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading ? 'Recherche en cours...' : ''}
      </div>
      
      {/* Live region for result count */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {!loading && isOpen && results.length > 0 
          ? `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
          : ''
        }
      </div>
      
      {/* Loading state message */}
      {loading && (
        <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Recherche en cours...</span>
        </div>
      )}
      
      {/* No results state */}
      {!loading && searchPerformed && query.length >= 2 && results.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Aucun résultat pour "{query}"
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Suggestions :
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Vérifiez l'orthographe</li>
                <li>Essayez des termes plus généraux (ex: "lait" au lieu de "lait demi-écrémé")</li>
                <li>Essayez un synonyme (ex: "yaourt" au lieu de "yogourt")</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-yellow-300">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Le produit n'est pas dans notre base ?
                </p>
                <button
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                  onClick={() => window.location.href = '/contribuer'}
                >
                  Soyez le premier à contribuer →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search results */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-96 overflow-auto"
        >
          {results.map((result, index) => {
            const { product } = result;
            const territoryPrices = product.prices.filter(p => p.territory === territory);
            const minPrice = territoryPrices.length > 0
              ? Math.min(...territoryPrices.map(p => p.price))
              : null;
            const avgReliability = territoryPrices.length > 0
              ? Math.round(
                  territoryPrices.reduce((sum, p) => sum + p.reliability.score, 0) / 
                  territoryPrices.length
                )
              : 0;
            
            return (
              <li
                key={product.ean}
                id={getOptionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={handleMouseDown}
                onClick={() => handleSelectProduct(result)}
                className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                  index === activeIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <ProductImage
                      images={product.images}
                      productName={product.name}
                      size="thumbnail"
                      className="rounded"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      {avgReliability >= 80 && (
                        <span className="text-green-600" title="Haute fiabilité">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{product.brand}</span>
                      <span>•</span>
                      <span>{product.format.displayText}</span>
                      {minPrice && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-blue-600">
                            à partir de {minPrice.toFixed(2)}€
                          </span>
                        </>
                      )}
                    </div>
                    {result.matchedFields.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        Correspond à : {result.matchedFields.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {territoryPrices.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {territoryPrices.length} magasin{territoryPrices.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      
      {/* Territory-specific empty state */}
      {!loading && searchPerformed && query.length >= 2 && results.length === 0 && territory && (
        <div className="mt-2 text-sm text-gray-600">
          <p>
            Aucune donnée disponible pour <strong>{territory}</strong> actuellement.
          </p>
        </div>
      )}
    </div>
  );
}
