import React from 'react'
import { GlassContainer } from '../components/ui/GlassContainer'

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <GlassContainer>
        <h1 className="text-4xl font-bold text-white mb-4">A KI PRI SA YÉ</h1>
        <p className="text-gray-300 text-lg">
          Plateforme civique de transparence des prix en Outre-Mer
        </p>
      </GlassContainer>
    </div>
  )
}

export default Home
