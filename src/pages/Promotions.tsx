// src/pages/Promotions.tsx
import React, { useEffect, useState } from 'react'
import promoService, { Promotion } from '../services/promoService'
import catalogueService, { Product } from '../services/catalogueService'

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function load() {
      const p = await promoService.fetchPromotions()
      const c = await catalogueService.fetchCatalogue()
      setPromos(p)
      setProducts(c)
    }
    load()
  }, [])

  return (
    <main>
      <h1>Promotions</h1>
      {promos.length === 0 ? (
        <p>No promotions found.</p>
      ) : (
        <ul>
          {promos.map((pr) => {
            const product = products.find((p) => p.id === pr.productId)
            return (
              <li key={pr.id}>
                <strong>{pr.label ?? product?.name ?? pr.productId}</strong>
                {pr.discountPct ? <span> - {pr.discountPct}%</span> : null}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
