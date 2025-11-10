// src/pages/Pricing.jsx
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { setUserPlan, getUserPlan } from "@/lib/firestore/plan";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("freemium");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const plan = await getUserPlan(currentUser.uid);
        setCurrentPlan(plan);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChoosePlan = async (plan) => {
    if (!user) {
      alert("Veuillez d'abord vous connecter.");
      return;
    }
    
    try {
      await setUserPlan(user.uid, plan);
      setCurrentPlan(plan);
      alert(`Plan ${plan.toUpperCase()} activé ✅`);
    } catch (error) {
      alert("Erreur lors de la mise à jour du plan : " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-center text-gray-300 mb-12">
          {user ? `Connecté en tant que ${user.email} - Plan actuel: ${currentPlan.toUpperCase()}` : "Connectez-vous pour changer de plan"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Freemium Plan */}
          <Card className="bg-slate-800 border-slate-700 p-8 rounded-xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Freemium</h3>
              <div className="text-4xl font-bold text-blue-400 mb-6">
                Gratuit
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-300">
                <li>✓ Accès aux fonctionnalités de base</li>
                <li>✓ Comparateur de prix</li>
                <li>✓ Scanner de tickets</li>
                <li>✓ Alertes de prix limitées</li>
              </ul>
              <Button
                onClick={() => handleChoosePlan("freemium")}
                disabled={currentPlan === "freemium"}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {currentPlan === "freemium" ? "Plan actuel" : "Choisir Freemium"}
              </Button>
            </div>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 p-8 rounded-xl transform scale-105 shadow-2xl">
            <div className="text-center">
              <div className="bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-full inline-block mb-3">
                POPULAIRE
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white mb-6">
                9,99€<span className="text-lg">/mois</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-100">
                <li>✓ Tout du plan Freemium</li>
                <li>✓ Alertes illimitées</li>
                <li>✓ Historique complet</li>
                <li>✓ Export de données</li>
                <li>✓ Support prioritaire</li>
              </ul>
              <Button
                onClick={() => handleChoosePlan("premium")}
                disabled={currentPlan === "premium"}
                className="w-full bg-white text-blue-900 hover:bg-gray-100"
              >
                {currentPlan === "premium" ? "Plan actuel" : "Passer à Premium"}
              </Button>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-slate-800 border-slate-700 p-8 rounded-xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-purple-400 mb-6">
                19,99€<span className="text-lg">/mois</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-300">
                <li>✓ Tout du plan Premium</li>
                <li>✓ API Access</li>
                <li>✓ Données temps réel</li>
                <li>✓ Analyses avancées</li>
                <li>✓ Support dédié 24/7</li>
                <li>✓ Intégrations personnalisées</li>
              </ul>
              <Button
                onClick={() => handleChoosePlan("pro")}
                disabled={currentPlan === "pro"}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {currentPlan === "pro" ? "Plan actuel" : "Passer à Pro"}
              </Button>
            </div>
          </Card>
        </div>

        {!user && (
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              Vous devez être connecté pour changer de plan
            </p>
            <Button
              onClick={() => window.location.href = "/mon-compte"}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Se connecter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
