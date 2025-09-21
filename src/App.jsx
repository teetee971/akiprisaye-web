import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Comparateur from './pages/Comparateur';
import Products from './pages/Products';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  A KI PRI <span className="text-emerald-600">SA YÉ</span>
                </h1>
                <nav className="flex gap-6">
                  <Link 
                    to="/" 
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Accueil
                  </Link>
                  <Link 
                    to="/comparateur" 
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Comparateur
                  </Link>
                  <Link 
                    to="/produits" 
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Produits
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/comparateur" element={<Comparateur />} />
              <Route path="/produits" element={<Products />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          Compare les prix près de chez toi
        </h2>
        <p className="text-xl text-slate-600 mb-8">
          Un moteur simple pour trouver le meilleur prix dans les DROM-COM
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/comparateur"
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Utiliser le comparateur
          </Link>
          <Link
            to="/produits"
            className="bg-white text-slate-900 border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
          >
            Voir tous les produits
          </Link>
        </div>
      </div>
    </div>
  );
}

