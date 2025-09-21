import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound(){
  return (
    <div className="text-center space-y-4">
      <div className="text-7xl font-black">404</div>
      <p className="text-slate-500">Oups, page introuvable.</p>
      <Link to="/" className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Retour</Link>
    </div>
  );
}
