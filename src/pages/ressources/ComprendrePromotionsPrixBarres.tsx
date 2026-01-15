import React from 'react';
import {
  promotionExamples,
  comparableCases,
  nonComparableCases,
  interpretationErrors,
  promotionDefinition,
  strikethroughPriceDefinition,
  observatoryCapabilities,
  observatoryLimitations,
  promotionDifferences,
  observatoryRole
} from '../../services/promotionsEducationService';

/**
 * Module pédagogique : Promotions, remises et prix barrés
 * 
 * RÈGLES STRICTES :
 * - Aucun conseil consommateur
 * - Aucune notation d'enseigne
 * - Aucune recommandation
 * - Aucune analyse commerciale
 * - Aucune prédiction
 * - Aucune collecte de données
 * - Strictement descriptif et pédagogique
 * - Mobile-first (Samsung S24+)
 */

const ComprendrePromotionsPrixBarres: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Promotions, remises et prix barrés
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Comprendre ce qui est comparable
          </p>
          <p className="text-gray-700 leading-relaxed">
            Ce module explique ce qu'est une promotion, un prix barré, et comment interpréter ces informations de manière objective.
            L'observatoire affiche des observations, sans conseil ni jugement.
          </p>
        </div>

        {/* Section 1 : Ce qu'est une promotion */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">1</span>
            {promotionDefinition.title}
          </h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="font-semibold text-gray-900 mb-2">Définition neutre :</p>
            <p className="text-gray-700">{promotionDefinition.definition}</p>
          </div>

          <p className="font-semibold text-gray-900 mb-2">Caractéristiques :</p>
          <div className="space-y-2 mb-4">
            {promotionDefinition.characteristics.map((char, index) => (
              <div key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">{char}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
            <span role="img" aria-label="Information">ℹ️</span> {promotionDefinition.note}
          </p>
        </div>

        {/* Section 2 : Ce qu'est un prix barré */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">2</span>
            {strikethroughPriceDefinition.title}
          </h2>
          
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
            <p className="font-semibold text-gray-900 mb-2">Définition :</p>
            <p className="text-gray-700">{strikethroughPriceDefinition.definition}</p>
          </div>

          <div className="mb-4">
            <p className="font-semibold text-gray-900 mb-2">Objectif :</p>
            <p className="text-gray-700">{strikethroughPriceDefinition.purpose}</p>
          </div>

          <div className="mb-4">
            <p className="font-semibold text-gray-900 mb-2">Contexte légal (descriptif) :</p>
            <p className="text-gray-700">{strikethroughPriceDefinition.legal_context}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded mb-4">
            <p className="font-semibold text-gray-900 mb-2">Rôle de l'observatoire :</p>
            <p className="text-gray-700">{strikethroughPriceDefinition.observatory_role}</p>
          </div>

          <p className="text-sm text-purple-700 bg-purple-50 p-3 rounded">
            <span role="img" aria-label="Attention">⚠️</span> {strikethroughPriceDefinition.note}
          </p>
        </div>

        {/* Section 3 : Ce que la loi autorise (descriptif) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">3</span>
            Ce que la loi autorise (descriptif)
          </h2>
          
          <p className="text-gray-700 mb-4">
            Cette section présente des éléments factuels sur la réglementation, à titre purement descriptif.
            L'observatoire n'est pas une source juridique.
          </p>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="font-semibold text-gray-900 mb-2">Directive européenne 2019/2161 :</p>
            <p className="text-gray-700 mb-2">
              Le prix de référence affiché (prix barré) doit correspondre au prix le plus bas pratiqué au cours des 30 derniers jours précédant l'application de la réduction.
            </p>
            <p className="text-sm text-gray-600 italic">
              (Description factuelle, non juridique. Consulter les textes officiels pour toute question légale.)
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <p className="font-semibold text-gray-900 mb-2">Ce que cela signifie :</p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-gray-700">Le prix barré doit avoir été appliqué récemment (dans les 30 jours)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-gray-700">Il doit s'agir du prix le plus bas de cette période</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-gray-700">L'affichage doit être clair et non trompeur</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 4 : Ce que l'observatoire peut montrer */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">4</span>
            Ce que l'observatoire peut montrer
          </h2>
          
          <div className="space-y-3">
            {observatoryCapabilities.map((capability, index) => (
              <div key={index} className="flex items-start bg-indigo-50 p-3 rounded">
                <span className="text-indigo-600 mr-2 text-xl" role="img" aria-label="Oui">✓</span>
                <span className="text-gray-700">{capability}</span>
              </div>
            ))}
          </div>

          <p className="text-lg font-semibold text-indigo-800 bg-indigo-50 p-3 rounded mt-4">
            L'observatoire affiche des observations factuelles, sans analyse commerciale.
          </p>
        </div>

        {/* Section 5 : Ce que l'observatoire ne montre PAS */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">5</span>
            Ce que l'observatoire ne montre PAS
          </h2>
          
          <div className="space-y-3">
            {observatoryLimitations.map((limitation, index) => (
              <div key={index} className="flex items-start bg-orange-50 p-3 rounded">
                <span className="text-orange-600 mr-2 text-xl" role="img" aria-label="Non">✗</span>
                <span className="text-gray-700">{limitation}</span>
              </div>
            ))}
          </div>

          <p className="text-lg font-semibold text-orange-800 bg-orange-50 p-3 rounded mt-4">
            L'observatoire observe. Il ne conseille pas, ne note pas, ne juge pas.
          </p>
        </div>

        {/* Section 6 : Cas comparables (3 exemples) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-teal-100 text-teal-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">6</span>
            Cas comparables (3 exemples)
          </h2>
          
          <p className="text-gray-700 mb-4">
            Ces exemples illustrent des situations où une comparaison de prix est possible.
          </p>

          <div className="space-y-4">
            {comparableCases.map((cas) => (
              <div key={cas.id} className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded">
                <div className="flex items-start mb-2">
                  <span className="text-2xl mr-2">{cas.icon}</span>
                  <h3 className="font-semibold text-gray-900">{cas.title}</h3>
                </div>
                <p className="text-gray-700 mb-2">{cas.description}</p>
                <p className="text-sm text-teal-800 bg-teal-100 p-2 rounded">
                  <strong>Pourquoi comparable :</strong> {cas.why_comparable}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 7 : Cas non comparables (5 exemples) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">7</span>
            Cas non comparables (5 exemples clairs)
          </h2>
          
          <p className="text-gray-700 mb-4">
            Ces exemples illustrent des situations où une comparaison directe peut induire en erreur.
          </p>

          <div className="space-y-4">
            {nonComparableCases.map((cas) => (
              <div key={cas.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start mb-2">
                  <span className="text-2xl mr-2">{cas.icon}</span>
                  <h3 className="font-semibold text-gray-900">{cas.title}</h3>
                </div>
                <p className="text-gray-700 mb-2">{cas.description}</p>
                <p className="text-sm text-red-800 bg-red-100 p-2 rounded">
                  <strong>Pourquoi non comparable :</strong> {cas.why_not_comparable}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8 : Erreurs fréquentes d'interprétation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">8</span>
            Erreurs fréquentes d'interprétation
          </h2>
          
          <p className="text-gray-700 mb-4">
            Comprendre ces erreurs aide à mieux interpréter les observations de prix.
          </p>

          <div className="space-y-4">
            {interpretationErrors.map((error) => (
              <div key={error.id} className="bg-yellow-50 p-4 rounded">
                <p className="font-semibold text-yellow-900 mb-2"><span role="img" aria-label="Erreur">❌</span> {error.error_type}</p>
                <div className="mb-2 pl-4 border-l-2 border-yellow-400">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Raisonnement incorrect :</span>
                  </p>
                  <p className="text-gray-600 italic">"{error.incorrect_thinking}"</p>
                </div>
                <div className="pl-4 border-l-2 border-green-400">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold text-green-800">Compréhension correcte :</span>
                  </p>
                  <p className="text-gray-700">{error.correct_understanding}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 9 : Pourquoi deux promotions peuvent sembler différentes */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-cyan-100 text-cyan-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">9</span>
            Pourquoi deux promotions peuvent sembler différentes
          </h2>
          
          <p className="text-gray-700 mb-4">
            Plusieurs facteurs peuvent expliquer pourquoi des promotions sur des produits similaires apparaissent différentes.
          </p>

          <div className="space-y-3">
            {promotionDifferences.map((diff, index) => (
              <div key={index} className="border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-50 rounded">
                <p className="font-semibold text-gray-900">{diff.factor}</p>
                <p className="text-sm text-gray-700">{diff.explanation}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-cyan-700 bg-cyan-50 p-3 rounded mt-4">
            <span role="img" aria-label="Information">ℹ️</span> Ces facteurs expliquent des différences observables. Ils ne justifient ni ne condamnent aucune pratique commerciale.
          </p>
        </div>

        {/* Section 10 : Rôle de l'observatoire (observer ≠ juger) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gray-100 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">10</span>
            Rôle de l'observatoire : observer ≠ juger
          </h2>
          
          <div className="bg-gray-50 border-l-4 border-gray-500 p-4 mb-4">
            <p className="font-semibold text-gray-900 mb-2">Mission :</p>
            <p className="text-gray-700">{observatoryRole.mission}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded mb-4">
            <p className="font-semibold text-gray-900 mb-2">Approche :</p>
            <p className="text-gray-700">{observatoryRole.approach}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="font-semibold text-green-900 mb-2">Ce qu'il fait :</p>
              <div className="space-y-2">
                {observatoryRole.what_it_does.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-green-600 mr-2" role="img" aria-label="Fait">✓</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-red-900 mb-2">Ce qu'il ne fait pas :</p>
              <div className="space-y-2">
                {observatoryRole.what_it_does_not.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-red-600 mr-2" role="img" aria-label="Non fait">✗</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-lg font-semibold text-gray-800 bg-gray-100 p-4 rounded text-center">
            {observatoryRole.key_principle}
          </p>
        </div>

        {/* Exemples concrets de promotions (données simulées) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Exemples pédagogiques (données simulées)
          </h2>
          
          <p className="text-gray-700 mb-4">
            Ces exemples illustrent différents types de promotions. Les données sont fictives et à but pédagogique uniquement.
          </p>

          <div className="space-y-4">
            {promotionExamples.map((promo) => (
              <div key={promo.id} className={`p-4 rounded border-l-4 ${
                promo.is_genuine ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{promo.description}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    promo.is_genuine ? 'bg-green-200 text-green-900' : 'bg-orange-200 text-orange-900'
                  }`}>
                    {promo.is_genuine ? 'Exemple valide' : 'Exemple à vérifier'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Prix barré</p>
                    <p className="text-xl font-bold text-gray-900"><del title="Prix barré">{promo.regular_price.toFixed(2)} €</del></p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prix promotionnel</p>
                    <p className="text-xl font-bold text-gray-900">{promo.promotional_price.toFixed(2)} €</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600">Réduction affichée</p>
                  <p className="text-lg font-semibold text-gray-900">{promo.discount_percentage}%</p>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600">Période (fictive)</p>
                  <p className="text-gray-900">Du {promo.start_date} au {promo.end_date}</p>
                </div>

                <p className="text-sm text-gray-700 bg-white p-3 rounded">
                  <strong>Observation :</strong> {promo.explanation}
                </p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-4">
            <span role="img" aria-label="Attention">⚠️</span> Ces exemples sont purement pédagogiques. Aucune enseigne réelle, aucun territoire, aucun produit réel n'est visé.
          </p>
        </div>

        {/* Note de fin */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            En résumé
          </h3>
          <div className="space-y-2 text-gray-700">
            <p>• Les promotions et prix barrés sont des observations, pas des conclusions</p>
            <p>• L'observatoire affiche des prix, sans jugement ni conseil</p>
            <p>• Comparer nécessite de tenir compte du contexte (dates, lieux, conditions)</p>
            <p>• Chaque observation est indépendante et ne prédit aucune évolution</p>
            <p>• Observer ≠ juger ≠ recommander</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ComprendrePromotionsPrixBarres;
