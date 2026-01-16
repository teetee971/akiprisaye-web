import type { ProductCardProps } from '../types';

// Map categories to emoji icons
const categoryIcons: Record<string, string> = {
  'laitiers': '🥛',
  'epicerie': '🛒',
  'conserves': '🥫',
  'boissons': '🥤',
  'boulangerie': '🥖',
  'hygiene': '🧼',
  'entretien': '🧽',
  'surgeles': '❄️',
  'fruits-legumes': '🥬',
  'bebe': '👶',
  'viandes': '🥩',
  'snacks': '🍿'
};

export function ProductCard({ product, onClick, showCompareButton }: ProductCardProps) {
  const categoryIcon = categoryIcons[product.category] || '📦';

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Comparison functionality will be implemented in Mission M-C
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div 
      className="product-card" 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${product.name} - ${product.brand} - ${product.basePrice.toFixed(2)}€`}
    >
      <div className="product-image">
        <span className="product-icon">{categoryIcon}</span>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        
        <div className="product-price">
          <span className="price">{product.basePrice.toFixed(2)}€</span>
          <span className="unit">/ {product.unit}</span>
        </div>
        
        <span className="product-category">{product.category}</span>
        
        {showCompareButton && (
          <button 
            onClick={handleCompare}
            className="compare-button"
          >
            Comparer
          </button>
        )}
      </div>
    </div>
  );
}
