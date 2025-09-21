import React from "react";
import Produits from "./pages/Produits";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="bg-white border-b border-slate-200 p-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          A KI PRI SA YÉ
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Comparateur de prix - DOM-TOM
        </p>
      </header>
      
      <main>
        <Produits />
      </main>
    </div>
  )
}

