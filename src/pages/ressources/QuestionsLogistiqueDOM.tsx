/**
 * Module : Questions fréquentes — Logistique dans les territoires ultramarins
 * 
 * Page FAQ pédagogique répondant aux questions courantes des citoyens
 * concernant la logistique et l'acheminement des marchandises vers les DOM.
 * 
 * IMPORTANT :
 * - Aucune analyse de prix
 * - Aucune attribution de responsabilité
 * - Aucune opinion
 * - Aucune prédiction
 * 
 * Objectif : EXPLIQUER les mécanismes de manière neutre
 */

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAllFaqItems,
  getFaqItemsByCategory,
  searchFaqItems,
  getCategories,
  type FaqItem
} from '../../services/logisticsFaqService';

const QuestionsLogistiqueDOM: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);
  
  const categories = getCategories();
  
  // Filtrer les questions selon la recherche ou la catégorie
  const displayedQuestions = searchQuery
    ? searchFaqItems(searchQuery)
    : getFaqItemsByCategory(selectedCategory);

  const toggleQuestion = (id: number) => {
    setOpenQuestionId(openQuestionId === id ? null : id);
  };

  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-6 h-6 mr-2" />
            <h1 className="text-2xl font-bold">Questions fréquentes</h1>
          </div>
          <p className="text-purple-100 text-sm">
            Logistique dans les territoires ultramarins
          </p>
        </div>
      </div>

      {/* Avertissement institutionnel */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="font-semibold mb-1">Réponses pédagogiques et neutres</p>
              <p>
                Cette page répond à des questions fréquemment posées par les citoyens concernant 
                la logistique et l'acheminement des marchandises vers les territoires ultramarins.
              </p>
              <p className="mt-2">
                <strong>Les réponses sont descriptives, pédagogiques et ne constituent ni une analyse économique, 
                ni une attribution de responsabilité.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory('toutes');
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Filtres par catégorie */}
      {!searchQuery && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Catégories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setOpenQuestionId(null);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des questions */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {displayedQuestions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Aucune question ne correspond à votre recherche.</p>
          </div>
        )}
        
        {displayedQuestions.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Question (cliquable) */}
            <button
              onClick={() => toggleQuestion(item.id)}
              className="w-full px-4 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex-1 pr-4">
                <div className="flex items-start">
                  <HelpCircle className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {item.question}
                    </h3>
                    {searchQuery && (
                      <span className="text-xs text-gray-500">
                        {getCategoryLabel(item.category)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {openQuestionId === item.id ? (
                  <ChevronUp className="w-5 h-5 text-purple-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Réponse (déroulante) */}
            {openQuestionId === item.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="pt-4 pl-8">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Liens pédagogiques */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Pour aller plus loin
          </h2>
          
          <div className="space-y-3">
            <Link
              to="/ressources/glossaire-logistique-dom"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📖</span>
                <div>
                  <h3 className="font-semibold text-purple-900 text-sm">
                    Glossaire logistique DOM
                  </h3>
                  <p className="text-xs text-purple-700">
                    Comprendre les termes logistiques
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-600" />
            </Link>

            <Link
              to="/recherche-prix/indice-logistique"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <h3 className="font-semibold text-purple-900 text-sm">
                    Indice Logistique DOM
                  </h3>
                  <p className="text-xs text-purple-700">
                    Contraintes structurelles par territoire
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-600" />
            </Link>

            <Link
              to="/recherche-prix/pourquoi-delais-produit"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📦</span>
                <div>
                  <h3 className="font-semibold text-purple-900 text-sm">
                    Pourquoi certains produits mettent plus de temps
                  </h3>
                  <p className="text-xs text-purple-700">
                    Explications par catégorie de produit
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Section informative */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            À propos de cette FAQ
          </h2>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Objectif</h3>
              <p>
                Cette FAQ vise à apporter des <strong>réponses claires et pédagogiques</strong> aux 
                questions fréquemment posées par les citoyens sur la logistique vers les territoires ultramarins.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Nature des réponses</h3>
              <p>
                Les réponses sont <strong>descriptives et neutres</strong>. Elles expliquent des mécanismes 
                logistiques sans porter de jugement, sans analyser les prix et sans attribuer de responsabilités.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Limites</h3>
              <p>
                Cette FAQ présente des <strong>explications générales</strong>. Les situations concrètes peuvent 
                varier selon de nombreux facteurs. Ces réponses ne constituent ni des conseils, ni des analyses économiques.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mention légale */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            <strong>A KI PRI SA YÉ</strong> — Outil d'information citoyenne
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Réponses pédagogiques • Aucune analyse économique • Aucune attribution de responsabilité • Neutralité absolue
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionsLogistiqueDOM;
