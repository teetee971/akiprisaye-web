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
import budgetData from '../data/budget-vital.json';
import { getActiveTerritories } from '../constants/territories';

export function BudgetVital() {
  const [selectedProfile] = useState('adulte-seul');
  const [selectedTerritory] = useState('GP');
  const [selectedIncome] = useState('SMIC');

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

  // Get active territories with France for comparison
  const territories = [
    ...getActiveTerritories()
      .filter((t) => ['GP', 'MQ', 'GF', 'RE'].includes(t.code))
      .map((t) => ({ code: t.code, name: t.name, flag: t.flag })),
    { code: 'FR', name: 'France métropolitaine', flag: '🇫🇷' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Budget Vital</h2>
      <div className="bg-gray-50 border rounded p-4">
        <p>Budget: {budget.total}€</p>
        <p>Revenu référence: {referenceIncome}€</p>
        <p>{territories.length} territoires disponibles</p>
      </div>
    </div>
  );
}

export default BudgetVital;
