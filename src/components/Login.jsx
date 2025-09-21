import React, { useState } from 'react';
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (error) {
      setError('Erreur lors de la connexion anonyme: ' + error.message);
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setError('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  if (currentUser) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">👤 Mon Compte</h2>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">✅ Connecté avec succès</p>
          </div>
          
          <div className="space-y-2">
            <p><strong>Email:</strong> {currentUser.email || 'Utilisateur anonyme'}</p>
            <p><strong>UID:</strong> {currentUser.uid}</p>
          </div>
          
          <button
            onClick={() => auth.signOut()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">🔐 Connexion</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Anonymous Login */}
      <div className="mb-6">
        <button
          onClick={handleAnonymousLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          👤 Connexion anonyme (rapide)
        </button>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Accès immédiat sans création de compte
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold mb-4">
          {isRegistering ? 'Créer un compte' : 'Connexion avec email'}
        </h3>
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isRegistering ? 'Créer le compte' : 'Se connecter')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isRegistering ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
          </button>
        </div>
      </div>
    </div>
  );
}