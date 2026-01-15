import type { SortOptionsProps } from '../types';

export function SortOptions({ onSortChange }: SortOptionsProps) {
  const handleSortChange = (value: string) => {
    const [sortBy, order] = value.split('-');
    onSortChange(sortBy, order as 'asc' | 'desc');
  };

  return (
    <div className="sort-options">
      <label htmlFor="sort-select">Trier par:</label>
      <select 
        id="sort-select"
        onChange={(e) => handleSortChange(e.target.value)}
        className="sort-select"
      >
        <option value="name-asc">Nom (A-Z)</option>
        <option value="name-desc">Nom (Z-A)</option>
        <option value="price-asc">Prix croissant</option>
        <option value="price-desc">Prix décroissant</option>
        <option value="brand-asc">Marque (A-Z)</option>
      </select>
    </div>
  );
}
