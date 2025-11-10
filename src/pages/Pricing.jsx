// src/pages/Pricing.jsx
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserPlan, setUserPlan } from '../lib/firestore/plan';
import { Button } from '../components/ui/button';

export default function Pricing() {
  const [currentPlan, setCurrentPlan] = useState('freemium');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const plan = await getUserPlan(user.uid);
        setCurrentPlan(plan);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChoosePlan = async (plan) => {
    if (!user) {
      window.alert('Veuillez d\'abord vous connecter.');
      window.location.href = '/mon-compte';
      return;
    }
    await setUserPlan(user.uid, plan);
    setCurrentPlan(plan);
    window.alert(`Plan ${plan.toUpperCase()} activé ✅`);
  };

  const plans = [
    {
      name: 'Freemium',
      price: '0€',
      features: [
        'Comparaison de prix basique',
        'Scanner de tickets',
        'Carte des magasins',
        'Accès limité à l\'IA',
      ],
      value: 'freemium',
      buttonClass: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      name: 'Premium',
      price: '4.99€/mois',
      features: [
        'Toutes les fonctionnalités Freemium',
        'Comparaison avancée',
        'Historique des prix illimité',
        'IA Conseiller complet',
        'Alertes personnalisées',
      ],
      value: 'premium',
      buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Pro',
      price: '9.99€/mois',
      features: [
        'Toutes les fonctionnalités Premium',
        'Analyses détaillées',
        'Export de données',
        'Support prioritaire',
        'API accès',
      ],
      value: 'pro',
      buttonClass: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Choisissez votre plan</h1>
        <p className="text-center text-gray-400 mb-12">
          {user ? `Plan actuel: ${currentPlan.toUpperCase()}` : 'Connectez-vous pour changer de plan'}
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.value}
              className={`bg-slate-800 rounded-2xl p-8 shadow-xl ${
                currentPlan === plan.value ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold mb-6 text-blue-400">{plan.price}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleChoosePlan(plan.value)}
                className={`w-full ${plan.buttonClass} ${
                  currentPlan === plan.value ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={currentPlan === plan.value}
              >
                {currentPlan === plan.value ? 'Plan actuel' : `Passer à ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="/" className="text-blue-400 hover:underline">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
