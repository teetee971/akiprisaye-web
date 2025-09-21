import { useEffect, useState } from 'react'
import { addToCart, cartTotal, cartItems, clearCart } from '../services/logic.js'
import { searchProducts, clearCache } from '../services/api.js'

export default function Comparateur(){
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [territory, setTerritory] = useState('guadeloupe')
  
  const refresh = ()=> setTotal(cartTotal())

  useEffect(()=>{ refresh() }, [])

  const doSearch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const products = await searchProducts(q, territory)
      setResults(products)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = () => {
    clearCache()
    setResults([])
    setError(null)
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Comparer les prix / Panier malin</h2>
      <div className="mt-4 grid gap-3">
        <div className="flex gap-2">
          <select 
            value={territory} 
            onChange={e=>setTerritory(e.target.value)} 
            className="card px-3 py-2"
          >
            <option value="guadeloupe">Guadeloupe</option>
            <option value="martinique">Martinique</option>
            <option value="guyane">Guyane</option>
            <option value="reunion">Réunion</option>
            <option value="mayotte">Mayotte</option>
          </select>
          <input 
            placeholder="Rechercher un produit" 
            className="card px-3 py-2 w-full" 
            value={q} 
            onChange={e=>setQ(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && doSearch()}
          />
          <button 
            onClick={doSearch} 
            disabled={loading}
            className="link-btn w-40"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
        
        {error && (
          <div className="card p-4 bg-red-900/20 border border-red-500/30">
            <div className="text-red-300 font-semibold">Erreur</div>
            <div className="text-red-200 text-sm mt-1">{error}</div>
            <button 
              onClick={handleClearCache}
              className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
            >
              Vider le cache et réessayer
            </button>
          </div>
        )}
        
        <div className="text-white/70 text-sm flex justify-between items-center">
          <span>Panier: {cartItems().length} articles — Total estimé: {total.toFixed(2)}€</span>
          <span className="text-xs">
            {results.length > 0 && `${results.length} produit${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={()=>{clearCart(); refresh()}} 
            className="card px-3 py-2 hover:bg-white/10"
          >
            Vider le panier
          </button>
          <button 
            onClick={handleClearCache}
            className="card px-3 py-2 hover:bg-white/10 text-white/60 text-sm"
          >
            Actualiser les données
          </button>
        </div>
        
        <div className="grid gap-3">
          {loading && (
            <div className="card p-4 text-center text-white/60">
              <div className="animate-pulse">Recherche de prix en cours...</div>
            </div>
          )}
          
          {!loading && results.map(p=> (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-white/60 text-sm">{p.brand} — {p.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Meilleur prix</div>
                  <div className="text-lg font-bold">{p.best.price.toFixed(2)}€</div>
                  <div className="text-xs text-white/50">{p.best.store}</div>
                  {p.best.updatedAt && (
                    <div className="text-xs text-white/40 mt-1">
                      MAJ: {new Date(p.best.updatedAt).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {p.prices.map((s, idx) => (
                  <button 
                    key={`${s.store}-${idx}`} 
                    onClick={()=>{addToCart({id:p.id,name:p.name, store:s.store, price:s.price}); refresh()}}
                    className="link-btn text-sm"
                  >
                    {s.store} — {s.price.toFixed(2)}€
                    {s.storeCity && (
                      <span className="text-white/50 ml-1">({s.storeCity})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {!loading && !error && results.length === 0 && q && (
            <div className="card p-4 text-center text-white/60">
              Aucun produit trouvé pour "{q}" en {territory}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}