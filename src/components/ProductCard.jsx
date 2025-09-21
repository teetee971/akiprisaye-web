import React from 'react';
import { Heart } from "lucide-react";
import StoreBadge from "./StoreBadge";

const nsColor = {
  A: "bg-green-600", B: "bg-green-500", C: "bg-yellow-500",
  D: "bg-orange-500", E: "bg-red-600",
};

export default function ProductCard({ p, onOpen, onFav, fav }) {
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
        <span className={`text-[10px] text-white px-2 py-0.5 rounded
                         ${nsColor[p.nutriScore || "C"]}`}>
          Nutri-Score {p.nutriScore || "C"}
        </span>
      </div>

      <div className="mt-2">
        <StoreBadge store={p.store} region={p.region} />
      </div>
    </article>
  );
}
