// src/pages/MonCompte.jsx
import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getUserPlan } from "@/lib/firestore/plan";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MonCompte() {
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState("freemium");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const plan = await getUserPlan(currentUser.uid);
        setUserPlan(plan);
        
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setUserPlan("freemium");
    } catch (error) {
      alert("Erreur lors de la déconnexion : " + error.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target);
    const updates = {
      name: formData.get("name"),
      territory: formData.get("territory"),
      notifications: formData.get("notifications") === "on",
      newsletter: formData.get("newsletter") === "on",
    };

    try {
      await setDoc(doc(db, "users", user.uid), updates, { merge: true });
      alert("Profil mis à jour avec succès ✅");
      setUserData({ ...userData, ...updates });
    } catch (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            👤 Mon Compte
          </h1>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          👤 Mon Compte
        </h1>

        {/* User Info Card */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {userData?.name || user.email}
              </h2>
              <p className="text-gray-400 mb-2">{user.email}</p>
              <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Plan {userPlan.toUpperCase()}
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Se déconnecter
            </Button>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Informations personnelles
          </h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="name">
                Nom
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={userData?.name || ""}
                placeholder="Votre nom"
                className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user.email || ""}
                disabled
                className="w-full p-3 rounded bg-slate-900 text-gray-500 border border-slate-600"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2" htmlFor="territory">
                Territoire
              </label>
              <select
                id="territory"
                name="territory"
                defaultValue={userData?.territory || ""}
                className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Sélectionnez votre territoire</option>
                <optgroup label="DROM (Départements et Régions d'Outre-Mer)">
                  <option value="guadeloupe">🇬🇵 Guadeloupe</option>
                  <option value="martinique">🇲🇶 Martinique</option>
                  <option value="guyane">🇬🇫 Guyane</option>
                  <option value="reunion">🇷🇪 La Réunion</option>
                  <option value="mayotte">🇾🇹 Mayotte</option>
                </optgroup>
                <optgroup label="COM (Collectivités d'Outre-Mer)">
                  <option value="polynesie">🇵🇫 Polynésie française</option>
                  <option value="nouvellecaledonie">🇳🇨 Nouvelle-Calédonie</option>
                  <option value="wallisetfutuna">🇼🇫 Wallis-et-Futuna</option>
                  <option value="saintmartin">🇲🇫 Saint-Martin</option>
                  <option value="saintbarthelemy">🇧🇱 Saint-Barthélemy</option>
                  <option value="saintpierreetmiquelon">🇵🇲 Saint-Pierre-et-Miquelon</option>
                </optgroup>
              </select>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Enregistrer les modifications
            </Button>
          </form>
        </Card>

        {/* Preferences */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Préférences</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  name="notifications"
                  defaultChecked={userData?.notifications}
                  className="mr-3 w-5 h-5"
                />
                Recevoir les notifications de prix
              </label>
            </div>
            <div className="mb-6">
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  name="newsletter"
                  defaultChecked={userData?.newsletter}
                  className="mr-3 w-5 h-5"
                />
                Recevoir la newsletter
              </label>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Enregistrer les préférences
            </Button>
          </form>
        </Card>

        {/* Plan Management */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Gestion du plan
          </h2>
          <p className="text-gray-300 mb-4">
            Vous êtes actuellement sur le plan <strong className="text-blue-400">{userPlan.toUpperCase()}</strong>
          </p>
          {userPlan !== "premium" && userPlan !== "pro" && (
            <Button
              onClick={() => window.location.href = "/pricing"}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Passer à Premium ou Pro
            </Button>
          )}
          {(userPlan === "premium" || userPlan === "pro") && (
            <Button
              onClick={() => window.location.href = "/pricing"}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              Gérer mon abonnement
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
