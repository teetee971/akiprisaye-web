import NewsWidget from '../components/NewsWidget';
import TerritorySelector from '../components/TerritorySelector';
import CategoryFilter from '../components/CategoryFilter';
import { useState } from 'react';
import { ALL_TERRITORIES, ALL_CATEGORIES } from '../constants/news';

export default function Actualites() {
  const [selectedTerritory, setSelectedTerritory] = useState(ALL_TERRITORIES);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Actualités Civiques Vérifiées</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors font-medium"
            >
              Retour à l&apos;accueil
            </a>
          </div>
          <p className="text-gray-100 max-w-3xl text-lg">
            Informations officielles sur les prix et la vie chère dans les DROM-COM. 
            Toutes les actualités proviennent de sources publiques vérifiables.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Territory Filter */}
          <div className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Filtrer par territoire
            </h2>
            <div className="max-w-md">
              <TerritorySelector 
                value={selectedTerritory}
                onChange={setSelectedTerritory}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Filtrer par catégorie
            </h2>
            <CategoryFilter 
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>

        {/* News Grid */}
        <div className="mb-12">
          <NewsWidget 
            limit={12} 
            showFullButton={false}
            selectedTerritory={selectedTerritory}
            selectedCategory={selectedCategory}
          />
        </div>

        {/* Info Section - Civic Transparency */}
        <div className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">
            Sources d&apos;information autorisées
          </h3>
          <div className="text-gray-300 space-y-3">
            <p className="leading-relaxed">
              A KI PRI SA YÉ s&apos;engage à ne publier que des informations provenant de sources officielles vérifiables :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
              <li>data.gouv.fr - Plateforme ouverte des données publiques françaises</li>
              <li>Préfectures des territoires d&apos;Outre-mer</li>
              <li>INSEE - Institut national de la statistique et des études économiques</li>
              <li>DGCCRF - Direction générale de la concurrence, de la consommation et de la répression des fraudes</li>
              <li>OPMR - Observatoire des prix, des marges et des revenus</li>
              <li>Collectivités territoriales</li>
            </ul>
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Notre engagement éthique :</strong> Zéro manipulation, zéro sensationnalisme. 
                Chaque actualité indique clairement sa source et un lien vers le document officiel.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© 2025 A KI PRI SA YÉ - Tous droits réservés</p>
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <a href="/mentions-legales" className="hover:text-white transition-colors">
            Mentions légales
          </a>
          <a href="/contact" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
