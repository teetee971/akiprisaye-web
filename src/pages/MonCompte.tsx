// src/pages/MonCompte.tsx
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";

export default function MonCompte() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      alert("Erreur lors de la déconnexion : " + err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6">👤 Mon Compte</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Informations du compte</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>Email:</strong> {user.email || "Non renseigné"}</p>
              <p><strong>Nom:</strong> {user.displayName || "Non renseigné"}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              ℹ️ <strong>Service citoyen gratuit</strong> - Toutes les fonctionnalités sont accessibles 
              gratuitement à tous les citoyens. Aucun abonnement requis.
            </p>
          </div>

          <Button 
            onClick={handleSignOut} 
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
