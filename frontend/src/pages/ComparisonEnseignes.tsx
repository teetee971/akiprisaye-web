// src/pages/ComparisonEnseignes.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FavoritesPanel from '../components/search/FavoritesPanel'
import StoreComparisonTable from '../components/StoreComparisonTable'
import { GlassCard } from '../components/ui/glass-card'
import { useFavorites, type FavoriteItem } from '../hooks/useFavorites'
import { safeLocalStorage } from '../utils/safeLocalStorage'
import {
  loadCatalogueData,
  compareStoresForProduct,
  getUniqueProducts,
  type ComparisonResult,
} from '../services/storeComparisonService'

export default function ComparisonEnseignes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { favorites, removeFavorite } = useFavorites()
  const [catalogueData, setCatalogueData] = useState<any[]>([])
  const [products, setProducts] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const minPrice = comparison
    ? Math.min(...comparison.comparisons.map((comp) => comp.currentPrice))
    : null
  const maxPrice = comparison
    ? Math.max(...comparison.comparisons.map((comp) => comp.currentPrice))
    : null
  const priceRange = minPrice !== null && maxPrice !== null ? maxPrice - minPrice : null

  // Charger le catalogue au montage
  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await loadCatalogueData()
      setCatalogueData(data)
      const uniqueProducts = getUniqueProducts(data)
      setProducts(uniqueProducts)
      
      // Récupérer le produit depuis l'URL si présent
      const productFromUrl = searchParams.get('product')
      if (productFromUrl && uniqueProducts.includes(productFromUrl)) {
        setSelectedProduct(productFromUrl)
      } else if (uniqueProducts.length > 0) {
        setSelectedProduct(uniqueProducts[0])
      }
      
      setLoading(false)
    }
    load()
  }, [searchParams])

  // Calculer la comparaison quand le produit change
  useEffect(() => {
    if (selectedProduct && catalogueData.length > 0) {
      const result = compareStoresForProduct(selectedProduct, catalogueData)
      setComparison(result)
      
      // Mettre à jour l'URL
      setSearchParams({ product: selectedProduct }, { replace: true })
    }
  }, [selectedProduct, catalogueData, setSearchParams])

  const handleProductChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProduct(event.target.value)
  }

  const handleAddToCart = (store: string, price: number) => {
    // Intégration avec le ti-panier existant
    const item = {
      id: `${selectedProduct}-${store}`,
      name: selectedProduct,
      store,
      price,
      quantity: 1,
      addedAt: new Date().toISOString(),
    }
    
    // Récupérer le panier existant
    const existingCart = safeLocalStorage.getItem('ti-panier:items')
    const cart = existingCart ? JSON.parse(existingCart) : []
    
    // Ajouter le nouvel item
    cart.push(item)
    safeLocalStorage.setItem('ti-panier:items', JSON.stringify(cart))
    
    // Notification simple
    alert(`${selectedProduct} de ${store} ajouté au ti-panier !`)
  }

  const handleViewFavorite = (favorite: FavoriteItem) => {
    if (favorite.route) {
      navigate(favorite.route)
    }
  }
  const handleNewSearch = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.setTimeout(() => {
        const target = document.getElementById('product-select') as HTMLSelectElement | null
        target?.focus()
      }, 200)
    }
  }
  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id)
    setToastMessage('Favori retiré')
    window.setTimeout(() => setToastMessage(null), 1400)
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Comparaison des enseignes</h1>
        <GlassCard>
          <p className="text-white/70">Chargement des données...</p>
        </GlassCard>
      </main>
    )
  }

  if (products.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Comparaison des enseignes</h1>
        <GlassCard>
          <p className="text-white/70">Aucun produit trouvé dans le catalogue.</p>
        </GlassCard>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8" role="main">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Comparaison des enseignes</h1>
        <p className="text-white/70 mb-6">
          Comparez les prix entre les différentes enseignes pour un même produit.
        </p>

        <GlassCard>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label htmlFor="product-select" className="text-white/90 font-medium min-w-fit">
              Sélectionner un produit :
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={handleProductChange}
              className="flex-1 px-4 py-2 bg-white/[0.1] border border-white/[0.22] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sélectionner un produit à comparer"
            >
              {products.map(product => (
                <option key={product} value={product} className="bg-gray-800">
                  {product}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>
      </div>

      <FavoritesPanel favorites={favorites} onView={handleViewFavorite} onRemove={handleRemoveFavorite} />

      {comparison ? (
        <div className="space-y-6">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-white/60 text-sm mb-1">Prix le plus bas</div>
                <div className="text-2xl font-bold text-green-400">
                  {comparison.bestPrice.toFixed(2)} €
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Meilleure enseigne</div>
                <div className="text-xl font-semibold text-white">{comparison.bestStore}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Enseignes comparées</div>
                <div className="text-2xl font-bold text-blue-400">{comparison.comparisons.length}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Écart max / min</div>
                <div className="text-2xl font-bold text-amber-300">
                  {priceRange !== null ? `${priceRange.toFixed(2)} €` : '—'}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/60">Prix observés localement.</p>
          </GlassCard>

          <p className="text-xs text-white/60">
            Les prix peuvent varier selon l’enseigne et le territoire.
          </p>
          <StoreComparisonTable
            comparisons={comparison.comparisons}
            productName={comparison.productName}
            onAddToCart={handleAddToCart}
            territoryLabel="Disponible dans votre territoire"
          />
        </div>
      ) : (
        <GlassCard>
          <div className="space-y-3">
            <p className="text-white/70">
              Aucune comparaison disponible pour ce produit.
              Essayez un autre produit ou changez de territoire.
            </p>
            <button
              type="button"
              onClick={handleNewSearch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
            >
              Nouvelle recherche
            </button>
          </div>
        </GlassCard>
      )}
      {toastMessage && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 text-slate-100 text-sm px-4 py-2 rounded-full shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </main>
  )
}
