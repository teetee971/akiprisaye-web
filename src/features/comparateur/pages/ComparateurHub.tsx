import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { ProductList } from '../components/ProductList';
import { SortOptions } from '../components/SortOptions';
import { useProductSearch } from '../hooks/useProductSearch';
import { useFilters } from '../hooks/useFilters';
import type { Product, ProductDataResponse } from '../types';
import '../styles/comparateur.css';

export default function ComparateurHub() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { 
    filteredProducts, 
    setFilters, 
    setSortBy, 
    setSortOrder 
  } = useProductSearch(products);
  
  const { categories, brands } = useFilters(products);
  const [searchResults, setSearchResults] = useState<Product[]>(products);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load monolithic format first
      const response = await fetch('/data/expanded-prices.json');
      
      if (!response.ok) {
        throw new Error('Failed to load product data');
      }

      const data: ProductDataResponse = await response.json();
      
      // Support both formats: data (split array) or data.products (monolithic)
      let productList: Product[] = [];
      if (Array.isArray(data)) {
        productList = data;
      } else if (data && Array.isArray(data.products)) {
        productList = data.products;
      }
      
      setProducts(productList);
      setSearchResults(productList);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Impossible de charger les produits. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    // Product detail page will be implemented in Mission M-B
    console.warn('Product detail page not yet implemented:', product.id);
  };

  const handleSearch = (results: Product[]) => {
    setSearchResults(results);
  };

  // Combine search results with filters
  const displayProducts = filteredProducts.filter(p => 
    searchResults.some(sr => sr.id === p.id)
  );

  return (
    <div className="comparateur-hub">
      <header className="hub-header">
        <div className="hub-header-content">
          <div className="hub-title-section">
            <h1>Hub Comparateur de Prix</h1>
            <p>Comparez les prix de {products.length} produits</p>
          </div>
          <Link to="/" className="back-link">
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      <div className="hub-search-section">
        <SearchBar
          products={products}
          onSearch={handleSearch}
          placeholder="Rechercher un produit, une marque..."
        />
      </div>

      {error && (
        <div className="hub-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadProducts}>Réessayer</button>
        </div>
      )}

      <div className="hub-content">
        <aside className="hub-sidebar">
          <FilterPanel
            categories={categories}
            territories={[]} 
            brands={brands}
            onFilterChange={setFilters}
          />
        </aside>

        <main className="hub-main">
          {loading ? (
            <div className="hub-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des produits...</p>
            </div>
          ) : (
            <>
              <div className="hub-toolbar">
                <SortOptions 
                  onSortChange={(sortBy, order) => {
                    setSortBy(sortBy);
                    setSortOrder(order);
                  }} 
                />
                
                <span className="product-count">
                  {displayProducts.length} produit{displayProducts.length !== 1 ? 's' : ''}
                </span>
              </div>

              <ProductList
                products={displayProducts}
                onProductClick={handleProductClick}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
