/**
 * Page Pack Presse
 * 
 * Official press pack for A KI PRI SA YÉ
 * Includes press release, quotes, project sheet, editorial angles, and useful links
 * Supports print functionality for PDF download
 */

import React from 'react';
import { Card } from '../components/card.jsx';

export default function Presse() {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const printPress = () => {
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Presse() {
  const today = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white print:bg-white print:text-black print:border-2 print:border-gray-300">
          <h1 className="text-4xl font-bold mb-3">
            📰 Pack Presse Officiel
          </h1>
          <p className="text-xl text-blue-100 print:text-gray-700">
            A KI PRI SA YÉ — Observatoire citoyen des prix
          </p>
          <p className="text-sm text-blue-200 print:text-gray-600 mt-3">
            Document officiel — {currentDate}
          </p>
        </div>

        {/* Action Button */}
        <div className="print:hidden">
          <button
            onClick={printPress}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🖨️</span>
            <span>Télécharger le communiqué (PDF)</span>
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Utilisez la fonction d'impression de votre navigateur pour sauvegarder en PDF
          </p>
        </div>

        {/* Section 1: Communiqué de presse */}
        <Card className="p-8 print:shadow-none print:border-2 print:border-gray-300">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-3">
                📄 1️⃣ COMMUNIQUÉ DE PRESSE
              </h2>
              <p className="text-sm text-gray-500 italic mb-4">Texte officiel</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                📰 Titre
              </h3>
              <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                A KI PRI SA YÉ lance un observatoire citoyen des prix pour mieux comprendre 
                la vie chère dans les territoires ultramarins
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🗓️ Date / Lieu
              </h3>
              <p className="text-gray-700">
                Guadeloupe, {currentDate}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✍️ Corps du communiqué
              </h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  <strong>A KI PRI SA YÉ</strong> met en ligne un observatoire citoyen des prix 
                  destiné à rendre plus lisible l'évolution du coût de la vie dans les territoires ultramarins.
                </p>
                <p>
                  La plateforme permet de consulter des prix observés, de comparer les territoires 
                  à produit équivalent, d'analyser les évolutions dans le temps et de détecter 
                  automatiquement des variations inhabituelles, grâce à des méthodes statistiques 
                  simples et explicables.
                </p>
                <p>
                  L'ensemble des données est publié en open data, sans collecte de données personnelles, 
                  sans publicité et sans système de notation.
                </p>
                <p>
                  <strong>A KI PRI SA YÉ</strong> se positionne comme un outil citoyen, indépendant 
                  et transparent, au service du débat public, des collectivités, des associations 
                  et des chercheurs.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                📌 Mentions importantes
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Données publiques et ouvertes</li>
                <li>Aucune collecte utilisateur</li>
                <li>Méthodologie explicable</li>
                <li>Projet non partisan</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Section 2: Citations officielles */}
        <Card className="p-8 print:shadow-none print:border-2 print:border-gray-300 print:break-before-page">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-3">
                🎤 2️⃣ CITATIONS OFFICIELLES
              </h2>
              <p className="text-sm text-gray-500 italic mb-4">Prêtes à être reprises</p>
            </div>

            <div className="bg-blue-50 print:bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Citation courte (radio / titre d'article)
              </h3>
              <blockquote className="text-xl italic text-gray-800">
                « A KI PRI SA YÉ n'accuse pas, il montre. Les chiffres parlent d'eux-mêmes. »
              </blockquote>
            </div>

            <div className="bg-blue-50 print:bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Citation institutionnelle
              </h3>
              <blockquote className="text-xl italic text-gray-800">
                « Notre objectif est de rendre les prix visibles, comparables et compréhensibles, 
                sans jugement ni polémique. »
              </blockquote>
            </div>

            <div className="bg-blue-50 print:bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Citation pédagogique
              </h3>
              <blockquote className="text-xl italic text-gray-800">
                « L'observatoire repose sur des méthodes simples, ouvertes et auditées. 
                Chacun peut vérifier les données. »
              </blockquote>
            </div>
          </div>
        </Card>

        {/* Section 3: Fiche projet */}
        <Card className="p-8 print:shadow-none print:border-2 print:border-gray-300">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-3">
                🧾 3️⃣ FICHE PROJET
              </h2>
              <p className="text-sm text-gray-500 italic mb-4">Pour journalistes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Nom</h3>
                <p className="text-gray-700">A KI PRI SA YÉ</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Nature</h3>
                <p className="text-gray-700">Observatoire citoyen des prix</p>
              </div>

              <div className="md:col-span-2">
                <h3 className="font-bold text-gray-900 mb-2">Territoires</h3>
                <p className="text-gray-700">
                  Outre-mer (périmètre précisé sur le site)
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Fonctionnalités clés</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Observatoire des prix vivant</li>
                <li>Comparaison inter-territoires</li>
                <li>Détection d'anomalies expliquée</li>
                <li>Export open data (JSON / CSV)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Spécificités</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Pas de publicité</li>
                <li>Pas de tracking</li>
                <li>Pas de données personnelles</li>
                <li>Code et méthodologie transparents</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Section 4: Angles éditoriaux */}
        <Card className="p-8 print:shadow-none print:border-2 print:border-gray-300 print:break-before-page">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-3">
                🧠 4️⃣ ANGLES ÉDITORIAUX PROPOSÉS
              </h2>
              <p className="text-sm text-gray-500 italic mb-4">Aide aux journalistes</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 print:bg-white border border-gray-200 p-5 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">
                  "La vie chère vue par les chiffres, sans discours"
                </p>
              </div>

              <div className="bg-gray-50 print:bg-white border border-gray-200 p-5 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">
                  "Comparer les prix entre territoires : que disent réellement les données ?"
                </p>
              </div>

              <div className="bg-gray-50 print:bg-white border border-gray-200 p-5 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">
                  "Un observatoire citoyen pour objectiver le débat sur le coût de la vie"
                </p>
              </div>

              <div className="bg-gray-50 print:bg-white border border-gray-200 p-5 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">
                  "Quand les données publiques deviennent accessibles à tous"
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 5: Liens utiles */}
        <Card className="p-8 print:shadow-none print:border-2 print:border-gray-300">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-3">
                🌐 5️⃣ LIENS À FOURNIR DANS LES ARTICLES
              </h2>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Site principal</h3>
              <a 
                href="https://akiprisaye-web.pages.dev/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-lg print:text-black"
              >
                https://akiprisaye-web.pages.dev/
              </a>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Pages importantes</h3>
              <ul className="space-y-3">
                <li>
                  <span className="font-medium text-gray-900">Page Observatoire :</span>{' '}
                  <a 
                    href="https://akiprisaye-web.pages.dev/observatoire" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline print:text-black"
                  >
                    /observatoire
                  </a>
                </li>
                <li>
                  <span className="font-medium text-gray-900">Page Observatoire Vivant :</span>{' '}
                  <a 
                    href="https://akiprisaye-web.pages.dev/observatoire-vivant" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline print:text-black"
                  >
                    /observatoire-vivant
                  </a>
                </li>
                <li>
                  <span className="font-medium text-gray-900">Page Données publiques :</span>{' '}
                  <a 
                    href="https://akiprisaye-web.pages.dev/donnees-publiques" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline print:text-black"
                  >
                    /donnees-publiques
                  </a>
                </li>
                <li>
                  <span className="font-medium text-gray-900">Page Méthodologie :</span>{' '}
                  <a 
                    href="https://akiprisaye-web.pages.dev/methodologie" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline print:text-black"
                  >
                    /methodologie
                  </a>
                </li>
                <li>
                  <span className="font-medium text-gray-900">Page Dossier collectivités :</span>{' '}
                  <a 
                    href="https://akiprisaye-web.pages.dev/contact-collectivites" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline print:text-black"
                  >
                    /contact-collectivites
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Footer for print */}
        <div className="hidden print:block mt-8 pt-6 border-t-2 border-gray-300">
          <p className="text-center text-sm text-gray-600">
            A KI PRI SA YÉ — Observatoire citoyen des prix
            <br />
            Document généré le {currentDate}
            <br />
            https://akiprisaye-web.pages.dev/
          </p>
        </div>
      </div>
    </div>
  );
}
