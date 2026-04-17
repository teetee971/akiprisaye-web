/**
 * ProductList Component - v1.2.0
 *
 * Grid layout for displaying product cards
 * with loading states, empty states, and transparency
 *
 * @module ProductList
 */

import React, { useEffect, useState } from 'react';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { fetchProducts, validatePrice } from '../../services/productService';
import type { Product, ProductSearchParams } from '../../types/product';

interface ProductListProps {
  filters?: ProductSearchParams;
  onProductClick?: (product: Product) => void;
}

export function ProductList({ filters, onProductClick }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchProducts(filters);
      setProducts(response.products);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
      if (import.meta.env.DEV) {
        console.error('Failed to load products:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleValidation(productId: string, isValid: boolean) {
    // Update local state optimistically
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newScore = isValid
            ? Math.min(p.fiabilite_score + 5, 100)
            : Math.max(p.fiabilite_score - 10, 0);
          return { ...p, fiabilite_score: newScore };
        }
        return p;
      })
    );

    // Send validation to backend (async)
    validatePrice(productId, isValid).catch((err) => {
      if (import.meta.env.DEV) {
        console.error('Validation failed:', err);
      }
    });
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          padding: '16px 0',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#94a3b8',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p>{error}</p>
        <button
          onClick={loadProducts}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#94a3b8',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <p>Aucun produit trouvé</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Essayez de modifier vos filtres ou scannez un ticket
        </p>
      </div>
    );
  }

  // Product grid
  return (
    <div>
      {/* Data transparency disclaimer */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#94a3b8',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>ℹ️ Transparence des données</strong>
        <br />
        <span style={{ fontSize: '12px' }}>
          Prix indicatifs mis à jour régulièrement. Sources: API officielles, utilisateurs vérifiés,
          données historiques. Vos validations améliorent la fiabilité pour tous.
        </span>
      </div>

      {/* Products grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          padding: '16px 0',
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick?.(product)}
            onValidate={handleValidation}
          />
        ))}
      </div>

      {/* Load more indicator */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          color: '#64748b',
          fontSize: '14px',
        }}
      >
        {products.length} produit{products.length > 1 ? 's' : ''} affiché
        {products.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
