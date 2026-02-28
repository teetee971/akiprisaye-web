/**
 * OCR Hub - Unified entry point for all OCR functionalities
 * 
 * Navigation par intention utilisateur:
 * - Scanner texte & tickets
 * - Scanner ingrédients (aliments, cosmétiques)
 * - Recherche produit par image
 * - OCR & Prix (observatoire)
 * 
 * Principes:
 * - 100% local processing (WASM Tesseract.js)
 * - Aucune interprétation automatique
 * - Validation utilisateur obligatoire
 * - Traçabilité et auditabilité
 * - Compatible RGPD / AI Act UE
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import OCRCard from '../../components/ocr/OCRCard';

interface OCRMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  available: boolean;
}

const OCR_MODES: OCRMode[] = [
  {
    id: 'text',
    title: 'Scanner texte & tickets',
    description: 'Extraction de texte brut depuis images, tickets de caisse, documents',
    icon: '📝',
    route: '/scanner',
    color: 'blue',
    available: true,
  },
  {
    id: 'ean',
    title: 'Scanner code-barres',
    description: 'Lecture de codes EAN-13, EAN-8, UPC pour identification produits',
    icon: '📊',
    route: '/scan-ean',
    color: 'green',
    available: true,
  },
  {
    id: 'products',
    title: 'Scanner produit complet',
    description: 'Analyse complète d\'un produit (code-barres, ingrédients, prix)',
    icon: '🛒',
    route: '/scanner-produit',
    color: 'purple',
    available: true,
  },
  {
    id: 'photo',
    title: 'Analyse photo produit',
    description: 'Identification produit par photo avec extraction d\'informations',
    icon: '📸',
    route: '/analyse-photo-produit',
    color: 'orange',
    available: true,
  },
];

const GOVERNANCE_PRINCIPLES = [
  {
    icon: '🔒',
    title: 'OCR 100% local',
    description: 'Traitement WASM dans le navigateur, aucun envoi serveur',
  },
  {
    icon: '⚠️',
    title: 'Pas de recommandation automatique',
    description: 'Extraction brute uniquement, aucune interprétation santé',
  },
  {
    icon: '✅',
    title: 'Validation utilisateur obligatoire',
    description: 'Toute détection nécessite confirmation humaine',
  },
  {
    icon: '🛡️',
    title: 'Compatible RGPD / AI Act',
    description: 'Aucune biométrie, aucune interprétation médicale',
  },
];

export default function OCRHub() {
  const navigate = useNavigate();

  // Production proof: Log when component mounts
  if (import.meta.env.MODE === 'production') {
    console.info('[OCR] OCRHub mounted', import.meta.env.MODE);
  }

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <>
      <Helmet>
        <title>OCR & Scan - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Module OCR unifié - Extraction locale, transparente et vérifiable de texte, codes-barres, ingrédients et produits"
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              OCR 100% Local • WASM Tesseract.js
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              🔎 OCR & Scan
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Extraction locale, transparente et vérifiable
            </p>

            {/* Legal Notice */}
            <div className="mt-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 text-left">
                  <p className="font-semibold mb-1">Extraction de texte locale uniquement</p>
                  <p className="text-xs">
                    Aucune interprétation automatique. Les données sont traitées dans votre
                    navigateur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OCR Modes Cards */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Choisissez votre mode de scan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {OCR_MODES.map((mode) => (
                <OCRCard
                  key={mode.id}
                  icon={mode.icon}
                  title={mode.title}
                  description={mode.description}
                  color={mode.color}
                  available={mode.available}
                  onClick={() => handleNavigate(mode.route)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Governance & Compliance Section */}
        <section className="py-16 px-4 bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                🛡️ Gouvernance & Conformité
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Principes stricts pour une utilisation responsable et auditable de l'OCR
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {GOVERNANCE_PRINCIPLES.map((principle, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
                >
                  <div className="text-3xl mb-3" aria-hidden="true">
                    {principle.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{principle.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{principle.description}</p>
                </div>
              ))}
            </div>

            {/* Additional Information */}
            <div className="mt-12 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-4">
                <div className="text-3xl" aria-hidden="true">
                  ℹ️
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-blue-300">Technologie utilisée</h3>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    <strong>Tesseract.js</strong> - Moteur OCR open-source compilé en WebAssembly
                    (WASM), s'exécutant entièrement dans votre navigateur sans connexion serveur
                    requise.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      🔓 Open Source
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      🌐 Offline Ready
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      🔒 Privacy First
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      ⚡ WASM Performance
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Quick Links */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Fonctionnalités avancées</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/ocr/history"
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all hover:scale-105"
              >
                <div className="text-3xl mb-3">📜</div>
                <div className="font-bold mb-2">Historique OCR</div>
                <div className="text-sm text-gray-400">
                  Consultez vos scans récents (stockage local uniquement)
                </div>
              </Link>

              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-3xl mb-3">📊</div>
                <div className="font-bold mb-2">Score qualité</div>
                <div className="text-sm text-gray-400">
                  Indicateur technique de lisibilité (automatique sur chaque scan)
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-3xl mb-3">🔬</div>
                <div className="font-bold mb-2">Mode Expert</div>
                <div className="text-sm text-gray-400">
                  Analyse avancée avec métriques techniques détaillées
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/methodologie"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                En savoir plus sur notre méthodologie OCR
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
