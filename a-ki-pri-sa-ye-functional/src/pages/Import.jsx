import { useEffect, useState } from 'react'
import { seedFirestore } from '../services/logic.js'

export default function Import(){
  const [status, setStatus] = useState('Prêt')
  const run = async () => {
    setStatus('Import en cours…')
    const ok = await seedFirestore()
    setStatus(ok?'Import terminé ✔':'Échec import')
  }
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Importer des produits (seed)</h2>
      <p className="text-white/70 mt-2 text-sm">Charge depuis <code>/public/seed.products.json</code> vers Firestore (collection <code>products</code>).</p>
      <button onClick={run} className="link-btn mt-4">Lancer l'import</button>
      <div className="mt-3">{status}</div>
    </div>
  )
}