import React from 'react'

export default function Navbar({ setPage }) {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">A KI PRI SA YÉ</h1>
      <div className="space-x-4">
        <button onClick={() => setPage('home')}>Accueil</button>
        <button onClick={() => setPage('produits')}>Produits</button>
        <button onClick={() => setPage('apropos')}>À propos</button>
      </div>
    </nav>
  )
}
