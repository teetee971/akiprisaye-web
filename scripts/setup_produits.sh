#!/usr/bin/env bash
set -e

echo "📁 Préparation des dossiers…"
mkdir -p src/components src/lib src/pages

echo "🧠 Écriture src/lib/favorites.js…"
cat > src/lib/favorites.js <<'EOF'
const KEY = "akips_favs_v1";

export function getFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); }
  catch { return new Set(); }
}

export function toggleFav(id) {
  const set = getFavs();
  set.has(id) ? set.delete(id) : set.add(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
  return set;
}

export function subscribeFavs(cb) {
  const h = (e) => { if (e.key === KEY) cb(getFavs()); };
  window.addEventListener("storage", h);
  return () => window.removeEventListener("storage", h);
}
EOF

echo "🏬 Écriture src/components/StoreBadge.jsx…"
cat > src/components/StoreBadge.jsx <<'EOF'
export default function StoreBadge({ store, region }) {
  const flag = {
    GP: "🇬🇵", MQ: "🇲🇶", GF: "🇬🇫", RE: "🇷🇪", YT: "🇾🇹",
    PF: "🇵🇫", NC: "🇳🇨", WF: "🇼🇫", PM: "🇵🇲",
  }[region] || "🏬";

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5
                     rounded-full bg-slate-100 text-slate-700 text-xs">
      <span>{flag}</span>
      <span>{store}</span>
    </span>
  );
}
EOF

echo "🧩 Écriture src/components/ProductCard.jsx…"
cat > src/components/ProductCard.jsx <<'EOF'
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
EOF

echo "📑 Écriture src/components/ProductDetailsSheet.jsx…"
cat > src/components/ProductDetailsSheet.jsx <<'EOF'
import StoreBadge from "./StoreBadge";

const nsColor = {
  A: "bg-green-600", B: "bg-green-500", C: "bg-yellow-500",
  D: "bg-orange-500", E: "bg-red-600",
};

export default function ProductDetailsSheet({ product, open, onClose }) {
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

        <button onClick={onClose}
                className="mt-6 w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-950">
          Fermer
        </button>
      </div>
    </div>
  );
}
EOF

echo "🗂️ Écriture src/pages/Produits.jsx…"
cat > src/pages/Produits.jsx <<'EOF'
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductDetailsSheet from "../components/ProductDetailsSheet";
import { getFavs, toggleFav, subscribeFavs } from "../lib/favorites";

export default function Produits() {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [favs, setFavs] = useState(() => getFavs());
  const [showFavOnly, setShowFavOnly] = useState(false);

  // Sync favoris si autre onglet modifie
  useEffect(() => {
    const off = subscribeFavs(setFavs);
    return off;
  }, []);

  // Données d'exemple avec régions DOM-TOM pour le badge
  useEffect(() => {
    setData([
      {
        id: "1",
        name: "Lait 1L",
        brand: "Marque X",
        store: "Mag A",
        region: "GP", // 🇬🇵 Guadeloupe
        price: 1.12,
        currency: "€",
        nutriScore: "B",
        ingredients: "Lait de vache.",
        offUrl: "https://fr.openfoodfacts.org/",
      },
      {
        id: "2",
        name: "Riz 1kg",
        brand: "Marque Y",
        store: "Mag B",
        region: "MQ", // 🇲🇶 Martinique
        price: 2.35,
        currency: "€",
        nutriScore: "C",
        ingredients: "Riz blanc.",
        offUrl: "https://fr.openfoodfacts.org/",
      },
    ]);
  }, []);

  const produits = useMemo(() => data, [data]);
  const produitsAffiches = useMemo(
    () => (showFavOnly ? produits.filter((p) => favs.has(p.id)) : produits),
    [showFavOnly, produits, favs]
  );

  const handleFav = (prod) => {
    const updated = toggleFav(prod.id);
    setFavs(updated);
  };

  return (
    <div className="container-app p-4">
      <h2 className="text-xl font-bold mb-2">Produits</h2>

      <div className="mb-4 flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded border ${showFavOnly ? "bg-pink-600 text-white border-pink-600" : "bg-white text-slate-700 border-slate-300"}`}
          onClick={() => setShowFavOnly((v) => !v)}
        >
          {showFavOnly ? "Voir tout" : "Favoris seulement"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produitsAffiches.map((p) => (
          <ProductCard
            key={p.id || p.name}
            p={p}
            fav={favs.has(p.id)}
            onOpen={() => setSelected(p)}
            onFav={handleFav}
          />
        ))}
      </div>

      <ProductDetailsSheet
        product={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
EOF

echo "✅ Fichiers créés/maj. Redémarrage de Vite si présent…"
( pkill -f vite || true ) >/dev/null 2>&1 || true

echo "🚀 Lancement: pnpm dev --host 0.0.0.0 --port 5175"
pnpm dev --host 0.0.0.0 --port 5175
