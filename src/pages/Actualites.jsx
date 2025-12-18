import NewsWidgetCivic from '../components/NewsWidgetCivic';
import TerritorySelector from '../components/TerritorySelector';
import GlobalDisclaimer from '../components/GlobalDisclaimer';
import { useState } from 'react';

export default function Actualites() {
  const [selectedTerritory, setSelectedTerritory] = useState('GP');

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">📰 Actualités A KI PRI SA YÉ</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </a>
          </div>
          <p className="text-gray-100">
            Toutes les actualités sur les prix et la vie chère dans les DROM-COM
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="mb-8">
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Filtrer par territoire</h2>
            <div className="max-w-md">
              <TerritorySelector 
                value={selectedTerritory}
                onChange={setSelectedTerritory}
              />
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3">
            <NewsWidgetCivic limit={12} showFullButton={false} />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12">
          <GlobalDisclaimer />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© 2025 A KI PRI SA YÉ - Tous droits réservés</p>
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <a href="/mentions.html" className="hover:text-white transition-colors">
            Mentions légales
          </a>
          <a href="/contact.html" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="/faq.html" className="hover:text-white transition-colors">
            FAQ
          </a>
        </div>
      </footer>
    </div>
  );
}
