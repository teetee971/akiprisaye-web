import { useState, useEffect } from 'react';
import type { FilterPanelProps, Filters } from '../types';

const territoryNames: Record<string, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
  RE: 'Réunion'
};

export function FilterPanel({ categories, territories, brands, onFilterChange }: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // Apply filters whenever they change
  useEffect(() => {
    const filters: Filters = {
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      territories: selectedTerritories.length > 0 ? selectedTerritories : undefined,
      priceRange: priceRange[1] < 100 ? priceRange : undefined,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined
    };
    onFilterChange(filters);
  }, [selectedCategories, selectedTerritories, priceRange, selectedBrands, onFilterChange]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTerritory = (territory: string) => {
    setSelectedTerritories(prev =>
      prev.includes(territory)
        ? prev.filter(t => t !== territory)
        : [...prev, territory]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTerritories([]);
    setPriceRange([0, 100]);
    setSelectedBrands([]);
  };

  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    selectedTerritories.length > 0 || 
    priceRange[1] < 100 || 
    selectedBrands.length > 0;

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filtres</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="filter-clear-btn">
            Réinitialiser
          </button>
        )}
      </div>
      
      {/* Category filter */}
      <div className="filter-group">
        <h4>Catégories</h4>
        <div className="filter-options">
          {categories.map(cat => (
            <label key={cat} className="filter-checkbox">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Territory filter */}
      {territories.length > 0 && (
        <div className="filter-group">
          <h4>Territoires</h4>
          <div className="filter-options">
            {territories.map(territory => (
              <label key={territory} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTerritories.includes(territory)}
                  onChange={() => toggleTerritory(territory)}
                />
                <span>{territoryNames[territory] || territory}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div className="filter-group">
        <h4>Fourchette de prix</h4>
        <div className="filter-price-range">
          <input
            type="range"
            min="0"
            max="100"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, +e.target.value])}
            className="price-slider"
          />
          <div className="price-range-display">
            <span>0€</span>
            <span>{priceRange[1]}€</span>
          </div>
        </div>
      </div>

      {/* Brand filter */}
      {brands.length > 0 && (
        <div className="filter-group">
          <h4>Marques</h4>
          <div className="filter-options filter-options-scrollable">
            {brands.slice(0, 10).map(brand => (
              <label key={brand} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                />
                <span>{brand}</span>
              </label>
            ))}
            {brands.length > 10 && (
              <p className="filter-more-info">
                +{brands.length - 10} autres marques
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
