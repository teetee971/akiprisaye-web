import React, { useEffect, useState } from "react";

export default function Produits() {
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    fetch("/data/alimentaire.json")
      .then((res) => res.json())
      .then(setProduits)
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Produits alimentaires</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {produits.map((p, i) => (
          <div key={i} className="bg-gray-800 p-4 rounded shadow">
            <h3 className="font-bold">{p.nom}</h3>
            <p>Prix: {p.prix} €</p>
            <p>Magasin: {p.magasin}</p>
          </div>
        ))}
      </div>
    </div>
  );
}