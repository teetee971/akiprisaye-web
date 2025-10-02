import React from "react";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between">
      <h1 className="text-xl font-bold">A KI PRI SA YÉ</h1>
      <div className="space-x-4">
        <a href="#home">Accueil</a>
        <a href="#produits">Produits</a>
        <a href="#apropos">À propos</a>
      </div>
    </nav>
  );
}