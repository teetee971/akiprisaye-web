import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthHub() {
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Connexion / Inscription</h1>
      <p>Accédez à votre historique cloud et au quota Free 20/jour.</p>
      <div className="flex gap-2">
        <Link to="/connexion" className="px-3 py-2 rounded bg-blue-600 text-white">
          Se connecter
        </Link>
        <Link to="/inscription" className="px-3 py-2 rounded border">
          Créer un compte
        </Link>
        <Link to="/reset-password" className="px-3 py-2 rounded border">
          Réinitialiser mot de passe
        </Link>
      </div>
    </div>
  );
}
