import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 text-center p-6">
      <h1 className="text-7xl font-extrabold text-blue-500 mb-6">404</h1>
      <h2 className="text-2xl mb-4 font-semibold">Page introuvable</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        La page que vous recherchez n'existe pas ou a été déplacée.  
        Retournez à l'accueil pour continuer votre exploration.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
