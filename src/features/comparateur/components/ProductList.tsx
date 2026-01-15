import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import type { ProductListProps } from '../types';

export function ProductList({ products, onProductClick }: ProductListProps) {
  const [columnCount, setColumnCount] = useState(3);

  // Handle responsive columns
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 640) setColumnCount(1);
      else if (window.innerWidth < 1024) setColumnCount(2);
      else setColumnCount(3);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Empty state
  if (products.length === 0) {
    return (
      <div className="product-list-empty">
        <div className="empty-icon">🔍</div>
        <h3>Aucun produit trouvé</h3>
        <p>Essayez de modifier vos filtres ou votre recherche</p>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div 
        className="product-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: '1rem',
          padding: '0.5rem'
        }}
      >
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
            showCompareButton
          />
        ))}
      </div>
    </div>
  );
}
