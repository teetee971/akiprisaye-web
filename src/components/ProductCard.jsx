import React from "react";
import { Heart } from "lucide-react";
import StoreBadge from "./StoreBadge";

export default function ProductCard({ p, onOpen, onFav, fav }) {
  // Get Nutri-score icon path
  const getNutriScoreIcon = (score) => {
    const scoreCode = (score || 'C').toLowerCase();
    return `/icons/nutriscore/${scoreCode}.svg`;
  };

  const nutriScoreIcon = getNutriScoreIcon(p.nutriScore);

  return (
    <article
      className="border border-slate-200 rounded-xl p-3 cursor-pointer
                 hover:shadow transition"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-xs text-slate-500">{p.brand}</p>
        </div>

        <button
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={(e) => { e.stopPropagation(); onFav(p); }}
          className={`rounded-full p-2 ${fav ? "bg-pink-600 text-white" : "bg-slate-200 text-slate-600"}`}
          title="Favori"
        >
          <Heart size={16} className={fav ? "fill-current" : ""} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm font-medium">{p.price} {p.currency || "€"}</span>
        <div className="flex items-center gap-1">
          <img 
            src={nutriScoreIcon} 
            alt={`Nutri-Score ${p.nutriScore || 'C'}`}
            width="24" 
            height="18" 
            className="flex-shrink-0"
            onError={(e) => {
              e.target.src = '/icons/nutriscore/c.svg';
            }}
          />
          <span className="text-xs text-slate-600">
            Nutri-Score
          </span>
        </div>
      </div>

      <div className="mt-2">
        <StoreBadge store={p.store} region={p.region} />
      </div>
    </article>
  );
}
