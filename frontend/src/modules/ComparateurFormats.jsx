/**
 * ComparateurFormats Component
 *
 * Detects false bargains by comparing unit prices across different formats.
 * Uses produits_formats.json for data.
 *
 * Logic:
 * - Calculate unit price (€/kg or €/L) for each format
 * - Compare all formats
 * - Lowest unit price = real bargain
 * - If larger format has higher unit price = false bargain
 */

import { useState } from 'react';
import produitsData from '../data/produits_formats.json';
import { Card } from '../components/ui/card.jsx';
import DataSourceWarning from '../components/DataSourceWarning.jsx';

export function ComparateurFormats() {
  const [selectedProduct, setSelectedProduct] = useState(produitsData.produits[0].id);

  const produit = produitsData.produits.find((p) => p.id === selectedProduct);

  if (!produit) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">⚠️ Produit non trouvé</p>
      </div>
    );
  }

  // Calculate unit prices and enrich formats
  const formatsAvecPrixUnitaire = produit.formats.map((format) => {
    let quantite, unite, prixUnitaire;

    if ('poids_kg' in format) {
      quantite = format.poids_kg;
      unite = 'kg';
      prixUnitaire = format.prix / format.poids_kg;
    } else if ('volume_l' in format) {
      quantite = format.volume_l;
      unite = 'L';
      prixUnitaire = format.prix / format.volume_l;
    }

    return {
      ...format,
      quantite,
      unite,
      prixUnitaire,
    };
  });

  // Sort by unit price to find best and worst
  const formatsTries = [...formatsAvecPrixUnitaire].sort((a, b) => a.prixUnitaire - b.prixUnitaire);
  const meilleurFormat = formatsTries[0];
  const pireFormat = formatsTries[formatsTries.length - 1];

  return (
    <div className="space-y-6">
      {/* Critical Data Warning */}
      {produitsData.metadata.dataStatus !== 'OFFICIEL' && (
        <DataSourceWarning
          dataStatus={produitsData.metadata.dataStatus}
          requiredSources={produitsData.metadata.requiredSources}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🔍 Comparateur de Formats</h2>
        <p className="text-amber-50">
          Détectez les faux bons plans en comparant les prix au kilo ou au litre
        </p>
      </div>

      {/* Product Selection */}
      <Card className="p-6">
        <label
          htmlFor="product-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Sélectionner un produit
        </label>
        <select
          id="product-select"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
        >
          {produitsData.produits.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </Card>

      {/* Formats Comparison */}
      <div className="space-y-4">
        {formatsAvecPrixUnitaire.map((format, index) => {
          const isMeilleur = format.prixUnitaire === meilleurFormat.prixUnitaire;
          const isPire =
            format.prixUnitaire === pireFormat.prixUnitaire && formatsAvecPrixUnitaire.length > 1;
          const ecartPourcent =
            ((format.prixUnitaire - meilleurFormat.prixUnitaire) / meilleurFormat.prixUnitaire) *
            100;

          return (
            <Card
              key={format.label || format.poids}
              className={`p-6 border-2 ${
                isMeilleur
                  ? 'border-green-400 dark:border-green-600'
                  : isPire
                    ? 'border-red-400 dark:border-red-600'
                    : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Format {format.quantite} {format.unite}
                  </h3>
                </div>

                {/* Badge */}
                {isMeilleur && (
                  <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-green-800 dark:text-green-200">
                        Bon plan réel
                      </span>
                    </div>
                  </div>
                )}

                {isPire && !isMeilleur && (
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
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prix total</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format.prix.toFixed(2)} €
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 ${
                    isMeilleur
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : isPire
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Prix au {format.unite}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isMeilleur
                        ? 'text-green-600 dark:text-green-400'
                        : isPire
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {format.prixUnitaire.toFixed(2)} €
                  </div>
                </div>
              </div>

              {/* Calculation Formula */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  <strong>Calcul :</strong> Prix unitaire = Prix total ÷ Quantité
                  <br />= {format.prix.toFixed(2)} € ÷ {format.quantite} {format.unite}
                  <br />= {format.prixUnitaire.toFixed(2)} €/{format.unite}
                </p>
              </div>

              {/* Explanation */}
              {!isMeilleur && ecartPourcent > 0.01 && (
                <div
                  className={`p-4 rounded-lg ${
                    isPire
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isPire
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    📊 Ce format est <strong>{ecartPourcent.toFixed(1)}% plus cher</strong> au{' '}
                    {format.unite}
                    que le meilleur format.
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      isPire
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    Différence : +{(format.prixUnitaire - meilleurFormat.prixUnitaire).toFixed(2)}{' '}
                    €/{format.unite}
                  </p>
                </div>
              )}

              {isMeilleur && (
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
                Meilleur choix : Format {meilleurFormat.quantite} {meilleurFormat.unite}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Prix au {meilleurFormat.unite} : {meilleurFormat.prixUnitaire.toFixed(2)} € • Total
                : {meilleurFormat.prix.toFixed(2)} €
              </div>
            </div>
          </div>

          {formatsAvecPrixUnitaire.length > 1 &&
            meilleurFormat.prixUnitaire !== pireFormat.prixUnitaire && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    À éviter : Format {pireFormat.quantite} {pireFormat.unite}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Prix au {pireFormat.unite} : {pireFormat.prixUnitaire.toFixed(2)} € • Surcoût de{' '}
                    {(
                      ((pireFormat.prixUnitaire - meilleurFormat.prixUnitaire) /
                        meilleurFormat.prixUnitaire) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            )}

          {meilleurFormat.prixUnitaire === pireFormat.prixUnitaire && (
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Tous les formats ont le même prix au {meilleurFormat.unite}
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
            <strong>💡 Principe :</strong> Vérifiez toujours le prix au kilo ou au litre. Le format
            le plus gros n'est pas toujours le plus économique.
          </p>
        </div>
      </Card>

      {/* Methodology */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📝 Logique de calcul</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Étape 1 :</strong> Calculer le prix unitaire de chaque format
          </p>
          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-xs">
            Prix unitaire = Prix total ÷ Quantité
          </pre>
          <p>
            <strong>Étape 2 :</strong> Comparer tous les formats
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Le format avec le prix unitaire le plus bas = Bon plan réel ✅</li>
            <li>Le format avec le prix unitaire le plus élevé = Faux bon plan ⚠️</li>
          </ul>
          <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
            Version {produitsData.version}
          </p>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ Cette analyse est purement mathématique. Aucune enseigne n'est nommée. Les prix sont
          fournis à titre d'exemple pédagogique.
        </p>
      </div>
    </div>
  );
}

export default ComparateurFormats;
