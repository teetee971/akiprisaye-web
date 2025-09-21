import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser, isAdmin, logout } = useAuth();
  const [territory, setTerritory] = useState("");
  const [scan, setScan] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-cyan-300">
                A KI PRI SA YÉ
              </h1>
              <p className="text-sm text-slate-400">Comparateur de prix pour les DROM-COM</p>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <span className="text-sm text-slate-300">
                    Connecté: {currentUser.email}
                  </span>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Administration
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Connexion Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold">Compare les prix <span className="text-cyan-300">près de chez toi</span></h1>
          <p className="text-slate-300">DROM-COM : Guadeloupe, Martinique, Guyane, Réunion, Mayotte…</p>
          <div className="flex gap-3 items-center flex-wrap">
            <select 
              value={territory} 
              onChange={(e) => setTerritory(e.target.value)}
              className="w-72 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
            >
              <option value="">Sélectionner un territoire</option>
              <option value="guadeloupe">Guadeloupe</option>
              <option value="martinique">Martinique</option>
              <option value="guyane">Guyane</option>
              <option value="reunion">Réunion</option>
              <option value="mayotte">Mayotte</option>
            </select>
            <a className="text-sm text-cyan-300 underline" href="/diagnostics/">Diagnostics</a>
            <button 
              onClick={() => setScan(s => !s)} 
              className="text-sm px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700"
            >
              {scan ? "Fermer le scanner" : "Scanner un code-barres"}
            </button>
          </div>
        </header>

        {scan && (
          <section className="space-y-3 bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Scanner de code-barres</h3>
            <div className="bg-slate-700 p-4 rounded text-center">
              <p className="text-slate-300">Scanner temporairement désactivé</p>
              <p className="text-sm text-slate-400 mt-2">Après décodage, tu pourras appeler ton endpoint produit (ex: /api/product?ean=...).</p>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Enseignes partenaires / suivies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Carrefour', 'Hyper U', 'Leader Price', 'Marché Plus'].map(store => (
              <div key={store} className="bg-slate-800 p-4 rounded-lg text-center hover:bg-slate-700 transition-colors">
                <div className="text-2xl mb-2">🏪</div>
                <h3 className="font-medium">{store}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Admin panel link for admins */}
        {isAdmin && (
          <section className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-emerald-300 mb-2">
              🛡️ Panel Administrateur
            </h3>
            <p className="text-emerald-200 mb-4">
              Vous avez accès aux fonctionnalités d'administration incluant l'upload et l'analyse OCR de tickets.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Accéder au panel d'administration →
            </Link>
          </section>
        )}

        {/* Demo section */}
        <section className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Démo - Recherche de produits</h3>
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Nom du produit"
              className="flex-1 min-w-64 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <input
              type="number"
              placeholder="Prix (€)"
              className="w-32 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 text-right focus:ring-cyan-500 focus:border-cyan-500"
            />
            <button className="rounded-md bg-cyan-600 px-4 py-2 text-white font-medium hover:bg-cyan-700">
              Rechercher
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Fonctionnalité de recherche en cours de développement.
          </p>
        </section>
      </main>
    </div>
  );
}
