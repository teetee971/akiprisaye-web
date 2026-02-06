// src/components/PredictionBadge.tsx
import React, { useState } from 'react'
import type { PredictionScore } from '../services/predictivePricingService'

type PredictionBadgeProps = {
  prediction: PredictionScore
  showTooltip?: boolean
}

export default function PredictionBadge({ prediction, showTooltip = true }: PredictionBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const getStatusConfig = (status: PredictionScore['status']) => {
    switch (status) {
      case 'baisse_probable':
        return {
          label: 'Baisse probable',
          bgColor: 'bg-green-600',
          textColor: 'text-white',
          icon: '📉',
        }
      case 'surveillance':
        return {
          label: 'Surveillance',
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          icon: '👁️',
        }
      case 'stable':
        return {
          label: 'Stable',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          icon: '➡️',
        }
    }
  }

  const config = getStatusConfig(prediction.status)

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} cursor-help`}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        tabIndex={0}
        aria-label={`${config.label} - Probabilité: ${prediction.probability}%`}
      >
        <span aria-hidden="true">{config.icon}</span>
        {config.label}
        <span className="ml-1 text-[10px] opacity-80">
          {prediction.probability}%
        </span>
      </span>

      {showTooltip && tooltipVisible && (
        <div
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg border border-gray-700"
          role="tooltip"
        >
          <div className="mb-2 font-semibold">
            Prédiction IA ({prediction.confidence === 'high' ? 'Confiance élevée' : prediction.confidence === 'medium' ? 'Confiance moyenne' : 'Confiance faible'})
          </div>
          
          <p className="mb-2 text-gray-300">{prediction.justification}</p>
          
          {prediction.estimatedTimeframe && (
            <p className="mb-2 text-blue-300">
              Fenêtre estimée: {prediction.estimatedTimeframe}
            </p>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
            <div>Tendance: {prediction.metrics.trend.toFixed(2)}%/j</div>
            <div>Volatilité: {prediction.metrics.volatility.toFixed(1)}%</div>
            <div>Accélération: {prediction.metrics.acceleration.toFixed(2)}</div>
          </div>

          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
