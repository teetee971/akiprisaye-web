/**
 * BudgetVital Page
 *
 * Affiche le budget minimum vital mensuel par profil et territoire DOM.
 * Utilise budget-vital.json avec les postes alimentation, hygiène,
 * transport, énergie et autres charges incompressibles.
 * Comparaison avec les revenus de référence (SMIC / RSA).
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import DataSourceWarning from '../components/DataSourceWarning';
import budgetData from '../data/budget-vital.json';

const TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'FR', name: 'France métropolitaine', flag: '🇫🇷' },
];

const PROFILES = [
  { key: 'adulte-seul', label: 'Adulte seul', icon: '👤' },
  { key: 'couple', label: 'Couple', icon: '👥' },
  { key: 'famille', label: 'Famille (2 adultes + 2 enfants)', icon: '👨‍👩‍👧‍👦' },
  { key: 'senior', label: 'Senior', icon: '👴' },
];

const INCOME_TYPES = [
  { key: 'SMIC', label: 'SMIC net mensuel' },
  { key: 'RSA', label: 'RSA mensuel' },
];

const BUDGET_LINES = [
  { key: 'alimentation', label: '🛒 Alimentation' },
  { key: 'hygiene', label: '🧴 Hygiène & soins' },
  { key: 'transport', label: '🚌 Transport' },
  { key: 'energie', label: '⚡ Énergie & eau' },
  { key: 'autres', label: '📦 Autres charges' },
];

export default function BudgetVitalPage() {
  const [territory, setTerritory] = useState('GP');
  const [profile, setProfile] = useState('adulte-seul');
  const [incomeType, setIncomeType] = useState('SMIC');

  const budget = budgetData.budgets[territory]?.[profile];
  const incomeRef = budgetData.referenceIncomes[territory]?.[incomeType] ?? 0;
  const total = budget?.total ?? 0;
  const resteAVivre = incomeRef - total;
  const isDeficit = resteAVivre < 0;
  const coveragePercent = incomeRef > 0 ? ((total / incomeRef) * 100).toFixed(1) : '—';

  const selectedTerritory = TERRITORIES.find((t) => t.code === territory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Helmet>
        <title>Budget vital DOM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Calculez le budget minimum vital mensuel pour les territoires DOM — Guadeloupe, Martinique, Guyane, La Réunion. Comparaison SMIC / RSA."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/budget-vital" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/budget-vital"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/budget-vital"
        />
      </Helmet>

      <HeroImage
        src={PAGE_HERO_IMAGES.budgetVital}
        alt="Budget vital DOM"
        gradient="from-slate-950 to-blue-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          🏠 Budget vital DOM
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Le minimum vital budgétaire dans votre territoire
        </p>
      </HeroImage>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Data warning */}
        {budgetData.metadata.dataStatus !== 'OFFICIEL' && (
          <DataSourceWarning
            dataStatus={budgetData.metadata.dataStatus}
            requiredSources={budgetData.metadata.requiredSources}
          />
        )}

        {/* Profile selection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            📋 Votre situation
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {PROFILES.map((p) => (
              <button
                key={p.key}
                onClick={() => setProfile(p.key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  profile === p.key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-3xl">{p.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Territory selection */}
          <div className="mt-4">
            <label
              htmlFor="territory-select"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Territoire
            </label>
            <select
              id="territory-select"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {TERRITORIES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Income reference selection */}
          <div className="mt-4 flex gap-3">
            {INCOME_TYPES.map((it) => (
              <button
                key={it.key}
                onClick={() => setIncomeType(it.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  incomeType === it.key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>

        {/* Income reference card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800 flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Revenu de référence ({incomeType}) — {selectedTerritory?.flag}{' '}
              {selectedTerritory?.name}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
              {budgetData.referenceIncomes[territory]?.description}
            </p>
          </div>
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap ml-4">
            {incomeRef.toFixed(2)} €
          </span>
        </div>

        {/* Budget breakdown */}
        {budget ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              📊 Charges mensuelles incompressibles
            </h2>
            <div className="space-y-3 mb-6">
              {BUDGET_LINES.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {budget[key]?.toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                TOTAL DES CHARGES
              </span>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {total.toFixed(2)} €
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Représente {coveragePercent}% du revenu de référence ({incomeType})
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-2xl p-5">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Données non disponibles pour cette combinaison.
            </p>
          </div>
        )}

        {/* Result card */}
        {budget && (
          <div
            className={`rounded-2xl p-6 border-2 ${
              isDeficit
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-5xl">{isDeficit ? '⚠️' : '✅'}</span>
              <div className="flex-1">
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    isDeficit
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-green-800 dark:text-green-200'
                  }`}
                >
                  {isDeficit ? 'Déficit mensuel' : 'Reste à vivre'}
                </h3>
                <div
                  className={`text-4xl font-bold mb-3 ${
                    isDeficit
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {Math.abs(resteAVivre).toFixed(2)} €
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mb-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                  <strong>Calcul :</strong> {incomeRef.toFixed(2)} € − {total.toFixed(2)} € ={' '}
                  {resteAVivre.toFixed(2)} €
                </div>
                <p
                  className={`text-sm ${isDeficit ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}
                >
                  {isDeficit ? (
                    <>
                      Le revenu de référence ne couvre pas les charges essentielles. Il manque{' '}
                      <strong>{Math.abs(resteAVivre).toFixed(2)} €</strong> par mois.
                    </>
                  ) : (
                    <>
                      Après les charges essentielles, il reste{' '}
                      <strong>{resteAVivre.toFixed(2)} €</strong> pour les autres dépenses.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Methodology */}
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📝 Méthodologie</h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>
              Les charges incluent alimentation, hygiène, transport, énergie/eau et autres coûts
              incompressibles.
            </li>
            <li>Le reste à vivre = Revenu de référence − Total des charges.</li>
            <li>
              Un résultat négatif indique un déficit structurel pour ce profil dans ce territoire.
            </li>
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
            {budgetData.metadata.source} • Version {budgetData.metadata.version} •{' '}
            {budgetData.metadata.lastUpdate}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Ces montants sont des estimations pédagogiques basées sur des données publiques.
            Chaque situation personnelle est unique. Cet outil ne constitue pas un conseil
            financier.
          </p>
        </div>
      </div>
    </div>
  );
}
