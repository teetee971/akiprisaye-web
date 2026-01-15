// src/components/ScanResultCard.tsx
import React from 'react'
import type { PublicProduct } from '../services/eanPublicCatalog'

type ScanResultCardProps = {
  product: PublicProduct
}

export default function ScanResultCard({ product }: ScanResultCardProps) {
  const uniqueStores = new Set(product.observedPrices?.map((p) => p.store) || [])
  const latestPrice = product.observedPrices?.[product.observedPrices.length - 1]

  return (
    <div className="bg-white/[0.08] backdrop-blur-[14px] border border-white/[0.22] rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-300">
            {product.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-white/50 mb-1">EAN</div>
          <div className="text-white font-mono">{product.ean}</div>
        </div>

        <div>
          <div className="text-white/50 mb-1">Territoires observés</div>
          <div className="text-white">{product.territories.join(', ')}</div>
        </div>

        <div>
          <div className="text-white/50 mb-1">Enseignes connues</div>
          <div className="text-white">{uniqueStores.size} enseigne(s)</div>
        </div>

        {product.lastUpdate && (
          <div>
            <div className="text-white/50 mb-1">Dernière observation</div>
            <div className="text-white">
              {new Date(product.lastUpdate).toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}
      </div>

      {latestPrice && (
        <div className="pt-4 border-t border-white/[0.12]">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{latestPrice.price.toFixed(2)} €</span>
            <span className="text-sm text-white/60">
              chez {latestPrice.store} ({latestPrice.territory})
            </span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            Observé le {new Date(latestPrice.date).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )}
    </div>
  )
}
