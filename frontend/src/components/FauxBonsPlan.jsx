 
/**
 * FauxBonsPlan Component
 * 
 * Detects false bargains by comparing unit prices (€/kg or €/L) across
 * different formats of the same product.
 * 
 * Features:
 * - Pure mathematical comparison
 * - Visual badges (Real bargain / False bargain)
 * - Simple explanations
 * - No brand names, no accusations
 */

import { useState } from 'react';
import productsData from '../data/faux-bons-plans.json';
import { Card } from './ui/card.jsx';
import DataSourceWarning from './DataSourceWarning.jsx';

export function FauxBonsPlan() {
  const [selectedProduct, setSelectedProduct] = useState(productsData.products[0].id);

  const product = productsData.products.find(p => p.id === selectedProduct);

  if (!product) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          ⚠️ Produit non trouvé
        </p>
      </div>
    );
  }

  // Find best and worst unit prices
  const sortedFormats = [...product.formats].sort((a, b) => a.unitPrice - b.unitPrice);
  const bestFormat = sortedFormats[0];
  const worstFormat = sortedFormats[sortedFormats.length - 1];

  return (
    <div className="space-y-6">
      {/* Data Source Warning */}
      {productsData.metadata.dataStatus !== 'OFFICIEL' && (
        <DataSourceWarning 
          dataStatus={productsData.metadata.dataStatus}
          requiredSources={productsData.metadata.requiredSources}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          🔍 Détection Faux Bons Plans
        </h2>
        <p className="text-amber-50">
          Comparez les prix réels au kilo ou au litre
        </p>
      </div>

      {/* Product Selection */}
      <Card className="p-6">
        <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sélectionner un produit
        </label>
        <select
          id="product-select"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
        >
          {productsData.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category})
            </option>
          ))}
        </select>
      </Card>

      {/* Format Comparison */}
      <div className="space-y-4">
        {product.formats.map((format, index) => {
          const isBest = format.unitPrice === bestFormat.unitPrice;
          const isWorst = format.unitPrice === worstFormat.unitPrice && product.formats.length > 1;
          const savingsVsBest = ((format.unitPrice - bestFormat.unitPrice) / bestFormat.unitPrice * 100);
          
          return (
            <Card 
              key={index}
              className={`p-6 border-2 ${
                isBest 
                  ? 'border-green-400 dark:border-green-600' 
                  : isWorst
                    ? 'border-red-400 dark:border-red-600'
                    : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {format.label}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Quantité : {format.quantity} {product.unit}
                  </div>
                </div>

                {/* Badge */}
                {isBest && (
                  <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-green-800 dark:text-green-200">
                        Bon plan réel
                      </span>
                    </div>
                  </div>
                )}
                
                {isWorst && !isBest && (
                  <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <span className="font-bold text-red-800 dark:text-red-200">
                        Faux bon plan
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Prix total
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format.price.toFixed(2)} €
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${
                  isBest 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : isWorst
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                }`}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Prix au {product.unit}
                  </div>
                  <div className={`text-2xl font-bold ${
                    isBest 
                      ? 'text-green-600 dark:text-green-400' 
                      : isWorst
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    {format.unitPrice.toFixed(2)} €
                  </div>
                </div>
              </div>

              {/* Explanation */}
              {!isBest && savingsVsBest > 0.01 && (
                <div className={`p-4 rounded-lg ${
                  isWorst
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                }`}>
                  <p className={`text-sm font-medium ${
                    isWorst
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    📊 Ce format est <strong>{savingsVsBest.toFixed(1)}% plus cher</strong> au {product.unit} 
                    que le meilleur format disponible.
                  </p>
                  <p className={`text-xs mt-2 ${
                    isWorst
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    Différence : +{(format.unitPrice - bestFormat.unitPrice).toFixed(2)} €/{product.unit}
                  </p>
                </div>
              )}

              {isBest && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    🎯 C'est le meilleur rapport qualité-prix parmi les formats disponibles.
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📊 Résumé de l'analyse
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                Meilleur choix : {bestFormat.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Prix au {product.unit} : {bestFormat.unitPrice.toFixed(2)} € • Total : {bestFormat.price.toFixed(2)} €
              </div>
            </div>
          </div>

          {product.formats.length > 1 && bestFormat.unitPrice !== worstFormat.unitPrice && (
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  À éviter : {worstFormat.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Prix au {product.unit} : {worstFormat.unitPrice.toFixed(2)} € • 
                  Surcoût de {((worstFormat.unitPrice - bestFormat.unitPrice) / bestFormat.unitPrice * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {bestFormat.unitPrice === worstFormat.unitPrice && (
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Tous les formats ont le même prix au {product.unit}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Choisissez selon votre besoin de quantité
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>💡 Astuce :</strong> Vérifiez toujours le prix au kilo ou au litre pour détecter 
            les faux bons plans. Le format le plus gros n'est pas toujours le plus économique.
          </p>
        </div>
      </Card>

      {/* Methodology */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📝 Méthodologie de détection
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Calcul du prix unitaire :</strong>
          </p>
          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-xs overflow-x-auto">
            Prix unitaire = Prix total ÷ Quantité
          </pre>
          <p>
            <strong>Détection :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Format avec le prix unitaire le plus bas = <span className="text-green-600 font-semibold">Bon plan réel</span></li>
            <li>Format avec le prix unitaire le plus élevé = <span className="text-red-600 font-semibold">Faux bon plan</span></li>
          </ul>
          <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
            Version {productsData.metadata.version} • Dernière mise à jour : {productsData.metadata.lastUpdate}
          </p>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ Cette analyse est purement mathématique et ne constitue ni une accusation ni une recommandation d'achat.
          Les prix sont fournis à titre d'exemple. Aucune enseigne n'est nommée.
        </p>
      </div>
    </div>
  );
}

export default FauxBonsPlan;
