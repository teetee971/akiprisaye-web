import React from 'react'
import { GlassContainer } from '../components/ui/GlassContainer'

export function Compare() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <GlassContainer>
        <h1 className="text-3xl font-bold text-white mb-4">Comparateur de Prix</h1>
        <p className="text-gray-300">
          Comparez les prix entre territoires et produits
        </p>
      </GlassContainer>
    </div>
  )
}

export default Compare
