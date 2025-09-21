import React from "react";
import { useState } from "react";
import StoreBadge from "./StoreBadge";
import ReportProductModal from "./ReportProductModal";

const nsColor = {
  A: "bg-green-600", B: "bg-green-500", C: "bg-yellow-500",
  D: "bg-orange-500", E: "bg-red-600",
};

export default function ProductDetailsSheet({ product, open, onClose }) {
  const [showReportModal, setShowReportModal] = useState(false);
  if (!open || !product) return null;

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
          <span className={`text-xs text-white px-2 py-0.5 rounded ${nsColor[product.nutriScore || "C"]}`}>
            Nutri-Score {product.nutriScore || "C"}
          </span>
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

        <div className="mt-6 space-y-3">
          <button 
            onClick={() => setShowReportModal(true)}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
          >
            🚨 Signaler un problème
          </button>
          
          <button onClick={onClose}
                  className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-950">
            Fermer
          </button>
        </div>
      </div>
      
      <ReportProductModal 
        product={product}
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
