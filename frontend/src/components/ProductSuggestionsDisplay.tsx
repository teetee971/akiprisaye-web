/**
 * Product Suggestions Component
 * Displays intelligent product recommendations
 */

import React from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import type { ProductSuggestion } from '../utils/productSuggestions';

interface ProductSuggestionsProps {
  suggestions: ProductSuggestion[];
  onAddProduct: (product: string) => void;
  className?: string;
}

export default function ProductSuggestionsDisplay({ 
  suggestions, 
  onAddProduct,
  className = '' 
}: ProductSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-blue-200">
          Suggestions de produits
        </h3>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.product}
            className="flex items-center justify-between p-2 bg-slate-800/30 rounded hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex-1">
              <div className="text-sm text-gray-200 font-medium">
                {suggestion.product}
              </div>
              <div className="text-xs text-gray-400">
                {suggestion.reason}
              </div>
            </div>
            <button
              onClick={() => onAddProduct(suggestion.product)}
              className="ml-2 p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              title={`Ajouter ${suggestion.product}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-blue-300/70 italic">
        💡 Ces suggestions sont basées sur votre liste actuelle
      </div>
    </div>
  );
}
