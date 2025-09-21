import React, { useEffect, useMemo, useState } from "react";
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
      {
        id: "3",
        name: "Épinards Bio",
        brand: "Bio Nature",
        store: "Bio Market",
        region: "RE", // 🇷🇪 Réunion
        price: 3.20,
        currency: "€",
        nutriScore: "A",
        ingredients: "Épinards biologiques.",
        offUrl: "https://fr.openfoodfacts.org/",
      },
      {
        id: "4",
        name: "Chips Salées",
        brand: "Snack Co",
        store: "Supermarché",
        region: "GF", // 🇬🇫 Guyane
        price: 2.85,
        currency: "€",
        nutriScore: "D",
        ingredients: "Pommes de terre, huile, sel.",
        offUrl: "https://fr.openfoodfacts.org/",
      },
      {
        id: "5",
        name: "Soda Cola",
        brand: "Fizzy",
        store: "Convenience",
        region: "YT", // 🇾🇹 Mayotte
        price: 1.50,
        currency: "€",
        nutriScore: "E",
        ingredients: "Eau, sucre, arômes, caféine.",
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
