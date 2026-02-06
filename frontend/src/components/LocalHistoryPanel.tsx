// src/components/LocalHistoryPanel.tsx
// Local History Panel Component - displays recent consultations
import React from 'react'
import { GlassCard } from './ui/glass-card'
import { useLocalHistory, type HistoryItem, type HistoryItemType } from '../hooks/useLocalHistory'

/**
 * Get relative time text in French (institutional tone)
 */
function getRelativeTimeText(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return "à l'instant"
  } else if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`
  } else if (diffDays === 1) {
    return 'hier'
  } else {
    return `il y a ${diffDays} jours`
  }
}

/**
 * Get icon for history item type
 */
function getTypeIcon(type: HistoryItemType): string {
  switch (type) {
    case 'product':
      return '📦'
    case 'comparison':
      return '⚖️'
    case 'scan':
      return '📷'
    default:
      return '•'
  }
}

/**
 * Get French label for history item type
 */
function getTypeLabel(type: HistoryItemType): string {
  switch (type) {
    case 'product':
      return 'Produit'
    case 'comparison':
      return 'Comparaison'
    case 'scan':
      return 'Scan EAN'
    default:
      return 'Consultation'
  }
}

export default function LocalHistoryPanel() {
  const { history, clear } = useLocalHistory()

  // Check feature flag
  const isEnabled = import.meta.env.VITE_FEATURE_HISTORY === 'true'

  if (!isEnabled) {
    return null // Hide completely when disabled
  }

  return (
    <GlassCard title="Dernières consultations" className="mb-6">
      {/* Institutional disclaimer (fixed text) */}
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-200">
        <p>
          Cet historique est stocké uniquement sur votre appareil.
          Aucune donnée n'est transmise ou conservée à distance.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <div className="text-4xl mb-3">📋</div>
          <p>Aucune consultation récente</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 mb-4">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
              >
                <div className="text-2xl mt-0.5" aria-hidden="true">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.label}</div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-semibold">{getTypeLabel(item.type)}</span>
                    </span>

                    {item.territory && (
                      <>
                        <span>•</span>
                        <span>{item.territory}</span>
                      </>
                    )}

                    <span>•</span>
                    <span>{getRelativeTimeText(item.viewedAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={clear}
            className="w-full px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg transition-colors"
            aria-label="Effacer l'historique local"
          >
            Effacer l'historique
          </button>
        </>
      )}
    </GlassCard>
  )
}
