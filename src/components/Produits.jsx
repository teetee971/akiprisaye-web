import React from "react";
import data from "../data/alimentaire.json";

export default function Produits() {
  return (
    <div id="produits" className="p-6">
      <h2 className="text-2xl mb-4">Produits alimentaires</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item) => (
          <div key={item.id} className="bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold">{item.nom}</h3>
            <p>{item.prix} €</p>
          </div>
        ))}
      </div>
    </div>
  );
}