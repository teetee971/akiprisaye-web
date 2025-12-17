/**
 * BudgetVital Component
 * 
 * Calculates and displays the minimum vital monthly budget based on:
 * - User profile (single adult, couple, family, senior)
 * - Territory
 * 
 * Compares budget with reference incomes (SMIC, RSA) and shows
 * either deficit or money left to live.
 */

import { useState } from 'react';
import { Card } from './card.jsx';
import budgetData from '../data/budget-vital.json';

export function BudgetVital() {
  const [selectedProfile, setSelectedProfile] = useState('adulte-seul');
  const [selectedTerritory, setSelectedTerritory] = useState('GP');
  const [selectedIncome, setSelectedIncome] = useState('SMIC');

  const profile = budgetData.profiles[selectedProfile];
  const budget = budgetData.budgets[selectedTerritory]?.[selectedProfile];
  const referenceIncome = budgetData.referenceIncomes[selectedTerritory]?.[selectedIncome];

  if (!budget || !referenceIncome) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          ⚠️ Données non disponibles pour cette combinaison
        </p>
      </div>
    );
  }

  // Calculate deficit or surplus
  const difference = referenceIncome - budget.total;
  const isDeficit = difference < 0;
  const percentOfIncome = ((budget.total / referenceIncome) * 100).toFixed(1);

  const territories = [
    { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
    { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
    { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
    { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
    { code: 'FR', name: 'France métropolitaine', flag: '🇫🇷' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          💰 Budget Réel Mensuel
        </h2>
        <p className="text-green-50">
          Calculez le budget minimum vital selon votre situation
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
              {Object.entries(budgetData.profiles).map(([key, p]) => (
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
              {territories.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Income Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Revenu de référence
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIncome('SMIC')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedIncome === 'SMIC'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">SMIC net</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {budgetData.referenceIncomes[selectedTerritory].SMIC.toFixed(2)} €
                </div>
              </button>
              <button
                onClick={() => setSelectedIncome('RSA')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedIncome === 'RSA'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">RSA</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {budgetData.referenceIncomes[selectedTerritory].RSA.toFixed(2)} €
                </div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Budget Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Budget minimum vital mensuel
        </h3>

        <div className="space-y-3 mb-6">
          <BudgetLine label="Alimentation" amount={budget.alimentation} />
          <BudgetLine label="Hygiène" amount={budget.hygiene} />
          <BudgetLine label="Transport" amount={budget.transport} />
          <BudgetLine label="Énergie / Eau" amount={budget.energie} />
          <BudgetLine label="Autres coûts incompressibles" amount={budget.autres} />
        </div>

        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              TOTAL MENSUEL
            </span>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              {budget.total.toFixed(2)} €
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Représente {percentOfIncome}% du {selectedIncome} mensuel
          </p>
        </div>
      </Card>

      {/* Result Analysis */}
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
              {Math.abs(difference).toFixed(2)} €
            </div>

            <p className={`text-sm ${
              isDeficit ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
            }`}>
              {isDeficit ? (
                <>
                  Avec un {selectedIncome} mensuel de {referenceIncome.toFixed(2)} € et un budget vital de {budget.total.toFixed(2)} €,
                  le déficit mensuel est de {Math.abs(difference).toFixed(2)} €.
                  <br /><br />
                  <strong>Cela signifie que le revenu de référence ne couvre pas les besoins essentiels.</strong>
                </>
              ) : (
                <>
                  Avec un {selectedIncome} mensuel de {referenceIncome.toFixed(2)} € et un budget vital de {budget.total.toFixed(2)} €,
                  il reste {difference.toFixed(2)} € pour les autres dépenses.
                  <br /><br />
                  <strong>Ce montant représente ce qui reste après avoir couvert les besoins essentiels.</strong>
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Methodology Note */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📝 Méthodologie de calcul
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Budget vital :</strong> Somme des dépenses mensuelles incompressibles
            (alimentation, hygiène, transport, énergie, autres coûts essentiels)
          </p>
          <p>
            <strong>Déficit :</strong> Revenu - Budget vital {'<'} 0
            <br />
            <strong>Reste à vivre :</strong> Revenu - Budget vital ≥ 0
          </p>
          <p>
            <strong>Sources :</strong> Estimation basée sur données publiques et catégories IEVR
          </p>
          <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
            Version {budgetData.metadata.version} • Dernière mise à jour : {budgetData.metadata.lastUpdate}
          </p>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ Ces montants sont des estimations à titre indicatif. Chaque situation est unique et peut
          nécessiter un budget différent. Cet outil ne constitue pas un conseil financier.
        </p>
      </div>
    </div>
  );
}

function BudgetLine({ label, amount }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">
        {amount.toFixed(2)} €
      </span>
    </div>
  );
}

export default BudgetVital;
