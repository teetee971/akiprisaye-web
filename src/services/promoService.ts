// src/services/promoService.ts
// Simple promo service scaffold

import { Product } from './catalogueService'

export type Promotion = {
  id: string
  productId: string
  label?: string
  startDate?: string
  endDate?: string
  discountPct?: number
}

// Flag promotions for a list of products — placeholder implementation
export function flagPromotions(products: Product[], promos: Promotion[]): Product[] {
  const promoMap = promos.reduce<Record<string, Promotion>>((acc, p) => {
    acc[p.productId] = p
    return acc
  }, {})

  return products.map((p) => ({
    ...p,
    promotion: promoMap[p.id] ?? null,
  }))
}

export async function fetchPromotions(source?: string): Promise<Promotion[]> {
  console.info('fetchPromotions called', { source })
  return []
}

export default { flagPromotions, fetchPromotions }
