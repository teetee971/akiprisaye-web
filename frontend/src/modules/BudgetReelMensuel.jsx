/**
 * BudgetReelMensuel Component
 * 
 * Calculates and displays the real monthly budget based on standardized data.
 * Uses budget_reference.json for calculations.
 */

import { useState } from 'react';
import budgetRef from '../data/budget_reference.json';
import ievrRef from '../data/iev_r_reference.json';

export function BudgetReelMensuel() {
  const [selectedProfile, setSelectedProfile] = useState('adulte_seul');
  const [selectedTerritory, setSelectedTerritory] = useState('guadeloupe');

  const profiles = {
    adulte_seul: { label: 'Adulte seul', icon: '👤' },
    couple: { label: 'Couple', icon: '👥' },
    famille_2_enfants: { label: 'Famille (2 adultes + 2 enfants)', icon: '👨‍👩‍👧‍👦' },
    senior: { label: 'Senior', icon: '👴' },
  };

  const territories = {
    guadeloupe: { name: 'Guadeloupe', flag: '🇬🇵' },
    martinique: { name: 'Martinique', flag: '🇲🇶' },
    guyane: { name: 'Guyane', flag: '🇬🇫' },
    reunion: { name: 'La Réunion', flag: '🇷🇪' },
    mayotte: { name: 'Mayotte', flag: '🇾🇹' },
  };

  // Get data
  const revenuReference = budgetRef.referenceRevenus[selectedProfile];
  const territoire = budgetRef.territoires[selectedTerritory];
  const ievrScore = ievrRef.territoires[selectedTerritory];

  // Calculate total charges
  const totalCharges = 
    territoire.panier_vital +
    territoire.logement +
    territoire.transport +
    territoire.energie_eau +
    territoire.autres;

  // Calculate reste à vivre or deficit
  const resteAVivre = revenuReference - totalCharges;
  const isDeficit = resteAVivre < 0;
  const percentOfRevenu = ((totalCharges / revenuReference) * 100).toFixed(1);

  // Get IEVR status
  let ievrStatus = 'Situation comparable à la référence';
  let ievrColor = 'text-green-600';
  if (ievrScore < 75) {
    ievrStatus = 'Territoire sous forte tension';
    ievrColor = 'text-red-600';
  } else if (ievrScore < 90) {
    ievrStatus = 'Territoire sous tension';
    ievrColor = 'text-orange-600';
  }

  return (
    <div className="space-y-6">
      {/* Critical Data Warning */}
      {budgetRef.metadata.dataStatus !== 'OFFICIEL' && (
        <DataSourceWarning 
          dataStatus={budgetRef.metadata.dataStatus}
          requiredSources={budgetRef.metadata.requiredSources}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          💰 Budget Réel Mensuel
        </h2>
        <p className="text-green-50">
          Calculez votre budget selon votre situation et votre territoire
        </p>
      </div>

      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📋 Votre situation
        </h3>
        
        <div className="space-y-4">
          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profil
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(profiles).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProfile(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedProfile === key
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{p.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {p.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Territory Selection */}
          <div>
            <label htmlFor="territory-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Territoire
            </label>
            <select
              id="territory-select"
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
            >
              {Object.entries(territories).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Revenue Reference */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Revenu de référence
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Pour ce profil
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {revenuReference.toFixed(2)} €
          </div>
        </div>
      </Card>

      {/* Budget Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Charges mensuelles
        </h3>

        <div className="space-y-3 mb-6">
          <ChargeItem label="Panier vital (alimentation + hygiène)" amount={territoire.panier_vital} />
          <ChargeItem label="Logement" amount={territoire.logement} />
          <ChargeItem label="Transport" amount={territoire.transport} />
          <ChargeItem label="Énergie / Eau" amount={territoire.energie_eau} />
          <ChargeItem label="Autres coûts incompressibles" amount={territoire.autres} />
        </div>

        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              TOTAL DES CHARGES
            </span>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalCharges.toFixed(2)} €
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Représente {percentOfRevenu}% du revenu de référence
          </p>
        </div>
      </Card>

      {/* Calculation Result */}
      <Card className={`p-6 border-2 ${
        isDeficit 
          ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          : 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      }`}>
        <div className="flex items-start gap-4">
          <div className="text-5xl">
            {isDeficit ? '⚠️' : '✅'}
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-2 ${
              isDeficit ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
            }`}>
              {isDeficit ? 'Déficit mensuel' : 'Reste à vivre'}
            </h3>
            
            <div className={`text-4xl font-bold mb-3 ${
              isDeficit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {Math.abs(resteAVivre).toFixed(2)} €
            </div>

            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg mb-3">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                <strong>Calcul :</strong> Revenu - Total charges
                <br />
                = {revenuReference.toFixed(2)} € - {totalCharges.toFixed(2)} €
                <br />
                = {resteAVivre.toFixed(2)} €
              </p>
            </div>

            <p className={`text-sm ${
              isDeficit ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
            }`}>
              {isDeficit ? (
                <>
                  Le revenu de référence ne couvre pas les charges essentielles.
                  Il manque <strong>{Math.abs(resteAVivre).toFixed(2)} €</strong> chaque mois.
                </>
              ) : (
                <>
                  Après avoir couvert les charges essentielles, il reste{' '}
                  <strong>{resteAVivre.toFixed(2)} €</strong> pour les autres dépenses.
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* IEVR Cross-Reference */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          🔗 Lien avec l'IEVR
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Score IEVR de {territories[selectedTerritory].name}
            </div>
            <div className={`font-semibold ${ievrColor} dark:${ievrColor}`}>
              {ievrStatus}
            </div>
          </div>
          <div className={`text-4xl font-bold ${ievrColor} dark:${ievrColor}`}>
            {ievrScore}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Version {ievrRef.version} • Plus le score est bas, plus la vie est difficile
        </p>
      </Card>

      {/* Methodology */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📝 Méthodologie
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Total des charges :</strong> Somme de tous les postes de dépenses
          </p>
          <p>
            <strong>Reste à vivre :</strong> Revenu de référence - Total des charges
          </p>
          <p>
            <strong>Déficit :</strong> Si le résultat est négatif (Revenu {'<'} Charges)
          </p>
          <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
            {budgetRef.source} • Version {budgetRef.version}
          </p>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ Ces montants sont des estimations pédagogiques. Chaque situation est unique.
          Cet outil ne constitue pas un conseil financier.
        </p>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function ChargeItem({ label, amount }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">
        {amount.toFixed(2)} €
      </span>
    </div>
  );
}

export default BudgetReelMensuel;
