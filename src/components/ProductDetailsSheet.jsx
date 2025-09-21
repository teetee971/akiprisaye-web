import React from "react";
import StoreBadge from "./StoreBadge";

export default function ProductDetailsSheet({ product, open, onClose }) {
  if (!open || !product) return null;

  // Get Nutri-score icon path
  const getNutriScoreIcon = (score) => {
    const scoreCode = (score || 'C').toLowerCase();
    return `/icons/nutriscore/${scoreCode}.svg`;
  };

  const nutriScoreIcon = getNutriScoreIcon(product.nutriScore);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={onClose}>
      <div className="bg-white w-full sm:w-96 h-full p-6 overflow-y-auto shadow-lg"
           onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{product.name}</h2>
        <p className="text-sm text-slate-500">{product.brand}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold">
            {product.price} {product.currency || "€"}
          </span>
          <div className="flex items-center gap-1">
            <img 
              src={nutriScoreIcon} 
              alt={`Nutri-Score ${product.nutriScore || 'C'}`}
              width="32" 
              height="24" 
              className="flex-shrink-0"
              onError={(e) => {
                e.target.src = '/icons/nutriscore/c.svg';
              }}
            />
            <span className="text-sm text-slate-600">
              Nutri-Score
            </span>
          </div>
        </div>

        <div className="mt-2">
          <StoreBadge store={product.store} region={product.region} />
        </div>

        <p className="mt-4 text-sm leading-relaxed">
          <span className="font-medium">Ingrédients : </span>{product.ingredients || "—"}
        </p>

        {product.image && (
          <img src={product.image} alt={product.name} className="mt-4 rounded shadow" />
        )}

        {product.offUrl && (
          <a href={product.offUrl} target="_blank" rel="noopener noreferrer"
             className="mt-4 inline-block text-blue-600 underline">
            Voir sur OpenFoodFacts
          </a>
        )}

        <button onClick={onClose}
                className="mt-6 w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-950">
          Fermer
        </button>
      </div>
    </div>
  );
}
