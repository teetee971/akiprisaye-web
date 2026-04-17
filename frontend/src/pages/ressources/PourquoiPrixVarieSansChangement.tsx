import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Module pédagogique: Pourquoi un prix varie sans que le produit change
 *
 * RÈGLES:
 * - Aucune prédiction
 * - Aucun conseil
 * - Aucune notation
 * - Aucun jugement (normal/anormal/excessif/abusif)
 * - Aucun responsable désigné
 * - Explique des FACTEURS, pas des CAUSES certifiées
 */

const PourquoiPrixVarieSansChangement: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-100 mb-3">
            Pourquoi un prix varie sans que le produit change
          </h1>
          <p className="text-lg text-gray-400 mb-4">
            Comprendre les variations sans tirer de conclusions hâtives
          </p>
          <p className="text-gray-300 leading-relaxed">
            Un prix peut varier dans le temps pour un produit identique. Cette page explique ce
            phénomène de manière descriptive, sans analyse économique ni attribution de
            responsabilité.
          </p>
        </div>

        {/* Bloc 1: Constater une variation */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-blue-900 text-blue-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              1
            </span>
            Constater une variation
          </h2>

          <div className="bg-blue-950/30 border-l-4 border-blue-500 p-4 mb-4">
            <p className="font-semibold text-gray-100 mb-2">Exemple fictif :</p>
            <p className="text-gray-300">
              Produit A observé :<br />
              • 2,30 € le 5 mars
              <br />
              • 2,55 € le 20 mars
              <br />
              Dans la même enseigne et le même territoire.
            </p>
          </div>

          <p className="text-lg font-semibold text-blue-300 bg-blue-950/30 p-3 rounded">
            Une variation de prix est une observation, pas une conclusion.
          </p>
        </div>

        {/* Bloc 2: Ce que signifie "produit identique" */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-blue-900 text-blue-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              2
            </span>
            Ce que signifie "produit identique"
          </h2>

          <div className="space-y-2 mb-4">
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">✓</span>
              <span className="text-gray-300">Même marque</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">✓</span>
              <span className="text-gray-300">Même référence commerciale</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">✓</span>
              <span className="text-gray-300">Même format</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">✓</span>
              <span className="text-gray-300">Même code-barres (EAN)</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">✓</span>
              <span className="text-gray-300">Même conditionnement</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 italic bg-slate-800/50 p-3 rounded">
            Le produit est considéré identique lorsque ses caractéristiques visibles sont
            inchangées.
          </p>
        </div>

        {/* Bloc 3: Ce que montre l'observatoire */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-green-900 text-green-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              3
            </span>
            Ce que montre l'observatoire
          </h2>

          <p className="text-gray-300 mb-4">L'observatoire affiche :</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-green-950/30 p-3 rounded">
              <span className="font-semibold text-green-300">Prix observés</span>
            </div>
            <div className="bg-green-950/30 p-3 rounded">
              <span className="font-semibold text-green-300">Dates de relevé</span>
            </div>
            <div className="bg-green-950/30 p-3 rounded">
              <span className="font-semibold text-green-300">Enseignes</span>
            </div>
            <div className="bg-green-950/30 p-3 rounded">
              <span className="font-semibold text-green-300">Territoires</span>
            </div>
            <div className="bg-green-950/30 p-3 rounded md:col-span-2">
              <span className="font-semibold text-green-300">Historique temporel</span>
            </div>
          </div>

          <p className="text-lg font-semibold text-green-300 bg-green-950/30 p-3 rounded">
            L'observatoire affiche des évolutions, sans en déterminer la cause.
          </p>
        </div>

        {/* Bloc 4: Ce que l'observatoire ne dit pas */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-orange-900 text-orange-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              4
            </span>
            Ce que l'observatoire ne dit pas
          </h2>

          <div className="space-y-3">
            <div className="flex items-start bg-orange-950/30 p-3 rounded">
              <span className="text-orange-400 mr-2 text-xl">✗</span>
              <span className="text-gray-300">Il ne dit pas pourquoi le prix change</span>
            </div>
            <div className="flex items-start bg-orange-950/30 p-3 rounded">
              <span className="text-orange-400 mr-2 text-xl">✗</span>
              <span className="text-gray-300">Il ne désigne aucune responsabilité</span>
            </div>
            <div className="flex items-start bg-orange-950/30 p-3 rounded">
              <span className="text-orange-400 mr-2 text-xl">✗</span>
              <span className="text-gray-300">Il ne qualifie pas la variation</span>
            </div>
            <div className="flex items-start bg-orange-950/30 p-3 rounded">
              <span className="text-orange-400 mr-2 text-xl">✗</span>
              <span className="text-gray-300">Il ne prédit aucune évolution future</span>
            </div>
          </div>
        </div>

        {/* Bloc 5: Facteurs possibles */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-purple-900 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              5
            </span>
            Facteurs possibles (liste descriptive)
          </h2>

          <p className="text-gray-300 mb-4">
            Plusieurs facteurs peuvent influencer une variation de prix. Cette liste est
            descriptive, non exhaustive :
          </p>

          <div className="space-y-3">
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-100">Approvisionnement</p>
              <p className="text-sm text-gray-600">
                Coût d'achat, disponibilité des matières premières, fournisseurs
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-100">Logistique</p>
              <p className="text-sm text-gray-600">Transport, stockage, distribution</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-100">Saisonnalité</p>
              <p className="text-sm text-gray-600">Demande variable selon les périodes</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-100">Promotions</p>
              <p className="text-sm text-gray-600">Opérations commerciales temporaires</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-100">Contexte économique</p>
              <p className="text-sm text-gray-600">Inflation, taux de change, taxes</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-100">Gestion des stocks</p>
              <p className="text-sm text-gray-600">Rotation, péremption, volumes</p>
            </div>
          </div>

          <p className="text-sm text-purple-300 bg-purple-950/30 p-3 rounded mt-4">
            ⚠️ Ces facteurs sont mentionnés à titre informatif. Ils n'expliquent pas automatiquement
            chaque variation observée.
          </p>
        </div>

        {/* Bloc 6: Illustration pédagogique */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-indigo-900 text-indigo-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              6
            </span>
            Illustration pédagogique (schéma simplifié)
          </h2>

          <div className="bg-indigo-950/30 p-6 rounded-lg">
            <div className="text-center mb-4">
              <p className="font-semibold text-indigo-200 mb-2">Produit identique observé</p>
              <p className="text-3xl font-bold text-indigo-300">📦</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center bg-slate-800/50 p-4 rounded">
                <p className="text-sm text-gray-400 mb-1">5 mars</p>
                <p className="text-2xl font-bold text-gray-100">2,30 €</p>
              </div>
              <div className="text-center bg-slate-800/50 p-4 rounded">
                <p className="text-sm text-gray-400 mb-1">20 mars</p>
                <p className="text-2xl font-bold text-gray-100">2,55 €</p>
              </div>
              <div className="text-center bg-slate-800/50 p-4 rounded">
                <p className="text-sm text-gray-400 mb-1">Variation</p>
                <p className="text-2xl font-bold text-indigo-300">+0,25 €</p>
              </div>
            </div>

            <div className="text-center text-sm text-indigo-300 bg-slate-800/50 p-3 rounded">
              Cette variation est observée. Ses causes précises ne sont pas déterminées par
              l'observatoire.
            </div>
          </div>
        </div>

        {/* Bloc 7: Ce qu'on ne peut pas comparer directement */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-yellow-900 text-yellow-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              7
            </span>
            Ce qu'on ne peut pas comparer directement
          </h2>

          <p className="text-gray-300 mb-4">Certaines comparaisons peuvent induire en erreur :</p>

          <div className="space-y-3">
            <div className="bg-yellow-950/30 border-l-4 border-yellow-500 p-4">
              <p className="font-semibold text-gray-100 mb-1">Prix sans contexte temporel</p>
              <p className="text-sm text-gray-300">
                Un prix du 5 mars ne peut pas être comparé à un prix du 20 avril sans tenir compte
                du temps écoulé.
              </p>
            </div>
            <div className="bg-yellow-950/30 border-l-4 border-yellow-500 p-4">
              <p className="font-semibold text-gray-100 mb-1">Prix entre territoires différents</p>
              <p className="text-sm text-gray-300">
                Les contextes locaux varient (logistique, taxes, approvisionnement).
              </p>
            </div>
            <div className="bg-yellow-950/30 border-l-4 border-yellow-500 p-4">
              <p className="font-semibold text-gray-100 mb-1">Prix hors périodes promotionnelles</p>
              <p className="text-sm text-gray-300">
                Une promotion temporaire modifie le prix observé sans que cela reflète une variation
                structurelle.
              </p>
            </div>
          </div>
        </div>

        {/* Bloc 8: Erreurs fréquentes d'interprétation */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-red-900 text-red-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              8
            </span>
            Erreurs fréquentes d'interprétation
          </h2>

          <div className="space-y-4">
            <div className="bg-red-950/30 p-4 rounded">
              <p className="font-semibold text-red-200 mb-2">
                ❌ Erreur 1 : Attribuer une cause unique
              </p>
              <p className="text-sm text-gray-300">
                "Le prix a augmenté, c'est forcément à cause de X"
                <br />→ Une variation peut résulter de multiples facteurs combinés.
              </p>
            </div>

            <div className="bg-red-950/30 p-4 rounded">
              <p className="font-semibold text-red-200 mb-2">
                ❌ Erreur 2 : Généraliser à partir d'un cas
              </p>
              <p className="text-sm text-gray-300">
                "Ce produit a augmenté, donc tous les prix augmentent"
                <br />→ Chaque produit a sa propre évolution.
              </p>
            </div>

            <div className="bg-red-950/30 p-4 rounded">
              <p className="font-semibold text-red-200 mb-2">
                ❌ Erreur 3 : Anticiper automatiquement
              </p>
              <p className="text-sm text-gray-300">
                "Le prix a baissé 2 fois, il va continuer à baisser"
                <br />→ Aucune tendance passée ne garantit une évolution future.
              </p>
            </div>

            <div className="bg-red-950/30 p-4 rounded">
              <p className="font-semibold text-red-200 mb-2">
                ❌ Erreur 4 : Utiliser des termes de jugement
              </p>
              <p className="text-sm text-gray-300">
                "Ce prix est normal / anormal / excessif / abusif"
                <br />→ L'observatoire ne qualifie pas les variations.
              </p>
            </div>
          </div>
        </div>

        {/* Bloc 9: Rôle de l'observatoire */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
            <span className="bg-gray-800 text-gray-300 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              9
            </span>
            Rôle de l'observatoire
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-950/30 p-4 rounded">
              <p className="font-semibold text-blue-200 mb-2">✓ Ce que fait l'observatoire</p>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Collecter des prix observés</li>
                <li>• Afficher des évolutions temporelles</li>
                <li>• Permettre des comparaisons factuelles</li>
                <li>• Informer de manière transparente</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-4 rounded">
              <p className="font-semibold text-gray-100 mb-2">
                ✗ Ce que ne fait pas l'observatoire
              </p>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Expliquer les causes des variations</li>
                <li>• Désigner des responsabilités</li>
                <li>• Prévoir les prix futurs</li>
                <li>• Qualifier les variations (justes/injustes)</li>
                <li>• Recommander des achats</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Avertissement institutionnel final */}
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-3">⚠️ Avertissement important</h3>
          <p className="text-gray-300 leading-relaxed">
            Cette page a une vocation pédagogique descriptive.
            <br />
            Elle ne constitue ni une analyse économique, ni une évaluation des responsabilités, ni
            une prévision de prix, ni un conseil d'achat.
            <br />
            <br />
            L'objectif est d'informer les citoyens sur le phénomène des variations de prix sans
            orienter leur interprétation.
          </p>
        </div>

        {/* Liens vers autres ressources */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-100 mb-3">
            📚 Autres ressources pédagogiques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              to="/ressources/glossaire-logistique-dom"
              className="block p-3 bg-blue-950/30 hover:bg-blue-900/40 rounded transition-colors"
            >
              <span className="font-semibold text-blue-300">Glossaire logistique DOM</span>
            </Link>
            <Link
              to="/ressources/questions-logistique-dom"
              className="block p-3 bg-blue-950/30 hover:bg-blue-900/40 rounded transition-colors"
            >
              <span className="font-semibold text-blue-300">Questions fréquentes</span>
            </Link>
            <Link
              to="/recherche-prix/indice-logistique"
              className="block p-3 bg-blue-950/30 hover:bg-blue-900/40 rounded transition-colors"
            >
              <span className="font-semibold text-blue-300">Indice Logistique DOM</span>
            </Link>
            <Link
              to="/recherche-prix/delais-logistiques"
              className="block p-3 bg-blue-950/30 hover:bg-blue-900/40 rounded transition-colors"
            >
              <span className="font-semibold text-blue-300">Délais & tensions logistiques</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PourquoiPrixVarieSansChangement;
