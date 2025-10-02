import React, { useEffect, useState } from 'react'
import data from '../data/alimentaire.json'

export default function Produits() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Produits alimentaires</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((item, idx) => (
          <div key={idx} className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h3 className="font-semibold">{item.nom}</h3>
            <p>Prix: {item.prix} €</p>
          </div>
        ))}
      </div>
    </div>
  )
}
