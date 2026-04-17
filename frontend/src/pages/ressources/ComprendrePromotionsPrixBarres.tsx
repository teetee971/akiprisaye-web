import React from 'react';
import { SEOHead } from '../../components/ui/SEOHead';
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
  observatoryRole,
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
    <>
      <SEOHead
        title="Comprendre les promotions et prix barrés — Guide citoyen"
        description="Guide pratique pour comprendre les promotions, prix barrés et soldes dans les supermarchés des DOM-TOM."
        canonical="https://teetee971.github.io/akiprisaye-web/ressources/comprendre-promotions-prix-barres"
      />
      <div className="min-h-screen bg-slate-950 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-3">
              Promotions, remises et prix barrés
            </h1>
            <p className="text-lg text-gray-400 mb-4">Comprendre ce qui est comparable</p>
            <p className="text-gray-300 leading-relaxed">
              Ce module explique ce qu'est une promotion, un prix barré, et comment interpréter ces
              informations de manière objective. L'observatoire affiche des observations, sans
              conseil ni jugement.
            </p>
          </div>

          {/* Section 1 : Ce qu'est une promotion */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-blue-900 text-blue-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                1
              </span>
              {promotionDefinition.title}
            </h2>

            <div className="bg-blue-950/30 border-l-4 border-blue-500 p-4 mb-4">
              <p className="font-semibold text-gray-100 mb-2">Définition neutre :</p>
              <p className="text-gray-300">{promotionDefinition.definition}</p>
            </div>

            <p className="font-semibold text-gray-100 mb-2">Caractéristiques :</p>
            <div className="space-y-2 mb-4">
              {promotionDefinition.characteristics.map((char) => (
                <div key={char} className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span className="text-gray-300">{char}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-blue-300 bg-blue-950/30 p-3 rounded">
              <span role="img" aria-label="Information">
                ℹ️
              </span>{' '}
              {promotionDefinition.note}
            </p>
          </div>

          {/* Section 2 : Ce qu'est un prix barré */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-purple-900 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                2
              </span>
              {strikethroughPriceDefinition.title}
            </h2>

            <div className="bg-purple-950/30 border-l-4 border-purple-500 p-4 mb-4">
              <p className="font-semibold text-gray-100 mb-2">Définition :</p>
              <p className="text-gray-300">{strikethroughPriceDefinition.definition}</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-100 mb-2">Objectif :</p>
              <p className="text-gray-300">{strikethroughPriceDefinition.purpose}</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-100 mb-2">Contexte légal (descriptif) :</p>
              <p className="text-gray-300">{strikethroughPriceDefinition.legal_context}</p>
            </div>

            <div className="bg-purple-950/30 p-4 rounded mb-4">
              <p className="font-semibold text-gray-100 mb-2">Rôle de l'observatoire :</p>
              <p className="text-gray-300">{strikethroughPriceDefinition.observatory_role}</p>
            </div>

            <p className="text-sm text-purple-300 bg-purple-950/30 p-3 rounded">
              <span role="img" aria-label="Attention">
                ⚠️
              </span>{' '}
              {strikethroughPriceDefinition.note}
            </p>
          </div>

          {/* Section 3 : Ce que la loi autorise (descriptif) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-green-900 text-green-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                3
              </span>
              Ce que la loi autorise (descriptif)
            </h2>

            <p className="text-gray-300 mb-4">
              Cette section présente des éléments factuels sur la réglementation, à titre purement
              descriptif. L'observatoire n'est pas une source juridique.
            </p>

            <div className="bg-green-950/30 border-l-4 border-green-500 p-4 mb-4">
              <p className="font-semibold text-gray-100 mb-2">Directive européenne 2019/2161 :</p>
              <p className="text-gray-300 mb-2">
                Le prix de référence affiché (prix barré) doit correspondre au prix le plus bas
                pratiqué au cours des 30 derniers jours précédant l'application de la réduction.
              </p>
              <p className="text-sm text-gray-400 italic">
                (Description factuelle, non juridique. Consulter les textes officiels pour toute
                question légale.)
              </p>
            </div>

            <div className="bg-green-950/30 p-4 rounded">
              <p className="font-semibold text-gray-100 mb-2">Ce que cela signifie :</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span className="text-gray-300">
                    Le prix barré doit avoir été appliqué récemment (dans les 30 jours)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span className="text-gray-300">
                    Il doit s'agir du prix le plus bas de cette période
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span className="text-gray-300">L'affichage doit être clair et non trompeur</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4 : Ce que l'observatoire peut montrer */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-indigo-900 text-indigo-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                4
              </span>
              Ce que l'observatoire peut montrer
            </h2>

            <div className="space-y-3">
              {observatoryCapabilities.map((capability) => (
                <div key={capability} className="flex items-start bg-indigo-950/30 p-3 rounded">
                  <span className="text-indigo-400 mr-2 text-xl" role="img" aria-label="Oui">
                    ✓
                  </span>
                  <span className="text-gray-300">{capability}</span>
                </div>
              ))}
            </div>

            <p className="text-lg font-semibold text-indigo-300 bg-indigo-950/30 p-3 rounded mt-4">
              L'observatoire affiche des observations factuelles, sans analyse commerciale.
            </p>
          </div>

          {/* Section 5 : Ce que l'observatoire ne montre PAS */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-orange-900 text-orange-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                5
              </span>
              Ce que l'observatoire ne montre PAS
            </h2>

            <div className="space-y-3">
              {observatoryLimitations.map((limitation) => (
                <div key={limitation} className="flex items-start bg-orange-950/30 p-3 rounded">
                  <span className="text-orange-400 mr-2 text-xl" role="img" aria-label="Non">
                    ✗
                  </span>
                  <span className="text-gray-300">{limitation}</span>
                </div>
              ))}
            </div>

            <p className="text-lg font-semibold text-orange-300 bg-orange-950/30 p-3 rounded mt-4">
              L'observatoire observe. Il ne conseille pas, ne note pas, ne juge pas.
            </p>
          </div>

          {/* Section 6 : Cas comparables (3 exemples) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-teal-900 text-teal-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                6
              </span>
              Cas comparables (3 exemples)
            </h2>

            <p className="text-gray-300 mb-4">
              Ces exemples illustrent des situations où une comparaison de prix est possible.
            </p>

            <div className="space-y-4">
              {comparableCases.map((cas) => (
                <div key={cas.id} className="bg-teal-950/30 border-l-4 border-teal-500 p-4 rounded">
                  <div className="flex items-start mb-2">
                    <span className="text-2xl mr-2">{cas.icon}</span>
                    <h3 className="font-semibold text-gray-100">{cas.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-2">{cas.description}</p>
                  <p className="text-sm text-teal-300 bg-teal-950/30 p-2 rounded">
                    <strong>Pourquoi comparable :</strong> {cas.why_comparable}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7 : Cas non comparables (5 exemples) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-red-900 text-red-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                7
              </span>
              Cas non comparables (5 exemples clairs)
            </h2>

            <p className="text-gray-300 mb-4">
              Ces exemples illustrent des situations où une comparaison directe peut induire en
              erreur.
            </p>

            <div className="space-y-4">
              {nonComparableCases.map((cas) => (
                <div key={cas.id} className="bg-red-950/30 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start mb-2">
                    <span className="text-2xl mr-2">{cas.icon}</span>
                    <h3 className="font-semibold text-gray-100">{cas.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-2">{cas.description}</p>
                  <p className="text-sm text-red-300 bg-red-950/30 p-2 rounded">
                    <strong>Pourquoi non comparable :</strong> {cas.why_not_comparable}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8 : Erreurs fréquentes d'interprétation */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-yellow-900 text-yellow-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                8
              </span>
              Erreurs fréquentes d'interprétation
            </h2>

            <p className="text-gray-300 mb-4">
              Comprendre ces erreurs aide à mieux interpréter les observations de prix.
            </p>

            <div className="space-y-4">
              {interpretationErrors.map((error) => (
                <div key={error.id} className="bg-yellow-950/30 p-4 rounded">
                  <p className="font-semibold text-yellow-200 mb-2">
                    <span role="img" aria-label="Erreur">
                      ❌
                    </span>{' '}
                    {error.error_type}
                  </p>
                  <div className="mb-2 pl-4 border-l-2 border-yellow-400">
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Raisonnement incorrect :</span>
                    </p>
                    <p className="text-gray-400 italic">"{error.incorrect_thinking}"</p>
                  </div>
                  <div className="pl-4 border-l-2 border-green-400">
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold text-green-800">Compréhension correcte :</span>
                    </p>
                    <p className="text-gray-300">{error.correct_understanding}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9 : Pourquoi deux promotions peuvent sembler différentes */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-cyan-900 text-cyan-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                9
              </span>
              Pourquoi deux promotions peuvent sembler différentes
            </h2>

            <p className="text-gray-300 mb-4">
              Plusieurs facteurs peuvent expliquer pourquoi des promotions sur des produits
              similaires apparaissent différentes.
            </p>

            <div className="space-y-3">
              {promotionDifferences.map((diff) => (
                <div
                  key={diff.factor}
                  className="border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-950/30 rounded"
                >
                  <p className="font-semibold text-gray-100">{diff.factor}</p>
                  <p className="text-sm text-gray-300">{diff.explanation}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-cyan-300 bg-cyan-950/30 p-3 rounded mt-4">
              <span role="img" aria-label="Information">
                ℹ️
              </span>{' '}
              Ces facteurs expliquent des différences observables. Ils ne justifient ni ne
              condamnent aucune pratique commerciale.
            </p>
          </div>

          {/* Section 10 : Rôle de l'observatoire (observer ≠ juger) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="bg-gray-800 text-gray-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                10
              </span>
              Rôle de l'observatoire : observer ≠ juger
            </h2>

            <div className="bg-slate-800/50 border-l-4 border-slate-500 p-4 mb-4">
              <p className="font-semibold text-gray-100 mb-2">Mission :</p>
              <p className="text-gray-300">{observatoryRole.mission}</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-100 mb-2">Approche :</p>
              <p className="text-gray-300">{observatoryRole.approach}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="font-semibold text-green-300 mb-2">Ce qu'il fait :</p>
                <div className="space-y-2">
                  {observatoryRole.what_it_does.map((item) => (
                    <div key={item} className="flex items-start">
                      <span className="text-green-400 mr-2" role="img" aria-label="Fait">
                        ✓
                      </span>
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-red-300 mb-2">Ce qu'il ne fait pas :</p>
                <div className="space-y-2">
                  {observatoryRole.what_it_does_not.map((item) => (
                    <div key={item} className="flex items-start">
                      <span className="text-red-400 mr-2" role="img" aria-label="Non fait">
                        ✗
                      </span>
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-lg font-semibold text-gray-200 bg-slate-800 p-4 rounded text-center">
              {observatoryRole.key_principle}
            </p>
          </div>

          {/* Exemples concrets de promotions (données simulées) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              Exemples pédagogiques (données simulées)
            </h2>

            <p className="text-gray-300 mb-4">
              Ces exemples illustrent différents types de promotions. Les données sont fictives et à
              but pédagogique uniquement.
            </p>

            <div className="space-y-4">
              {promotionExamples.map((promo) => (
                <div
                  key={promo.id}
                  className={`p-4 rounded border-l-4 ${
                    promo.is_genuine
                      ? 'bg-green-950/30 border-green-500'
                      : 'bg-orange-950/30 border-orange-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-100">{promo.description}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        promo.is_genuine
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-orange-900/50 text-orange-300'
                      }`}
                    >
                      {promo.is_genuine ? 'Exemple valide' : 'Exemple à vérifier'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-400">Prix barré</p>
                      <p className="text-xl font-bold text-gray-100">
                        <del title="Prix barré">{promo.regular_price.toFixed(2)} €</del>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Prix promotionnel</p>
                      <p className="text-xl font-bold text-gray-100">
                        {promo.promotional_price.toFixed(2)} €
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400">Réduction affichée</p>
                    <p className="text-lg font-semibold text-gray-100">
                      {promo.discount_percentage}%
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400">Période (fictive)</p>
                    <p className="text-gray-100">
                      Du {promo.start_date} au {promo.end_date}
                    </p>
                  </div>

                  <p className="text-sm text-gray-300 bg-slate-800/50 p-3 rounded">
                    <strong>Observation :</strong> {promo.explanation}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-400 bg-slate-800/50 p-3 rounded mt-4">
              <span role="img" aria-label="Attention">
                ⚠️
              </span>{' '}
              Ces exemples sont purement pédagogiques. Aucune enseigne réelle, aucun territoire,
              aucun produit réel n'est visé.
            </p>
          </div>

          {/* Note de fin */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-3">En résumé</h3>
            <div className="space-y-2 text-gray-300">
              <p>• Les promotions et prix barrés sont des observations, pas des conclusions</p>
              <p>• L'observatoire affiche des prix, sans jugement ni conseil</p>
              <p>• Comparer nécessite de tenir compte du contexte (dates, lieux, conditions)</p>
              <p>• Chaque observation est indépendante et ne prédit aucune évolution</p>
              <p>• Observer ≠ juger ≠ recommander</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComprendrePromotionsPrixBarres;
