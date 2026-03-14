/**
 * Module : Glossaire des termes logistiques — Territoires ultramarins
 *
 * Page pédagogique présentant les définitions des termes liés à la logistique
 * et au transport de marchandises vers les DOM.
 *
 * IMPORTANT :
 * - Aucune analyse de prix
 * - Aucune attribution de responsabilité
 * - Aucune opinion
 * - Aucune prédiction
 *
 * Objectif : DÉFINIR les termes de manière accessible
 */

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SEOHead } from '../../components/ui/SEOHead';
import {
  getAllTerms,
  getTermsByCategory,
  searchTerms,
  getCategories,
  type GlossaryTerm,
} from '../../services/logisticsGlossaryService';

const GlossaireLogistiqueDOM: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openTermId, setOpenTermId] = useState<string | null>(null);

  const categories = getCategories();

  const displayedTerms: GlossaryTerm[] = searchQuery
    ? searchTerms(searchQuery)
    : getTermsByCategory(selectedCategory);

  const toggleTerm = (term: string) => {
    setOpenTermId((prev) => (prev === term ? null : term));
  };

  return (
    <>
      <SEOHead
        title="Glossaire logistique DOM — Termes et définitions"
        description="Dictionnaire des termes logistiques spécifiques aux territoires ultramarins : octroi de mer, AWB, BL, Incoterms..."
        canonical="https://teetee971.github.io/akiprisaye-web/ressources/glossaire-logistique-dom"
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Glossaire logistique DOM</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Définitions des termes liés à la logistique et au transport de marchandises
            vers les territoires d'outre-mer.
          </p>
        </div>

        {/* Bandeau pédagogique */}
        <div className="bg-blue-900/40 border border-blue-700/50 rounded-xl p-4 mb-6 text-sm text-blue-200">
          <strong>Contenu pédagogique :</strong> Ces définitions expliquent des concepts
          logistiques de manière neutre. Elles ne constituent pas une analyse de prix ni une
          attribution de responsabilité.
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un terme…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategory('tous');
            }}
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filtres par catégorie */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Compteur */}
        <p className="text-slate-400 text-sm mb-4">
          {displayedTerms.length} terme{displayedTerms.length !== 1 ? 's' : ''}
          {searchQuery ? ` pour « ${searchQuery} »` : ''}
        </p>

        {/* Liste des termes */}
        <div className="space-y-3">
          {displayedTerms.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucun terme ne correspond à votre recherche.</p>
            </div>
          ) : (
            displayedTerms.map((item) => (
              <div
                key={item.term}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleTerm(item.term)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-750 transition-colors"
                  aria-expanded={openTermId === item.term}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{item.term}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full">
                      {categories.find((c) => c.id === item.category)?.label ?? item.category}
                    </span>
                  </div>
                  {openTermId === item.term ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {openTermId === item.term && (
                  <div className="px-5 pb-5 space-y-3 border-t border-slate-700 pt-4">
                    <p className="text-slate-200 leading-relaxed">{item.definition}</p>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wide">
                        Contexte DOM
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">{item.context_dom}</p>
                    </div>

                    {item.pedagogical_note && (
                      <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-lg p-3">
                        <p className="text-xs font-semibold text-yellow-300 mb-1">💡 Note pédagogique</p>
                        <p className="text-yellow-200 text-sm">{item.pedagogical_note}</p>
                      </div>
                    )}

                    {item.related_terms && item.related_terms.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                          Voir aussi
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.related_terms.map((rel) => (
                            <button
                              key={rel}
                              onClick={() => {
                                setSearchQuery(rel);
                                setOpenTermId(null);
                              }}
                              className="text-xs px-2.5 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-full transition-colors"
                            >
                              {rel}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default GlossaireLogistiqueDOM;
