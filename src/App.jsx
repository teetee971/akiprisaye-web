import React from 'react';
import Comparateur from './pages/Comparateur';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        A KI PRI SA YÉ
      </h1>

      <p className="text-center text-gray-600 mb-4">
        Comparateur - version démo avec API Data.gouv
      </p>

      <Comparateur />
    </div>
  )
}

