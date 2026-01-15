// src/hooks/useEANResolver.ts
// Hook pour résoudre un EAN via le catalogue public local

import { useCallback, useState } from 'react'
import { getProductByEAN, type PublicProduct } from '../services/eanPublicCatalog'

export type ResolverState = {
  loading: boolean
  product: PublicProduct | null
  error: string | null
}

export function useEANResolver() {
  const [state, setState] = useState<ResolverState>({
    loading: false,
    product: null,
    error: null,
  })

  const resolveEAN = useCallback(async (ean: string) => {
    setState({ loading: true, product: null, error: null })

    // Simulate async behavior (even though it's local)
    await new Promise((resolve) => setTimeout(resolve, 100))

    const product = getProductByEAN(ean)
    
    if (product) {
      setState({ loading: false, product, error: null })
    } else {
      setState({
        loading: false,
        product: null,
        error: 'Ce produit n\'est pas encore référencé dans les données publiques disponibles.',
      })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, product: null, error: null })
  }, [])

  return {
    ...state,
    resolveEAN,
    reset,
  } as const
}
