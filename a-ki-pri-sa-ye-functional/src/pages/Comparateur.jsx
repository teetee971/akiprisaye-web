import { useEffect, useState } from 'react'
import { searchProducts, addToCart, cartTotal, cartItems, clearCart } from '../services/logic.js'
import { exportService, notificationService } from '../services/exportService.js'

export default function Comparateur(){
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [showAlertForm, setShowAlertForm] = useState(null)
  const [targetPrice, setTargetPrice] = useState('')
  
  const refresh = ()=> setTotal(cartTotal())

  useEffect(()=>{ 
    refresh() 
    loadAlerts()
  }, [])

  const loadAlerts = () => {
    setAlerts(notificationService.getActiveAlerts())
  }

  const doSearch = async () => {
    const searchResults = await searchProducts(q)
    setResults(searchResults)
    
    // Check for price alerts
    const priceAlerts = notificationService.checkPriceAlerts(searchResults)
    priceAlerts.forEach(alert => {
      notificationService.sendNotification(
        `🎯 Alerte prix: ${alert.productName}`,
        `Nouveau prix: ${alert.newPrice.toFixed(2)}€ chez ${alert.store} (objectif: ${alert.targetPrice.toFixed(2)}€)`
      )
    })
  }

  const handleExport = async (format) => {
    try {
      if (format === 'csv-results') {
        exportService.exportToCSV(results, `recherche-${q || 'tous'}-${new Date().toISOString().split('T')[0]}.csv`)
      } else if (format === 'pdf-results') {
        await exportService.exportToPDF(results, {
          title: `Résultats de recherche: ${q || 'Tous les produits'}`,
          filename: `recherche-${q || 'tous'}-${new Date().toISOString().split('T')[0]}.pdf`
        })
      } else if (format === 'csv-cart') {
        const cart = cartItems()
        if (cart.length === 0) {
          alert('Le panier est vide')
          return
        }
        exportService.exportToCSV(cart, `panier-${new Date().toISOString().split('T')[0]}.csv`)
      } else if (format === 'pdf-cart') {
        const cart = cartItems()
        if (cart.length === 0) {
          alert('Le panier est vide')
          return
        }
        await exportService.exportToPDF(cart, {
          title: 'Mon Panier A KI PRI SA YÉ',
          filename: `panier-${new Date().toISOString().split('T')[0]}.pdf`
        })
      }
      setShowExportMenu(false)
    } catch (error) {
      console.error('Erreur export:', error)
      alert('Erreur lors de l\'export: ' + error.message)
    }
  }

  const addPriceAlert = async (product) => {
    const price = parseFloat(targetPrice)
    if (isNaN(price) || price <= 0) {
      alert('Veuillez entrer un prix valide')
      return
    }

    try {
      await notificationService.requestPermission()
      notificationService.addPriceAlert(product.name, price, product.best.price)
      setShowAlertForm(null)
      setTargetPrice('')
      loadAlerts()
      alert(`Alerte prix ajoutée pour ${product.name} à ${price}€`)
    } catch (error) {
      alert('Impossible d\'activer les notifications: ' + error.message)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-semibold">🛒 Comparer les prix / Panier malin</h2>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="link-btn flex items-center gap-2"
          >
            📤 Exporter
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <div className="text-sm font-semibold mb-2 text-gray-300">Résultats de recherche</div>
                <button onClick={() => handleExport('csv-results')} className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm">
                  📊 CSV - Résultats
                </button>
                <button onClick={() => handleExport('pdf-results')} className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm">
                  📄 PDF - Résultats
                </button>
                
                <hr className="my-2 border-gray-600" />
                
                <div className="text-sm font-semibold mb-2 text-gray-300">Mon panier</div>
                <button onClick={() => handleExport('csv-cart')} className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm">
                  📊 CSV - Panier
                </button>
                <button onClick={() => handleExport('pdf-cart')} className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm">
                  📄 PDF - Panier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="flex gap-2">
          <input 
            placeholder="Rechercher un produit (ex: banane, riz, poisson...)" 
            className="card px-3 py-2 w-full" 
            value={q} 
            onChange={e=>setQ(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && doSearch()}
          />
          <button onClick={doSearch} className="link-btn w-40">🔍 Rechercher</button>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-white/70 text-sm">
            Panier: {cartItems().length} articles — Total estimé: <span className="font-semibold">{total.toFixed(2)}€</span>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>{clearCart(); refresh()}} className="card px-3 py-2 hover:bg-white/10 text-sm">
              🗑️ Vider le panier
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
            <div className="text-sm font-semibold mb-2">🔔 Alertes prix actives ({alerts.length})</div>
            <div className="text-xs text-gray-300">
              {alerts.map(alert => (
                <div key={alert.id} className="flex justify-between items-center">
                  <span>{alert.productName} &lt; {alert.targetPrice}€</span>
                  <button 
                    onClick={() => notificationService.removeAlert(alert.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {results.map(p=> (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-white/60 text-sm">{p.brand} — {p.category}</div>
                  <div className="text-xs text-white/50 mt-1">
                    Écart prix: {(Math.max(...p.prices.map(pr => pr.price)) - Math.min(...p.prices.map(pr => pr.price))).toFixed(2)}€
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Meilleur prix</div>
                  <div className="text-lg font-bold text-green-400">{p.best.price.toFixed(2)}€</div>
                  <div className="text-xs text-white/50">{p.best.store}</div>
                  <button 
                    onClick={() => setShowAlertForm(showAlertForm === p.id ? null : p.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    🔔 Alerte prix
                  </button>
                </div>
              </div>

              {showAlertForm === p.id && (
                <div className="mt-3 bg-gray-800/50 p-3 rounded border">
                  <div className="text-sm mb-2">Recevoir une alerte si le prix descend sous:</div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Prix cible (€)"
                      value={targetPrice}
                      onChange={e => setTargetPrice(e.target.value)}
                      className="card px-2 py-1 text-sm w-32"
                    />
                    <button 
                      onClick={() => addPriceAlert(p)}
                      className="link-btn text-sm"
                    >
                      Ajouter
                    </button>
                    <button 
                      onClick={() => setShowAlertForm(null)}
                      className="card px-2 py-1 text-sm hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                {p.prices.sort((a, b) => a.price - b.price).map(s => (
                  <button 
                    key={s.store} 
                    onClick={()=>{addToCart({id:p.id,name:p.name, store:s.store, price:s.price}); refresh()}}
                    className={`link-btn text-sm ${s.price === p.best.price ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {s.store} — {s.price.toFixed(2)}€
                    {s.price === p.best.price && <span className="ml-1">🏆</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && q && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-lg mb-2">🔍 Aucun résultat trouvé</div>
            <div className="text-sm">Essayez avec d'autres mots-clés ou vérifiez l'orthographe</div>
          </div>
        )}
      </div>
    </div>
  )
}