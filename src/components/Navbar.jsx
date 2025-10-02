import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between">
      <h1 className="text-xl font-bold">A KI PRI SA YÉ</h1>
      <div className="space-x-4">
        <Link to="/">Accueil</Link>
        <Link to="/produits">Produits</Link>
        <Link to="/about">À propos</Link>
      </div>
    </nav>
  );
}