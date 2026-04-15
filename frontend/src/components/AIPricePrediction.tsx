import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface PricePrediction {
  trend: 'hausse' | 'baisse' | 'stable';
  percentageMin: number;
  percentageMax: number;
  period: number; // in days
  basedOn: string[];
}

interface AIPricePredictionProps {
  productName: string;
  prediction: PricePrediction;
  className?: string;
}

const HYPOTHESES = [
  'Tendance saisonnière historique 3 ans',
  'Impact inflation mondiale +2.8%/an',
  'Données douanes IEDOM disponibles',
  'Indice CPI DOM/INSEE intégré',
];

const MODEL_LIMITS = [
  'Ne tient pas compte des ruptures d\'approvisionnement',
  'Précision réduite au-delà de 60 jours',
  'Données limitées pour certains territoires',
];

export default function AIPricePrediction({ 
  productName, 
  prediction, 
  className 
}: AIPricePredictionProps) {
  const [showHypotheses, setShowHypotheses] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  const getTrendIcon = () => {
    if (prediction.trend === 'hausse') {
      return <TrendingUp className='w-5 h-5 text-rose-400' />;
    } else if (prediction.trend === 'baisse') {
      return <TrendingDown className='w-5 h-5 text-emerald-400' />;
    } else if (prediction.trend === 'stable') {
      return <Minus className='w-5 h-5 text-gray-400' />;
    }
    return null;
  };

  const getTrendText = () => {
    if (prediction.trend === 'hausse') {
      return `Tendance probable : hausse modérée (+${prediction.percentageMin} à +${prediction.percentageMax}%)`;
    } else if (prediction.trend === 'baisse') {
      return `Tendance probable : baisse modérée (-${prediction.percentageMin} à -${prediction.percentageMax}%)`;
    }
    return 'Tendance probable : prix stable';
  };

  const getTrendColor = () => {
    if (prediction.trend === 'hausse') return 'text-rose-300';
    if (prediction.trend === 'baisse') return 'text-emerald-300';
    return 'text-gray-300';
  };

  // Confidence band color
  const spread = prediction.percentageMax - prediction.percentageMin;
  const bandColor = spread < 5
    ? 'bg-emerald-500'
    : spread <= 15
    ? 'bg-yellow-400'
    : 'bg-rose-500';
  const bandLabel = spread < 5
    ? 'text-emerald-300'
    : spread <= 15
    ? 'text-yellow-300'
    : 'text-rose-300';

  const icon = getTrendIcon();

  return (
    <div className={`bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 ${className || ''}`}>
      <h3 className='text-sm font-medium text-gray-200 mb-3'>
        Indicateur de tendance (non décisionnel) : {productName}
      </h3>

      <div className='space-y-3'>
        {/* Disclaimer BEFORE the indicator */}
        <div className='bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 flex items-start gap-2'>
          <AlertCircle className='w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0' />
          <div className='text-xs text-amber-200/90 leading-relaxed'>
            <p className='font-medium mb-1'>⚠️ Aucune recommandation d'achat – usage informatif uniquement</p>
            <p className='text-amber-300/70'>
              Ce n'est pas une certitude, mais une projection factuelle basée sur l'analyse de données publiques historiques. 
              Les prix réels peuvent varier selon de multiples facteurs.
            </p>
          </div>
        </div>

        {/* Indicator */}
        <div className='flex items-start gap-3'>
          {icon}
          <div className='flex-1'>
            <p className={`text-base font-semibold ${getTrendColor()}`}>
              {getTrendText()} sur {prediction.period} jours
            </p>
          </div>
        </div>

        {/* Confidence band */}
        <div className='bg-slate-800/60 rounded-lg p-3 border border-slate-700/30'>
          <p className='text-xs text-gray-400 mb-2 font-medium'>Intervalle de confiance (70%) :</p>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs text-gray-400 w-8'>{prediction.percentageMin}%</span>
            <div className='flex-1 bg-slate-700 rounded-full h-3 overflow-hidden'>
              <div className={`h-full rounded-full ${bandColor}`} style={{ width: '70%' }} />
            </div>
            <span className='text-xs text-gray-400 w-8 text-right'>{prediction.percentageMax}%</span>
          </div>
          <p className={`text-xs font-semibold ${bandLabel}`}>
            Fourchette : +{prediction.percentageMin}% à +{prediction.percentageMax}%
            {spread < 5 ? ' — Confiance élevée' : spread <= 15 ? ' — Confiance modérée' : ' — Confiance faible'}
          </p>
        </div>

        <div className='bg-slate-800/40 rounded-lg p-3 border border-slate-700/30'>
          <p className='text-xs text-gray-400 mb-2 font-medium'>Basé sur données publiques :</p>
          <ul className='text-xs text-gray-300 space-y-1'>
            {prediction.basedOn.map((source) => (
              <li key={source} className='flex items-center gap-2'>
                <span className='w-1 h-1 rounded-full bg-blue-400'></span>
                {source}
              </li>
            ))}
          </ul>
        </div>

        {/* Hypothèses */}
        <div className='border border-slate-700/40 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => setShowHypotheses((v) => !v)}
            className='w-full flex items-center justify-between px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-xs text-gray-300 font-medium'
          >
            <span>📐 Hypothèses du modèle</span>
            {showHypotheses ? <ChevronUp className='w-3.5 h-3.5' /> : <ChevronDown className='w-3.5 h-3.5' />}
          </button>
          {showHypotheses && (
            <ul className='p-3 space-y-1'>
              {HYPOTHESES.map((h) => (
                <li key={h} className='flex items-start gap-2 text-xs text-gray-400'>
                  <span className='w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0'></span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Limites */}
        <div className='border border-slate-700/40 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => setShowLimits((v) => !v)}
            className='w-full flex items-center justify-between px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-xs text-gray-300 font-medium'
          >
            <span>⚠️ Limites connues</span>
            {showLimits ? <ChevronUp className='w-3.5 h-3.5' /> : <ChevronDown className='w-3.5 h-3.5' />}
          </button>
          {showLimits && (
            <ul className='p-3 space-y-1'>
              {MODEL_LIMITS.map((l) => (
                <li key={l} className='flex items-start gap-2 text-xs text-amber-300/80'>
                  <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0'></span>
                  {l}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className='text-[10px] text-gray-500 mt-3 italic'>
        ℹ️ Projection réalisée à partir de sources publiques officielles uniquement.
      </p>
    </div>
  );
}

