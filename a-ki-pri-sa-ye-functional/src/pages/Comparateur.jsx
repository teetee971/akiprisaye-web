import { useEffect, useState } from 'react'
import { searchProducts, addToCart, cartTotal, cartItems, clearCart } from '../services/logic.js'

export default function Comparateur(){
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const refresh = ()=> setTotal(cartTotal())

  useEffect(()=>{ refresh() }, [])

  const doSearch = async () => {
    setResults(await searchProducts(q))
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Comparer les prix / Panier malin</h2>
      <div className="mt-4 grid gap-3">
        <div className="flex gap-2">
          <input placeholder="Rechercher un produit" className="card px-3 py-2 w-full" value={q} onChange={e=>setQ(e.target.value)} />
          <button onClick={doSearch} className="link-btn w-40">Rechercher</button>
        </div>
        <div className="text-white/70 text-sm">Panier: {cartItems().length} articles — Total estimé: {total.toFixed(2)}€</div>
        <div className="flex gap-2">
          <button onClick={()=>{clearCart(); refresh()}} className="card px-3 py-2 hover:bg-white/10">Vider le panier</button>
        </div>
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
                  <div className="text-lg font-bold">{p.best.price.toFixed(2)}€</div>
                  <div className="text-xs text-white/50">{p.best.store}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {p.prices.map(s => (
                  <button key={s.store} onClick={()=>{addToCart({id:p.id,name:p.name, store:s.store, price:s.price}); refresh()}}
                    className="link-btn">{s.store} — {s.price.toFixed(2)}€</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}