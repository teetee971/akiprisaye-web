/**
 * Module : Pourquoi certains produits mettent plus de temps à arriver ici
 *
 * Module EXPLICATIF et PÉDAGOGIQUE répondant à la question citoyenne.
 *
 * IMPORTANT :
 * - Aucun prix
 * - Aucune comparaison de prix
 * - Aucune attribution de responsabilité
 * - Aucune prédiction
 * - Aucune promesse
 *
 * Objectif : EXPLIQUER les mécanismes logistiques généraux
 */

import React, { useState } from 'react';
import {
  Package,
  Truck,
  HelpCircle,
  Info,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getAllExplanations,
  getExplanationByCategory,
  getGeneralDelayFactors,
  type LogisticsExplanation,
} from '../../services/logisticsExplanationService';

const PourquoiDelaisProduit: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const allCategories = getAllExplanations();
  const generalFactors = getGeneralDelayFactors();

  const selectedExplanation = selectedCategory ? getExplanationByCategory(selectedCategory) : null;

  const getSensitivityColor = (level: string) => {
    switch (level) {
      case 'faible':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'moyenne':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      case 'élevée':
        return 'bg-orange-900/50 text-orange-300 border-orange-700';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getSensitivityLabel = (level: string) => {
    switch (level) {
      case 'faible':
        return 'Sensibilité faible';
      case 'moyenne':
        return 'Sensibilité moyenne';
      case 'élevée':
        return 'Sensibilité élevée';
      default:
        return level;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-6 h-6 mr-2" />
            <h1 className="text-2xl font-bold">
              Pourquoi certains produits mettent plus de temps à arriver ici
            </h1>
          </div>
          <p className="text-indigo-100 text-sm">
            Comprendre les mécanismes logistiques, sans lien direct avec les prix
          </p>
        </div>
      </div>

      {/* Avertissement institutionnel */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-indigo-950/30 border-l-4 border-indigo-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-200">
              <p className="font-semibold mb-1">Module pédagogique d'information</p>
              <p>
                Ce module présente des <strong>facteurs logistiques généraux</strong> pouvant
                influencer les délais d'acheminement de certains produits, selon les territoires et
                les filières.
              </p>
              <p className="mt-2">
                <strong>
                  Il ne constitue ni une analyse économique, ni une justification de prix.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question citoyenne */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Question citoyenne</h2>
          <p className="text-gray-300 mb-4">
            <strong>
              "Pourquoi certains produits mettent plus de temps à arriver dans mon territoire ?"
            </strong>
          </p>
          <p className="text-sm text-gray-400">
            Les territoires ultramarins présentent des <strong>spécificités logistiques</strong>{' '}
            dues à leur éloignement et leur insularité. Certains produits nécessitent des conditions
            de transport particulières qui peuvent influencer les délais d'acheminement.
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Voici les <strong>raisons logistiques les plus fréquentes</strong>, expliquées de
            manière générale.
          </p>
        </div>
      </div>

      {/* Choix du type de produit */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-100 mb-4">Sélectionnez un type de produit</h2>
        <p className="text-sm text-gray-400 mb-4">
          Liste non exhaustive des catégories les plus fréquentes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCategories.map((cat) => (
            <button
              key={cat.product_category}
              onClick={() => setSelectedCategory(cat.product_category)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedCategory === cat.product_category
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-slate-700 bg-slate-800/50 hover:border-indigo-500'
              }`}
            >
              <div className="text-3xl mb-2">{cat.category_icon}</div>
              <h3 className="font-semibold text-gray-100 text-sm mb-1">{cat.product_category}</h3>
              <p className="text-xs text-gray-400">{cat.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Détails de la catégorie sélectionnée */}
      {selectedExplanation && (
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* En-tête catégorie */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-4xl mr-3">{selectedExplanation.category_icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-100">
                    {selectedExplanation.product_category}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedExplanation.description}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getSensitivityColor(selectedExplanation.sensitivity_level)}`}
              >
                {getSensitivityLabel(selectedExplanation.sensitivity_level)}
              </span>
            </div>

            {/* Note explicative */}
            <div className="bg-indigo-950/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-indigo-200">{selectedExplanation.explanatory_note}</p>
            </div>
          </div>

          {/* Comment ça circule en général */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-indigo-400" />
              Comment ça circule en général
            </h3>

            <div className="space-y-3">
              {selectedExplanation.typical_logistics_path.map((step, index) => (
                <div key={step} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 font-semibold text-sm mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{step}</p>
                    {index < selectedExplanation.typical_logistics_path.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-400 my-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 italic">
              Ce schéma représente un parcours type. Les situations réelles peuvent varier.
            </p>
          </div>

          {/* Facteurs de délai spécifiques */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              Facteurs pouvant influencer les délais
            </h3>

            <ul className="space-y-3">
              {selectedExplanation.common_delay_factors.map((factor) => (
                <li key={factor} className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Modes de transport concernés */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              Modes de transport généralement utilisés
            </h3>

            <div className="flex flex-wrap gap-2">
              {selectedExplanation.transport_dependency.map((mode) => (
                <span
                  key={mode}
                  className="inline-flex items-center px-3 py-1 bg-indigo-900/30 text-indigo-300 text-sm rounded-lg border border-indigo-700"
                >
                  {mode === 'maritime' && '🚢 Maritime'}
                  {mode === 'aerien' && '✈️ Aérien'}
                  {mode === 'mixte' && '🚢✈️ Maritime + Aérien'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Facteurs généraux (toujours visibles) */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4">
            Facteurs généraux de délai (tous produits)
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Au-delà des spécificités de chaque produit, certains facteurs logistiques généraux
            peuvent influencer les délais d'acheminement.
          </p>

          <div className="space-y-4">
            {generalFactors.map((gf) => (
              <div key={gf.factor} className="border border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-100 mb-2 text-sm">{gf.factor}</h3>
                <p className="text-sm text-gray-300 mb-2">{gf.explanation}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {gf.applies_to.map((prod, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-700 text-gray-400 px-2 py-0.5 rounded"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ce que cela ne signifie PAS */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-950/30 border-l-4 border-red-500 rounded-r-lg p-6">
          <h2 className="text-lg font-bold text-red-200 mb-4 flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            Ce que cela ne signifie PAS
          </h2>

          <ul className="space-y-2">
            <li className="flex items-start text-sm text-red-300">
              <span className="mr-2">•</span>
              <span>
                <strong>Ce n'est pas une justification de prix</strong> — Les facteurs logistiques
                présentés ici expliquent des mécanismes d'acheminement, pas des tarifs.
              </span>
            </li>
            <li className="flex items-start text-sm text-red-300">
              <span className="mr-2">•</span>
              <span>
                <strong>Ce n'est pas une prévision</strong> — Ces explications sont générales et ne
                permettent pas de prédire les délais futurs pour un produit spécifique.
              </span>
            </li>
            <li className="flex items-start text-sm text-red-300">
              <span className="mr-2">•</span>
              <span>
                <strong>Ce n'est pas une règle générale</strong> — Les situations varient selon les
                périodes, les opérateurs et les circonstances.
              </span>
            </li>
            <li className="flex items-start text-sm text-red-300">
              <span className="mr-2">•</span>
              <span>
                <strong>Ce n'est pas une attribution de responsabilité</strong> — Ces facteurs sont
                structurels et ne désignent aucun acteur en particulier.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Section pédagogique finale */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Ce que permet ce module
          </h2>

          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Objectif pédagogique</h3>
              <p>
                Ce module vise à <strong>expliquer de manière accessible</strong> pourquoi certains
                produits peuvent mettre plus de temps à arriver dans les territoires ultramarins. Il
                s'agit d'une démarche <strong>informative et éducative</strong>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Approche générale</h3>
              <p>
                Les explications présentées sont <strong>volontairement générales</strong>. Elles
                décrivent des mécanismes logistiques courants sans prétendre couvrir toutes les
                situations particulières.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Distinction importante</h3>
              <p>
                <strong>Comprendre ≠ Justifier</strong> — Expliquer un mécanisme logistique ne
                signifie pas justifier un prix ou un délai particulier. Ces informations visent
                simplement à rendre plus transparentes les réalités de l'approvisionnement des DOM.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Complémentarité</h3>
              <p>
                Ce module complète les autres outils d'information disponibles sur la plateforme,
                notamment l'Indice Logistique DOM et les observations de délais historiques.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mention légale */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">
            <strong>A KI PRI SA YÉ</strong> — Outil d'intérêt général
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Explication générale • Approche pédagogique • Sans lien direct avec les prix • Données
            descriptives
          </p>
        </div>
      </div>
    </div>
  );
};

export default PourquoiDelaisProduit;
