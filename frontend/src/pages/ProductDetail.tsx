// src/pages/ProductDetail.tsx
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import catalogueService, { Product } from '../services/catalogueService'

export default function ProductDetail() {
  const { id } = useParams() as { id?: string }
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function load() {
      const c = await catalogueService.fetchCatalogue()
      const found = id ? c.find((p) => p.id === id) : null
      setProduct(found ?? null)
    }
    load()
  }, [id])

  if (!product) return <div>Product not found.</div>

  return (
    <article>
      <h1>{product.name}</h1>
      <p>SKU: {product.sku ?? '—'}</p>
      <p>Price: {product.price ?? '—'}</p>
      <pre>{JSON.stringify(product, null, 2)}</pre>
    </article>
  )
}
