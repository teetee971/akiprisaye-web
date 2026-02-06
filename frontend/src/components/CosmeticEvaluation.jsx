/**
 * Composant d'évaluation cosmétique
 * Basé uniquement sur des sources officielles (CosIng, ANSES, ECHA, Règlement CE 1223/2009)
 */

import { useState } from 'react';
import {
  evaluateProduct,
  getCategories,
  getRegulatoryReferences,
  getOfficialDatabases,
} from '../services/cosmeticEvaluationService';

export default function CosmeticEvaluation() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Crème visage');
  const [inciList, setInciList] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [showRegulations, setShowRegulations] = useState(false);

  const categories = getCategories();
  const regulations = getRegulatoryReferences();
  const databases = getOfficialDatabases();

  const handleEvaluate = (e) => {
    e.preventDefault();
    
    if (!productName.trim() || !inciList.trim()) {
      alert('Veuillez renseigner le nom du produit et la liste INCI');
      return;
    }

    const result = evaluateProduct(productName, category, inciList);
    setEvaluation(result);
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600 bg-green-50';
      case 'MODERATE':
        return 'text-yellow-600 bg-yellow-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'RESTRICTED':
        return 'text-red-600 bg-red-50';
      case 'PROHIBITED':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelLabel = (level) => {
    switch (level) {
      case 'LOW':
        return 'Risque faible';
      case 'MODERATE':
        return 'Risque modéré';
      case 'HIGH':
        return 'Attention requise';
      case 'RESTRICTED':
        return 'Restreint';
      case 'PROHIBITED':
        return 'Interdit/Très restreint';
      default:
        return 'Inconnu';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Acceptable';
    return 'À surveiller';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Évaluation Cosmétique
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Analyse transparente basée sur la liste INCI et les sources officielles
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <BookOpen className="w-4 h-4" />
            <span>Sources: CosIng • ANSES • ECHA • Règlement CE 1223/2009</span>
          </div>
        </div>

        {/* Formulaire d'évaluation */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleEvaluate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nom du produit
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Ma crème hydratante"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Liste INCI (ingrédients séparés par des virgules)
              </label>
              <textarea
                value={inciList}
                onChange={(e) => setInciList(e.target.value)}
                placeholder="Ex: AQUA, GLYCERIN, CETEARYL ALCOHOL, NIACINAMIDE, PANTHENOL, TOCOPHEROL"
                rows="5"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Copiez la liste d'ingrédients telle qu'elle apparaît sur l'emballage (nomenclature INCI)
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Analyser la composition
            </button>
          </form>
        </div>

        {/* Résultats de l'évaluation */}
        {evaluation && (
          <div className="space-y-6">
            {/* Score global */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Score d'évaluation
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-6xl font-bold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score}/100
                  </div>
                  <div className={`text-xl font-semibold mt-2 ${getScoreColor(evaluation.score)}`}>
                    {getScoreLabel(evaluation.score)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">{evaluation.scoreBreakdown.safeIngredients}</div>
                      <div className="text-slate-600 dark:text-slate-400">Sûrs</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-600 font-semibold">{evaluation.scoreBreakdown.moderateIngredients}</div>
                      <div className="text-slate-600 dark:text-slate-400">Modérés</div>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-600 font-semibold">{evaluation.scoreBreakdown.riskIngredients}</div>
                      <div className="text-slate-600 dark:text-slate-400">À surveiller</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-semibold">
                        {evaluation.scoreBreakdown.restrictedIngredients + evaluation.scoreBreakdown.prohibitedIngredients}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">Restreints</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissements */}
            {evaluation.warnings.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Avertissements
                </h2>
                <div className="space-y-3">
                  {evaluation.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        warning.level === 'error'
                          ? 'bg-red-50 border-red-500 dark:bg-red-900/20'
                          : warning.level === 'warning'
                          ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                          : 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {warning.level === 'error' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : warning.level === 'warning' ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{warning.message}</p>
                          {warning.ingredients && warning.ingredients.length > 0 && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              Ingrédients: {warning.ingredients.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des ingrédients */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Détail des ingrédients ({evaluation.product.ingredients.length})
              </h2>
              <div className="space-y-4">
                {evaluation.product.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {ingredient.inciName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskLevelColor(ingredient.riskLevel)}`}>
                            {getRiskLevelLabel(ingredient.riskLevel)}
                          </span>
                        </div>
                        
                        {ingredient.commonName && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {ingredient.commonName}
                          </p>
                        )}

                        {ingredient.function && ingredient.function.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {ingredient.function.map((func, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs"
                              >
                                {func}
                              </span>
                            ))}
                          </div>
                        )}

                        {(ingredient.casNumber || ingredient.einecs) && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {ingredient.casNumber && <span>CAS: {ingredient.casNumber}</span>}
                            {ingredient.casNumber && ingredient.einecs && <span className="mx-2">•</span>}
                            {ingredient.einecs && <span>EINECS: {ingredient.einecs}</span>}
                          </div>
                        )}

                        {ingredient.restrictions && (
                          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-3 border-yellow-500 rounded">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <strong>Restrictions:</strong> {ingredient.restrictions}
                            </p>
                          </div>
                        )}

                        {ingredient.regulatoryReferences && ingredient.regulatoryReferences.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Références réglementaires:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {ingredient.regulatoryReferences.map((ref, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                                >
                                  {ref}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {ingredient.sources && ingredient.sources.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                              Sources officielles:
                            </p>
                            <div className="space-y-1">
                              {ingredient.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {source.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources et références */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Sources officielles utilisées
                </h2>
                <svg
                  className={`w-6 h-6 transform transition-transform ${showSources ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showSources && (
                <div className="mt-4 space-y-3">
                  {Object.values(databases).map((db, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <a
                        href={db.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 group"
                      >
                        <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">
                            {db.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {db.description}
                          </p>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Références réglementaires */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowRegulations(!showRegulations)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Références réglementaires
                </h2>
                <svg
                  className={`w-6 h-6 transform transition-transform ${showRegulations ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showRegulations && (
                <div className="mt-4 space-y-3">
                  {Object.values(regulations).map((reg, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <a
                        href={reg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 group"
                      >
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">
                            {reg.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {reg.description}
                          </p>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                    Avertissement Important
                  </h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {evaluation.disclaimer}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
