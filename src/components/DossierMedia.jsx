/**
 * DossierMedia Component
 * 
 * Media and institutional dossier for A KI PRI SA YÉ
 * Generates a downloadable report with:
 * - Project presentation
 * - IEVR methodology
 * - Territory scores and labels
 * - Monthly evolution
 * - Legal mentions
 */

import { useState } from 'react';
import { Card } from './card.jsx';
import ievrData from '../data/ievr-data.json';
import { getTerritoryStatus } from '../utils/ievrCalculations.js';

export function DossierMedia() {
  const [selectedFormat, setSelectedFormat] = useState('html');

  // Prepare territory data with labels
  const territoriesWithStatus = Object.entries(ievrData.territories)
    .filter(([code]) => code !== 'FR') // Exclude reference territory
    .map(([code, territory]) => ({
      code,
      ...territory,
      status: getTerritoryStatus(territory.current.score),
    }))
    .sort((a, b) => a.current.score - b.current.score); // Sort by score ascending (worst first)

  const generatePDF = () => {
    // In production, this would use a library like jsPDF or html2pdf
    alert('Fonctionnalité de génération PDF à implémenter avec jsPDF ou html2pdf.js');
  };

  const printDossier = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-lg p-6 text-white print:bg-white print:text-black">
        <h1 className="text-3xl font-bold mb-2">
          📰 Dossier Média & Institutionnel
        </h1>
        <p className="text-slate-200 print:text-gray-700">
          A KI PRI SA YÉ - Plateforme citoyenne de transparence des prix
        </p>
        <p className="text-sm text-slate-300 print:text-gray-600 mt-2">
          Document généré le {new Date().toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric', 
          })}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 print:hidden">
        <button
          onClick={printDossier}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          🖨️ Imprimer / Sauvegarder PDF
        </button>
        <button
          onClick={() => window.location.href = '/METHODOLOGIE_IEVR_v1.0.md'}
          className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
        >
          📄 Télécharger méthodologie
        </button>
      </div>

      {/* Section 1: Project Presentation */}
      <Card className="p-8 print:shadow-none print:border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
          1. Présentation du projet
        </h2>
        
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg mb-2">🎯 Objectif</h3>
            <p>
              <strong>A KI PRI SA YÉ</strong> est une plateforme citoyenne dédiée à la transparence 
              des prix et à la lutte contre la vie chère dans les territoires d'Outre-mer.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">🧠 Innovation principale</h3>
            <p>
              L'<strong>Indice d'Écart de Vie Réelle (IEVR)</strong> - Un indicateur unique qui mesure 
              la difficulté réelle de vivre dans un territoire par rapport à une référence nationale.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">✅ Principes déontologiques</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Aucune accusation envers les enseignes</li>
              <li>Données factuelles et vérifiables</li>
              <li>Calculs transparents et reproductibles</li>
              <li>Neutralité absolue</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">🎓 Public cible</h3>
            <p>
              Citoyens, médias, élus, associations, chercheurs, institutions publiques
            </p>
          </div>
        </div>
      </Card>

      {/* Section 2: IEVR Methodology */}
      <Card className="p-8 print:shadow-none print:border print:break-before-page">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
          2. Méthodologie IEVR (Résumé)
        </h2>

        <div className="space-y-4 text-gray-700">
          <div>
            <p className="font-mono text-sm bg-slate-100 px-3 py-2 rounded inline-block">
              {ievrData.metadata.officialId}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📊 Catégories et pondérations</h3>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Catégorie</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Pondération</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ievrData.categories).map(([key, category]) => (
                  <tr key={key}>
                    <td className="border border-gray-300 px-4 py-2">{category.label}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {(category.weight * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🏷️ Labels automatiques</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <strong>Situation normale</strong> (IEVR ≥ 90) - Écart faible avec la référence
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <strong>Sous tension</strong> (75 ≤ IEVR {'<'} 90) - Écart notable nécessitant vigilance
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔴</span>
                <div>
                  <strong>Forte tension</strong> (IEVR {'<'} 75) - Écart important nécessitant attention
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📐 Formule</h3>
            <pre className="bg-slate-100 p-4 rounded text-xs font-mono overflow-x-auto">
              IEVR = Σ (Score_catégorie × Pondération_catégorie)
            </pre>
          </div>

          <div>
            <p className="text-sm italic">
              📄 Méthodologie complète disponible : METHODOLOGIE_IEVR_v{ievrData.metadata.methodologyVersion}.md
            </p>
          </div>
        </div>
      </Card>

      {/* Section 3: Territory Scores */}
      <Card className="p-8 print:shadow-none print:border print:break-before-page">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
          3. Scores par territoire
        </h2>

        <div className="mb-4 text-sm text-gray-600">
          Dernière mise à jour : {ievrData.metadata.lastUpdate} • 
          Référence : {ievrData.metadata.reference} = {ievrData.metadata.referenceScore}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Territoire</th>
                <th className="border border-gray-300 px-4 py-2 text-center">IEVR</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Statut</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Écart vs référence</th>
              </tr>
            </thead>
            <tbody>
              {territoriesWithStatus.map((territory) => {
                const gap = territory.current.score - ievrData.metadata.referenceScore;
                return (
                  <tr key={territory.code}>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className="mr-2">{territory.flag}</span>
                      <strong>{territory.name}</strong>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className="font-bold text-lg" style={{ color: territory.status.color }}>
                        {territory.current.score}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className="inline-flex items-center gap-1">
                        <span>{territory.status.icon}</span>
                        <span className="font-semibold">{territory.status.label}</span>
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={gap < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {gap > 0 ? '+' : ''}{gap}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded text-sm">
          <p>
            <strong>Lecture :</strong> Un score inférieur à 100 indique que vivre dans ce territoire 
            est plus difficile qu'en France métropolitaine (coûts plus élevés relativement aux revenus).
          </p>
        </div>
      </Card>

      {/* Section 4: Key Findings */}
      <Card className="p-8 print:shadow-none print:border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
          4. Constats principaux
        </h2>

        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">🔴 Territoires en forte tension</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {territoriesWithStatus
                .filter(t => t.status.level === 'high-pressure')
                .map(t => (
                  <li key={t.code}>
                    {t.flag} <strong>{t.name}</strong> - IEVR : {t.current.score}
                  </li>
                ))}
            </ul>
            {territoriesWithStatus.filter(t => t.status.level === 'high-pressure').length === 0 && (
              <p className="text-gray-500 ml-4">Aucun territoire en forte tension</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">⚠️ Territoires sous tension</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {territoriesWithStatus
                .filter(t => t.status.level === 'pressure')
                .map(t => (
                  <li key={t.code}>
                    {t.flag} <strong>{t.name}</strong> - IEVR : {t.current.score}
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📊 Statistiques</h3>
            <ul className="space-y-1 ml-4">
              <li>
                <strong>Score moyen :</strong>{' '}
                {(territoriesWithStatus.reduce((sum, t) => sum + t.current.score, 0) / territoriesWithStatus.length).toFixed(1)}
              </li>
              <li>
                <strong>Score le plus bas :</strong>{' '}
                {territoriesWithStatus[0].current.score} ({territoriesWithStatus[0].name})
              </li>
              <li>
                <strong>Score le plus élevé :</strong>{' '}
                {territoriesWithStatus[territoriesWithStatus.length - 1].current.score} (
                {territoriesWithStatus[territoriesWithStatus.length - 1].name})
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Section 5: Legal Mentions */}
      <Card className="p-8 print:shadow-none print:border print:break-before-page">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
          5. Mentions légales et neutralité
        </h2>

        <div className="space-y-4 text-gray-700 text-sm">
          <div>
            <h3 className="font-semibold mb-2">⚖️ Cadre légal</h3>
            <p>
              Ce document présente des données factuelles et chiffrées issues de méthodologies 
              transparentes et reproductibles. Aucune accusation n'est portée envers quelque 
              entité que ce soit.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🔒 Neutralité</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Aucun nom d'enseigne n'est cité</li>
              <li>Les données sont issues de sources publiques ou d'observations encadrées</li>
              <li>Les calculs sont vérifiables et documentés</li>
              <li>L'indice est purement descriptif, non prescriptif</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📜 Licence</h3>
            <p>
              La méthodologie IEVR est publiée sous licence Creative Commons BY-SA 4.0.
              Les données sont mises à disposition pour un usage d'intérêt général.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📧 Contact</h3>
            <p>
              Pour toute question relative à ce dossier ou à la méthodologie IEVR, 
              veuillez contacter l'équipe du projet A KI PRI SA YÉ.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-500">
              Document généré automatiquement par la plateforme A KI PRI SA YÉ •
              Version {ievrData.metadata.version} •
              {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DossierMedia;
