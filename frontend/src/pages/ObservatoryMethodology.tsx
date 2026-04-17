/**
 * Methodology and Transparency Page
 *
 * Page de transparence et méthodologie de l'observatoire
 * Explique les sources, calculs et limites
 */

import React from 'react';
import { Link } from 'react-router-dom';

export const ObservatoryMethodology: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-white">📚 Méthodologie de l'Observatoire</h1>
          <p className="text-lg text-slate-300">
            Documentation complète sur les sources, méthodes de calcul et limites de l'observatoire
            des prix.
          </p>
        </header>

        {/* Objectif */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">🎯 Objectif</h2>
          <p className="text-slate-300">
            L'observatoire des prix d'A ki pri sa yé vise à fournir des données{' '}
            <strong className="text-white">transparentes, traçables et vérifiables</strong> sur les
            prix réels pratiqués dans les territoires ultramarins et en Hexagone.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200">
              ✅ Données réelles et sourcées
              <br />
              ✅ Méthodologie transparente
              <br />
              ✅ Aucune donnée fictive
              <br />✅ Traçabilité complète
            </p>
          </div>
        </section>

        {/* Ce que fait le système */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">✅ Ce que fait le système</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Collecte des observations de prix réels provenant de sources multiples</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Agrégation par tranches temporelles (heure, jour, semaine, mois)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Normalisation des formats de produits (1L, 500g, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Historisation immuable avec timestamp systématique</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Détection d'anomalies par méthodes statistiques explicables</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Export open data (JSON, CSV) sous licence Etalab 2.0</span>
            </li>
          </ul>
        </section>

        {/* Ce que ne fait PAS le système */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">❌ Ce que ne fait PAS le système</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">✗</span>
              <span>Aucune extrapolation ou estimation statistique avancée</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">✗</span>
              <span>Aucune intelligence artificielle opaque</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">✗</span>
              <span>Aucune modification silencieuse des données historiques</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">✗</span>
              <span>Aucun classement punitif ou palmarès "meilleur/pire"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">✗</span>
              <span>Aucune prédiction de prix futurs</span>
            </li>
          </ul>
        </section>

        {/* Sources de Données */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">🔍 Sources de Données</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">1. Relevés Citoyens</h3>
              <p className="text-slate-300">
                Observations directes par les utilisateurs de la plateforme. Chaque relevé citoyen
                est horodaté et géolocalisé (avec consentement).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">2. Scan de Tickets</h3>
              <p className="text-slate-300">
                Tickets de caisse numérisés via OCR. Fournit une preuve photographique de l'achat
                réel.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">3. Données Ouvertes</h3>
              <p className="text-slate-300">
                Données publiques issues de l'INSEE, IEDOM, OPMR, observatoires locaux et bases
                gouvernementales.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">4. Relevés Terrain</h3>
              <p className="text-slate-300">
                Observations structurées effectuées directement en magasin dans le cadre d'enquêtes
                terrain.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">5. APIs Publiques</h3>
              <p className="text-slate-300">
                Données provenant d'APIs publiques comme Open Food Facts pour l'enrichissement des
                informations produit.
              </p>
            </div>
          </div>
        </section>

        {/* Fréquence de mise à jour */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">🕐 Fréquence de Mise à Jour</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-300 mb-2">Données Temps Réel</h3>
              <p className="text-slate-300 text-sm">
                Les nouvelles observations sont intégrées immédiatement dans la base de données et
                apparaissent dans l'observatoire dans les minutes qui suivent.
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">Agrégations</h3>
              <p className="text-slate-300 text-sm">
                Les calculs d'indicateurs (moyennes, écarts, anomalies) sont recalculés
                quotidiennement pour assurer la cohérence.
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-amber-300 mb-2">Snapshots</h3>
              <p className="text-slate-300 text-sm">
                Des snapshots mensuels sont générés pour permettre l'analyse historique et garantir
                l'immutabilité des données passées.
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-purple-300 mb-2">Open Data</h3>
              <p className="text-slate-300 text-sm">
                Les exports Open Data sont mis à jour quotidiennement et disponibles au
                téléchargement 24h/24.
              </p>
            </div>
          </div>
        </section>

        {/* Détection d'Anomalies */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">⚠️ Détection d'Anomalies</h2>
          <p className="text-slate-300">
            Le système détecte automatiquement les variations de prix inhabituelles à l'aide de
            <strong className="text-white"> méthodes statistiques explicables</strong>.
          </p>

          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-300 mb-2">📈 Hausse Brutale</h3>
              <p className="text-slate-300 text-sm">
                Variation de prix supérieure à 5% sur une période de 7 jours. Exemple: "Hausse de
                12% observée sur 7 jours (de 10.00€ à 11.20€)"
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-300 mb-2">🌍 Écart Territorial Excessif</h3>
              <p className="text-slate-300 text-sm">
                Écart de prix supérieur à 10% par rapport à l'Hexagone. Exemple: "Écart de 25% par
                rapport à l'Hexagone (12.50€ vs 10.00€)"
              </p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-orange-300 mb-2">📉 Shrinkflation</h3>
              <p className="text-slate-300 text-sm">
                Réduction de quantité avec prix stable. Exemple: "Réduction de quantité de 8% avec
                prix quasi stable (+12% au kg/L)"
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">⚠️ Rupture de Série</h3>
              <p className="text-slate-300 text-sm">
                Absence d'observations pendant plus de 60 jours. Exemple: "Absence d'observations
                pendant 75 jours"
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              <strong className="text-white">Important:</strong> Une anomalie détectée n'implique
              aucune infraction, aucune illégalité, ni aucune manipulation. C'est uniquement une
              observation statistique qui aide les citoyens à comprendre l'évolution des prix.
            </p>
          </div>
        </section>

        {/* Limites Assumées */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">⚖️ Limites Assumées</h2>

          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">⚠</span>
              <div>
                <strong className="text-white">Couverture territoriale variable:</strong> La densité
                d'observations varie selon les territoires. Les zones moins peuplées peuvent avoir
                moins d'observations.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">⚠</span>
              <div>
                <strong className="text-white">Représentativité:</strong> Les prix observés ne sont
                pas nécessairement représentatifs de l'ensemble du marché, ils reflètent les
                observations disponibles.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">⚠</span>
              <div>
                <strong className="text-white">Délai d'observation:</strong> Un délai peut exister
                entre la fixation d'un nouveau prix en magasin et son observation dans
                l'observatoire.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">⚠</span>
              <div>
                <strong className="text-white">Promotions temporaires:</strong> Les promotions
                ponctuelles peuvent créer des variations qui ne reflètent pas les tendances de fond.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">⚠</span>
              <div>
                <strong className="text-white">Contexte économique:</strong> Les écarts territoriaux
                peuvent être liés à des facteurs structurels (fret maritime, octroi de mer, économie
                insulaire).
              </div>
            </li>
          </ul>
        </section>

        {/* Licence Open Data */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">📜 Licence Open Data</h2>
          <p className="text-slate-300">
            Toutes les données de l'observatoire sont publiées sous{' '}
            <strong className="text-white">
              Licence Ouverte / Open Licence Version 2.0 (Etalab)
            </strong>
            .
          </p>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-green-300">✅ Vous êtes libre de:</h3>
            <ul className="text-slate-300 text-sm space-y-1 ml-4">
              <li>• Copier, distribuer et utiliser les données</li>
              <li>• Créer des œuvres dérivées</li>
              <li>• Modifier, transformer et développer les données</li>
              <li>• Utiliser les données à des fins commerciales</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-300">📋 Sous réserve de:</h3>
            <ul className="text-slate-300 text-sm space-y-1 ml-4">
              <li>
                • <strong>Attribution:</strong> Mentionner la source (A ki pri sa yé)
              </li>
              <li>
                • <strong>Mention de la licence:</strong> Inclure un lien vers la licence
              </li>
              <li>
                • <strong>Date:</strong> Indiquer la date de dernière mise à jour
              </li>
            </ul>
          </div>
        </section>

        {/* Contact & Protection Juridique */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            🛡️ Protection Juridique & Crédibilité
          </h2>
          <p className="text-slate-300">Cette méthodologie transparente et documentée garantit:</p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>
                <strong className="text-white">Protection juridique:</strong> Toutes les
                affirmations sont sourcées et justifiées
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>
                <strong className="text-white">Crédibilité maximale:</strong> Utilisable par
                collectivités, médias, chercheurs
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>
                <strong className="text-white">Traçabilité:</strong> Chaque donnée est horodatée et
                sourcée
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>
                <strong className="text-white">Reproductibilité:</strong> Les calculs peuvent être
                vérifiés indépendamment
              </span>
            </li>
          </ul>
        </section>

        {/* Footer Navigation */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            to="/observatoire-temps-reel"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            ← Retour à l'Observatoire
          </Link>
          <Link
            to="/transparence"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Transparence & Gouvernance
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Nous Contacter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ObservatoryMethodology;
