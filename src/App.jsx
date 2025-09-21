import React from 'react';
import BackToTop from './components/BackToTop';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        A KI PRI SA YÉ
      </h1>

      <p className="text-center text-slate-600 mb-4">
        Comparateur - version démo
      </p>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Nom du produit"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Prix (€)"
          className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-right"
        />
        <button className="rounded-xl bg-sky-600 px-4 py-2 text-white font-medium hover:bg-sky-700">
          Ajouter
        </button>
      </div>

      {/* Add some content to make the page scrollable for testing */}
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Fonctionnalités</h2>
          <p className="text-slate-600 mb-4">
            A KI PRI SA YÉ vous aide à comparer les prix et gérer votre budget dans les territoires d'outre-mer.
          </p>
          <ul className="space-y-2 text-slate-600">
            <li>• Comparaison de prix en temps réel</li>
            <li>• Suivi de budget personnalisé</li>
            <li>• Alertes sur les promotions</li>
            <li>• Géolocalisation des enseignes</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Territoires couverts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium text-slate-700">Antilles</p>
              <ul className="text-slate-600 space-y-1">
                <li>• Guadeloupe</li>
                <li>• Martinique</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-slate-700">Océan Indien</p>
              <ul className="text-slate-600 space-y-1">
                <li>• Réunion</li>
                <li>• Mayotte</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-slate-700">Amérique du Sud</p>
              <ul className="text-slate-600 space-y-1">
                <li>• Guyane française</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Comment ça marche ?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-sky-100 text-sky-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">1</div>
              <div>
                <h3 className="font-medium text-slate-700">Ajoutez vos produits</h3>
                <p className="text-slate-600 text-sm">Saisissez les produits que vous achetez régulièrement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-sky-100 text-sky-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">2</div>
              <div>
                <h3 className="font-medium text-slate-700">Comparez les prix</h3>
                <p className="text-slate-600 text-sm">Visualisez les différences de prix entre les enseignes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-sky-100 text-sky-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">3</div>
              <div>
                <h3 className="font-medium text-slate-700">Économisez</h3>
                <p className="text-slate-600 text-sm">Choisissez l'enseigne la plus avantageuse pour vos courses</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Données et transparence</h2>
          <p className="text-slate-600 mb-4">
            Nos données sont collectées de manière transparente et mises à jour régulièrement pour vous offrir 
            les informations les plus fiables sur les prix dans votre région.
          </p>
          <p className="text-slate-600">
            Service gratuit et sans publicité, financé par la participation volontaire de la communauté.
          </p>
        </div>
      </div>

      <BackToTop />
    </div>
  )
}

