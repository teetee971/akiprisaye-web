// src/pages/MonCompte.jsx
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { getUserPlan } from '../lib/firestore/plan';
import AuthForm from '../components/AuthForm';
import { Button } from '../components/ui/button';

export default function MonCompte() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('freemium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userPlan = await getUserPlan(currentUser.uid);
        setPlan(userPlan);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.alert('Déconnexion réussie');
    } catch (error) {
      window.alert('Erreur lors de la déconnexion : ' + error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">👤 Mon Compte</h1>

        {!user ? (
          <div className="mb-8">
            <AuthForm />
            <div className="text-center mt-8">
              <a href="/" className="text-blue-400 hover:underline">
                Retour à l'accueil
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info Section */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Informations</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium">{user.email || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Nom:</span>
                  <span className="font-medium">{user.displayName || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Téléphone:</span>
                  <span className="font-medium">{user.phoneNumber || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ID Utilisateur:</span>
                  <span className="font-medium text-sm">{user.uid}</span>
                </div>
              </div>
            </div>

            {/* Plan Section */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Abonnement</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Plan actuel:</span>
                <span className="text-2xl font-bold text-blue-500">
                  {plan.toUpperCase()}
                </span>
              </div>
              <Button
                onClick={() => (window.location.href = '/pricing')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {plan === 'freemium' ? 'Passer à Premium' : 'Modifier mon plan'}
              </Button>
            </div>

            {/* Actions Section */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Actions</h2>
              <div className="space-y-3">
                <Button onClick={handleSignOut} className="w-full bg-red-600 hover:bg-red-700">
                  Se déconnecter
                </Button>
                <a href="/" className="block text-center text-blue-400 hover:underline">
                  Retour à l'accueil
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
