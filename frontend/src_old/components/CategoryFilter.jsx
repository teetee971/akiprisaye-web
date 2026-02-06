import PropTypes from 'prop-types';
import { categoryConfigs } from '../types/news';
import { ALL_CATEGORIES } from '../constants/news';

/**
 * CategoryFilter - Filter news by category
 */
export default function CategoryFilter({ value, onChange, className = '' }) {
  const categories = [
    { value: ALL_CATEGORIES, label: 'Toutes les catégories', icon: '📋' },
    { value: 'PRIX', label: categoryConfigs.PRIX.label, icon: categoryConfigs.PRIX.icon },
    { value: 'POLITIQUE', label: categoryConfigs.POLITIQUE.label, icon: categoryConfigs.POLITIQUE.icon },
    { value: 'ALERTE', label: categoryConfigs.ALERTE.label, icon: categoryConfigs.ALERTE.icon },
    { value: 'INNOVATION', label: categoryConfigs.INNOVATION.label, icon: categoryConfigs.INNOVATION.icon },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categories.map((category) => {
        const isActive = value === category.value;
        const config = category.value !== ALL_CATEGORIES ? categoryConfigs[category.value] : null;
        
        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
            ? config
              ? `${config.bgColor} ${config.borderColor} ${config.color} border`
              : 'bg-blue-600/20 border-blue-500/40 text-blue-300 border'
            : 'bg-white/[0.05] border border-white/[0.12] text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.18]'
          }
            `}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}

CategoryFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
