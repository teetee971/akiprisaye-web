import { useEffect, useState } from 'react'
import { addToCart, cartTotal, cartItems, clearCart } from '../services/logic.js'
import { fetchPrices, transformPricesForComparator, getErrorMessage } from '../services/api.js'

export default function Comparateur(){
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [territory, setTerritory] = useState('guadeloupe')
  
  const refresh = ()=> setTotal(cartTotal())

  useEffect(()=>{ refresh() }, [])

  const doSearch = async () => {
    if (!q.trim()) {
      setResults([])
      setError('')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const apiData = await fetchPrices({
        territory,
        q: q.trim(),
        limit: 50,
        sort: 'price_asc'
      })
      
      const transformedData = transformPricesForComparator(apiData)
      setResults(transformedData)
      
      if (transformedData.length === 0) {
        setError('Aucun produit trouvé pour cette recherche.')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(getErrorMessage(err))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Comparer les prix / Panier malin</h2>
      <div className="mt-4 grid gap-3">
        {/* Search Controls */}
        <div className="flex gap-2">
          <input 
            placeholder="Rechercher un produit (ex: lait, pain, riz)" 
            className="card px-3 py-2 flex-1" 
            value={q} 
            onChange={e=>setQ(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && doSearch()}
          />
          <select 
            value={territory} 
            onChange={e=>setTerritory(e.target.value)}
            className="card px-3 py-2"
          >
            <option value="guadeloupe">Guadeloupe</option>
            <option value="martinique">Martinique</option>
            <option value="reunion">Réunion</option>
            <option value="guyane">Guyane</option>
          </select>
          <button 
            onClick={doSearch} 
            disabled={loading || !q.trim()}
            className="link-btn w-40 disabled:opacity-50"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Cart Info */}
        <div className="text-white/70 text-sm">
          Panier: {cartItems().length} articles — Total estimé: {total.toFixed(2)}€
        </div>
        
        {/* Cart Actions */}
        <div className="flex gap-2">
          <button 
            onClick={()=>{clearCart(); refresh()}} 
            className="card px-3 py-2 hover:bg-white/10"
          >
            Vider le panier
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card p-4 bg-red-500/20 border border-red-500/30">
            <div className="text-red-200 font-medium">Erreur</div>
            <div className="text-red-100 text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card p-4 text-center text-white/70">
            <div className="animate-pulse">Recherche des meilleurs prix...</div>
          </div>
        )}

        {/* Results Display */}
        <div className="grid gap-3">
          {results.map(p=> (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-white/60 text-sm">{p.brand} — {p.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Meilleur prix</div>
                  <div className="text-lg font-bold text-green-400">{p.best.price.toFixed(2)}€</div>
                  <div className="text-xs text-white/50">{p.best.store}</div>
                  {p.best.storeCity && (
                    <div className="text-xs text-white/40">{p.best.storeCity}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {p.prices.map((s, idx) => (
                  <button 
                    key={`${s.store}-${idx}`} 
                    onClick={()=>{
                      addToCart({
                        id: `${p.id}-${s.store}`,
                        name: p.name, 
                        store: s.store, 
                        price: s.price
                      }); 
                      refresh()
                    }}
                    className="link-btn text-sm"
                  >
                    {s.store} — {s.price.toFixed(2)}€
                    {s.storeCity && <span className="text-white/50 ml-1">({s.storeCity})</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {!loading && !error && results.length === 0 && q.trim() && (
          <div className="card p-4 text-center text-white/70">
            Aucun produit trouvé. Essayez d'autres mots-clés.
          </div>
        )}

        {/* Initial State Message */}
        {!loading && !error && results.length === 0 && !q.trim() && (
          <div className="card p-4 text-center text-white/50">
            Saisissez un produit à rechercher pour comparer les prix
          </div>
        )}
      </div>
    </div>
  )
}