import React from 'react';

export default function Accueil(){
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Bienvenue 👋</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Suivez les prix, maîtrisez votre budget, et luttez contre la vie chère en temps réel.
        </p>
      </div>
      
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
        <p className="text-emerald-800 dark:text-emerald-200">
          💡 <strong>Astuce :</strong> Ajoutez vos produits favoris pour recevoir les variations de prix rapidement.
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
        <span>✨</span>
        <span>Prêt(e) ? Parcourez les produits ou consultez les actualités vie chère !</span>
      </div>
    </section>
  );
}
