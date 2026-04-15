 
/**
 * Nutritional Analysis Component
 * Intelligent nutritional analysis with Nutri-Score and health warnings
 */

import { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface NutritionalData {
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  energy: number; // kcal per 100g
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
  fiber?: number;
}

interface Additive {
  code: string;
  name: string;
  level: 'safe' | 'moderate' | 'risky';
  description: string;
}

interface NutritionalAnalysisProps {
  productName: string;
  nutritionalData: NutritionalData;
  additives?: Additive[];
  ingredients?: string[];
}

export function NutritionalAnalysis({ 
  nutritionalData, 
  additives = [],
  ingredients = []
}: NutritionalAnalysisProps) {
  const [expanded, setExpanded] = useState(false);

  const getNutriScoreColor = (score?: string): string => {
    const colors = {
      'A': 'bg-green-600',
      'B': 'bg-lime-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-600'
    };
    return score ? colors[score as keyof typeof colors] : 'bg-gray-400';
  };

  const getHealthWarnings = (): string[] => {
    const warnings: string[] = [];
    
    if (nutritionalData.sugars > 15) {
      warnings.push('Forte teneur en sucres');
    }
    if (nutritionalData.saturatedFat > 5) {
      warnings.push('Forte teneur en graisses saturées');
    }
    if (nutritionalData.salt > 1.5) {
      warnings.push('Forte teneur en sel');
    }
    
    const riskyAdditives = additives.filter(a => a.level === 'risky');
    if (riskyAdditives.length > 0) {
      warnings.push(`${riskyAdditives.length} additif(s) à risque`);
    }
    
    return warnings;
  };

  const warnings = getHealthWarnings();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
        Analyse Nutritionnelle
      </h3>

      {/* Nutri-Score */}
      {nutritionalData.nutriScore && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nutri-Score
            </span>
            <div className={`${getNutriScoreColor(nutritionalData.nutriScore)} text-white px-4 py-2 rounded-lg text-2xl font-bold`}>
              {nutritionalData.nutriScore}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {nutritionalData.nutriScore === 'A' || nutritionalData.nutriScore === 'B' 
              ? 'Bonne qualité nutritionnelle' 
              : 'Qualité nutritionnelle à améliorer'}
          </p>
        </div>
      )}

      {/* Health Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Points d'attention
              </h4>
              <ul className="space-y-1">
                {warnings.map((warning) => (
                  <li key={warning} className="text-sm text-orange-800 dark:text-orange-200">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Nutritional Values */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">
          Valeurs nutritionnelles (pour 100g)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400">Énergie</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {nutritionalData.energy} kcal
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400">Matières grasses</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {nutritionalData.fat}g
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400">Glucides</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {nutritionalData.carbohydrates}g
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400">Protéines</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {nutritionalData.protein}g
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400">Sucres</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {nutritionalData.sugars}g
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400">Sel</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {nutritionalData.salt}g
            </div>
          </div>
        </div>
      </div>

      {/* Additives Decoder */}
      {additives.length > 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="additives-list"
            aria-label={expanded ? `Masquer les ${additives.length} additifs` : `Afficher les ${additives.length} additifs`}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="font-semibold text-slate-900 dark:text-white">
              Additifs ({additives.length})
            </span>
            <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          </button>

          {expanded && (
            <div id="additives-list" className="mt-3 space-y-2">
              {additives.map((additive) => (
                <div 
                  key={additive.code}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  {additive.level === 'safe' && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  {additive.level === 'moderate' && (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  {additive.level === 'risky' && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {additive.code} - {additive.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {additive.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison with Similar Products */}
      <div className="text-center">
        <button type="button" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          Comparer avec des produits similaires
        </button>
      </div>
    </div>
  );
}
