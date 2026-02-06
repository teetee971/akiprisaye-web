// src/pages/ComprendrePrix.tsx
import React from "react";
import { TrendingUp, Globe, Package, Ship, DollarSign, AlertTriangle } from "lucide-react";

export default function ComprendrePrix() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            💡 Comprendre les prix
          </h1>
          <p className="text-xl text-gray-300">
            Pourquoi les prix sont-ils différents entre les territoires ?
          </p>
        </div>

        {/* Main Explanation */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Pourquoi c'est plus cher ici ?
          </h2>
          <p className="text-gray-300 mb-4">
            Les écarts de prix entre les territoires ultramarins et l'Hexagone s'expliquent par
            plusieurs facteurs structurels. Cette page vous aide à comprendre ces différences
            de manière claire et objective.
          </p>
        </div>

        {/* Factors Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Factor 1: Transport */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <Ship className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Transport maritime</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Le transport par bateau ou avion depuis l'Hexagone ou l'international représente
              un coût important. Plus la distance est grande, plus le coût augmente.
            </p>
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-xs">
                <strong>Impact:</strong> +15% à +30% sur le prix final
              </p>
            </div>
          </div>

          {/* Factor 2: Taxes et Octroi de mer */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <DollarSign className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Taxes locales</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              L'octroi de mer et autres taxes locales financent les collectivités territoriales
              et protègent la production locale, mais augmentent les prix.
            </p>
            <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
              <p className="text-purple-200 text-xs">
                <strong>Impact:</strong> Variable selon les produits (0% à 30%)
              </p>
            </div>
          </div>

          {/* Factor 3: Logistique locale */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <Package className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Logistique et stockage</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Les coûts de stockage, de manutention et de distribution locale sont plus élevés
              dans les territoires insulaires ou éloignés.
            </p>
            <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
              <p className="text-green-200 text-xs">
                <strong>Impact:</strong> +5% à +15% sur le prix final
              </p>
            </div>
          </div>

          {/* Factor 4: Marché restreint */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-900/30 rounded-lg">
                <Globe className="text-orange-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Marché de niche</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Les petits volumes de vente réduisent les économies d'échelle et limitent
              la concurrence entre distributeurs.
            </p>
            <div className="p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
              <p className="text-orange-200 text-xs">
                <strong>Impact:</strong> +10% à +25% sur le prix final
              </p>
            </div>
          </div>
        </div>

        {/* How we calculate gaps */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-blue-400" size={28} />
            <h2 className="text-2xl font-semibold text-white">
              Comment sont calculés les écarts ?
            </h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>
              Notre plateforme compare les prix d'un même produit (identifié par son code-barres EAN)
              entre différents territoires et enseignes. Voici notre méthodologie :
            </p>
            
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li className="text-sm">
                <strong className="text-white">Identification du produit :</strong> Chaque produit est
                identifié de manière unique par son code EAN-13.
              </li>
              <li className="text-sm">
                <strong className="text-white">Collecte des prix :</strong> Les prix sont relevés
                par des citoyens ou via des données officielles (quand disponibles).
              </li>
              <li className="text-sm">
                <strong className="text-white">Calcul de l'écart :</strong> L'écart est calculé en
                pourcentage par rapport au prix le plus bas trouvé.
              </li>
              <li className="text-sm">
                <strong className="text-white">Affichage transparent :</strong> La source, la date
                de collecte et le territoire sont toujours indiqués.
              </li>
            </ol>

            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg mt-4">
              <p className="text-blue-200 text-sm">
                <strong>Exemple :</strong> Un produit coûte 3,50 € en Guadeloupe et 2,80 € en France
                métropolitaine. L'écart est de <strong>+25%</strong> (0,70 € de différence).
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Important à savoir
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  • Les prix peuvent varier selon les enseignes, les périodes et les promotions.
                </li>
                <li>
                  • Les données affichées proviennent de relevés citoyens ou de sources officielles.
                </li>
                <li>
                  • Nous ne sommes pas affiliés aux enseignes et ne percevons aucune commission.
                </li>
                <li>
                  • Cette plateforme est un outil citoyen gratuit pour la transparence des prix.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href="/comparateur"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Comparer les prix maintenant
          </a>
        </div>
      </div>
    </div>
  );
}
