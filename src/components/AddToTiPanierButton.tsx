// src/components/AddToTiPanierButton.tsx
import React, { useState } from 'react'
import { useTiPanier } from '../hooks/useTiPanier'
import type { PublicProduct } from '../services/eanPublicCatalog'

type AddToTiPanierButtonProps = {
  product: PublicProduct
}

export default function AddToTiPanierButton({ product }: AddToTiPanierButtonProps) {
  const { addItem } = useTiPanier()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    const latestPrice = product.observedPrices?.[product.observedPrices.length - 1]
    
    addItem({
      id: product.ean,
      quantity: 1,
      meta: {
        ean: product.ean,
        name: product.name,
        price: latestPrice?.price,
        store: latestPrice?.store,
        territory: latestPrice?.territory,
        category: product.category,
      },
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      disabled={added}
      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
        added
          ? 'bg-green-600 text-white cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-500 text-white'
      }`}
      aria-label={`Ajouter ${product.name} au ti-panier`}
    >
      {added ? '✓ Ajouté au ti-panier' : '🛒 Ajouter au ti-panier'}
    </button>
  )
}
