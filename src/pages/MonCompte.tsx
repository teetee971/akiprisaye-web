// src/pages/MonCompte.tsx
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function MonCompte() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();
  const navigate = useNavigate();

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
      navigate("/");
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

  // Display role badge with color
  const getRoleBadge = () => {
    const roleColors = {
      admin: "bg-purple-900/30 border-purple-700 text-purple-200",
      observateur: "bg-blue-900/30 border-blue-700 text-blue-200",
      citoyen: "bg-green-900/30 border-green-700 text-green-200",
      guest: "bg-gray-900/30 border-gray-700 text-gray-200",
    };
    
    const roleLabels = {
      admin: "Administrateur",
      observateur: "Observateur",
      citoyen: "Citoyen",
      guest: "Invité",
    };

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleColors[userRole as keyof typeof roleColors] || roleColors.guest}`}>
        <span className="font-medium">{roleLabels[userRole as keyof typeof roleLabels] || "Utilisateur"}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6">👤 Mon Compte</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Informations du compte</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-2">
                <strong className="min-w-[100px]">Email:</strong>
                <span>{user.email || "Non renseigné"}</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="min-w-[100px]">Nom:</strong>
                <span>{user.displayName || "Non renseigné"}</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="min-w-[100px]">Rôle:</strong>
                {getRoleBadge()}
              </div>
              <div className="flex items-start gap-2">
                <strong className="min-w-[100px]">Statut:</strong>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-200">Connecté</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <h3 className="text-blue-200 font-semibold mb-2">
              🔐 Le compte est facultatif
            </h3>
            <p className="text-blue-200 text-sm mb-2">
              Il sert uniquement à retrouver votre historique personnel sur cet appareil.
            </p>
            <p className="text-blue-200 text-sm">
              <strong>Toutes les comparaisons sont accessibles sans compte.</strong>
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSignOut} 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
