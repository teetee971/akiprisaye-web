import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function App(){
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold">A KI PRI SA YÉ</h1>
        <p className="opacity-70">App prête 🚀 (React + Tailwind + Vite)</p>
      </div>
    </main>
  )
}
createRoot(document.getElementById('root')).render(<App />)
