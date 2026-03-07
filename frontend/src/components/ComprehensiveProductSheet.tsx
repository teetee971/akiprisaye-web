 
/**
 * Comprehensive Product Sheet Component - v1.0.0
 * 
 * Displays complete product information from photo analysis:
 * - Product identification
 * - Ingredients list
 * - Nutritional information
 * - Price trends
 * - Product insights
 * - Traceability
 * 
 * Conforme aux principes institutionnels
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, AlertCircle, CheckCircle } from 'lucide-react';
import type { ProductSheet } from '../services/productPhotoAnalysisService';

interface ComprehensiveProductSheetProps {
  productSheet: ProductSheet;
  onClose?: () => void;
  confidenceScore: number;
  ocrQuality: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
}

export default function ComprehensiveProductSheet({
  productSheet,
  onClose,
  confidenceScore,
  ocrQuality,
  warnings,
}: ComprehensiveProductSheetProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'ingredients' | 'nutrition' | 'price'>('info');

  // Quality indicator colors
  const qualityColor = 
    ocrQuality === 'excellent' ? 'text-green-600 bg-green-100' :
    ocrQuality === 'good' ? 'text-blue-600 bg-blue-100' :
    ocrQuality === 'fair' ? 'text-yellow-600 bg-yellow-100' :
    'text-red-600 bg-red-100';

  const confidenceColor = 
    confidenceScore >= 80 ? 'text-green-600' :
    confidenceScore >= 60 ? 'text-yellow-600' :
    'text-red-600';

  const trendIcon = productSheet.price?.trend === 'rising' ? (
    <TrendingUp className="w-5 h-5 text-red-500" />
  ) : productSheet.price?.trend === 'falling' ? (
    <TrendingDown className="w-5 h-5 text-green-500" />
  ) : (
    <Minus className="w-5 h-5 text-gray-500" />
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{productSheet.name}</h1>
                {productSheet.brand && (
                  <p className="text-blue-100 text-sm mb-3">Marque: {productSheet.brand}</p>
                )}
                {productSheet.ean && (
                  <p className="text-blue-100 text-xs font-mono">EAN: {productSheet.ean}</p>
                )}
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  aria-label="Fermer"
                >
                  <span className="text-2xl leading-none">×</span>
                </button>
              )}
            </div>

            {/* Quality indicators */}
            <div className="mt-4 flex gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${qualityColor}`}>
                Qualité OCR: {ocrQuality}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 ${confidenceColor}`}>
                Confiance: {confidenceScore}%
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
                Source: {productSheet.traceability.source}
              </span>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                    ⚠️ Limites de l'analyse
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-2 px-6" role="tablist">
              {[
                { id: 'info', label: '📋 Informations', icon: '📋' },
                { id: 'ingredients', label: '🧪 Ingrédients', icon: '🧪' },
                { id: 'nutrition', label: '🥗 Nutrition', icon: '🥗' },
                { id: 'price', label: '💰 Prix', icon: '💰' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Informations tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Product image */}
                {productSheet.imageUrl && (
                  <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={productSheet.imageUrl}
                      alt={productSheet.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Product insights */}
                {productSheet.insights && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {productSheet.insights.processing && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Niveau de transformation
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {productSheet.insights.processing}
                        </p>
                      </div>
                    )}

                    {productSheet.insights.origin && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          🌍 Origine
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {productSheet.insights.origin}
                        </p>
                      </div>
                    )}

                    {productSheet.insights.labels && productSheet.insights.labels.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg md:col-span-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          🏷️ Labels et certifications
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {productSheet.insights.labels.map((label, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Traceability */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                    🔍 Traçabilité des données
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Source:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {productSheet.traceability.source}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Territoire:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {productSheet.traceability.territory}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Dernière MAJ:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {new Date(productSheet.traceability.lastUpdate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Qualité:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400 capitalize">
                        {productSheet.traceability.dataQuality}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients tab */}
            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                {productSheet.ingredients.list.length > 0 ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Liste des ingrédients
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {productSheet.ingredients.list.map((ingredient, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>

                    {productSheet.ingredients.rawText && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                          Texte brut extrait:
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                          {productSheet.ingredients.rawText}
                        </p>
                      </div>
                    )}

                    {productSheet.ingredients.additives.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          ⚠️ Additifs détectés
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {productSheet.ingredients.additives.map((additive, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-lg text-sm"
                            >
                              {additive}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {productSheet.ingredients.allergens.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          🚨 Allergènes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {productSheet.ingredients.allergens.map((allergen, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm font-medium"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun ingrédient détecté dans l'analyse</p>
                    <p className="text-sm mt-1">Vérifiez la qualité de la photo</p>
                  </div>
                )}
              </div>
            )}

            {/* Nutrition tab */}
            {activeTab === 'nutrition' && (
              <div className="space-y-4">
                {productSheet.nutrition ? (
                  <>
                    {/* Nutritional scores */}
                    {productSheet.nutrition.scores && (
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {productSheet.nutrition.scores.nutriScore && (
                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                              {productSheet.nutrition.scores.nutriScore}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Nutri-Score
                            </div>
                          </div>
                        )}
                        {productSheet.nutrition.scores.novaGroup && (
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                              {productSheet.nutrition.scores.novaGroup}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Groupe NOVA
                            </div>
                          </div>
                        )}
                        {productSheet.nutrition.scores.ecoScore && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                              {productSheet.nutrition.scores.ecoScore}
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              Eco-Score
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nutritional table */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Valeurs nutritionnelles (pour 100g/ml)
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {productSheet.nutrition.per100g.energyKcal !== undefined && (
                              <tr>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  Énergie
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.energyKcal} kcal
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.fat !== undefined && (
                              <tr>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  Matières grasses
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.fat} g
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.saturatedFat !== undefined && (
                              <tr>
                                <td className="px-4 py-3 pl-8 text-gray-700 dark:text-gray-400">
                                  dont saturés
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.saturatedFat} g
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.carbohydrates !== undefined && (
                              <tr>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  Glucides
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.carbohydrates} g
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.sugars !== undefined && (
                              <tr>
                                <td className="px-4 py-3 pl-8 text-gray-700 dark:text-gray-400">
                                  dont sucres
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.sugars} g
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.fiber !== undefined && (
                              <tr>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  Fibres
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.fiber} g
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.proteins !== undefined && (
                              <tr>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  Protéines
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.proteins} g
                                </td>
                              </tr>
                            )}
                            {productSheet.nutrition.per100g.salt !== undefined && (
                              <tr>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                  Sel
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                  {productSheet.nutrition.per100g.salt} g
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Informations nutritionnelles non disponibles</p>
                    <p className="text-sm mt-1">Données non détectées dans l'analyse</p>
                  </div>
                )}
              </div>
            )}

            {/* Price tab */}
            {activeTab === 'price' && (
              <div className="space-y-4">
                {productSheet.price ? (
                  <>
                    {/* Current price */}
                    {productSheet.price.current && (
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Prix actuel
                            </h3>
                            <div className="text-4xl font-bold text-gray-900 dark:text-white">
                              {productSheet.price.current.toFixed(2)} €
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {trendIcon}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {productSheet.price.trend}
                            </span>
                          </div>
                        </div>
                        {productSheet.price.averagePrice && (
                          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            Prix moyen: {productSheet.price.averagePrice.toFixed(2)} €
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price history */}
                    {productSheet.price.history.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          📈 Historique des prix
                        </h3>
                        <div className="space-y-2">
                          {productSheet.price.history.map((entry, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {entry.price.toFixed(2)} €
                                </div>
                                {entry.store && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {entry.store}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(entry.date).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Informations de prix non disponibles</p>
                    <p className="text-sm mt-1">Prix non détecté dans l'analyse</p>
                  </div>
                )}

                {/* Institutional disclaimer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-semibold mb-1">ℹ️ Information importante</p>
                      <p>
                        Les prix affichés sont issus d'observations citoyennes et ont un caractère
                        strictement informatif et non contractuel. Ce service est un outil d'information
                        publique, pas une valeur de référence commerciale.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  // Export functionality could be added here
                  alert('Fonctionnalité d\'export à venir');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                📥 Exporter la fiche
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
