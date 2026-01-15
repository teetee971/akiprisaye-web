// src/services/eanPublicCatalog.ts
// Catalogue public local pour la résolution EAN
// Aucun appel réseau, données observées uniquement

export type PublicProduct = {
  ean: string
  name: string
  category: string
  territories: string[]
  observedPrices?: {
    territory: string
    store: string
    price: number
    date: string
  }[]
  lastUpdate?: string
}

// Catalogue local - peut être étendu avec des données réelles
const LOCAL_CATALOG: PublicProduct[] = [
  {
    ean: '3017620422003',
    name: 'Nutella 750g',
    category: 'Pâte à tartiner',
    territories: ['GP', 'MQ', 'RE'],
    observedPrices: [
      { territory: 'GP', store: 'Supermarché A', price: 5.99, date: '2025-11-15T10:00:00Z' },
      { territory: 'MQ', store: 'Épicerie B', price: 6.50, date: '2025-11-18T10:00:00Z' },
    ],
    lastUpdate: '2025-11-20T10:00:00Z',
  },
  {
    ean: '3228857000852',
    name: 'Riz Basmati 1kg',
    category: 'Riz et Féculents',
    territories: ['GP', 'RE'],
    observedPrices: [
      { territory: 'GP', store: 'Supermarché A', price: 2.50, date: '2025-11-22T10:00:00Z' },
    ],
    lastUpdate: '2025-11-22T10:00:00Z',
  },
  {
    ean: '3019081238957',
    name: 'Lait UHT Demi-écrémé 1L',
    category: 'Produits Laitiers',
    territories: ['GP', 'MQ', 'RE'],
    observedPrices: [
      { territory: 'RE', store: 'Carrefour', price: 1.20, date: '2025-11-25T10:00:00Z' },
      { territory: 'MQ', store: 'Super U', price: 1.35, date: '2025-11-26T10:00:00Z' },
    ],
    lastUpdate: '2025-11-26T10:00:00Z',
  },
  {
    ean: '3155250003701',
    name: 'Produit Test Image OCR',
    category: 'Test',
    territories: ['GP', 'MQ', 'RE'],
    observedPrices: [
      { territory: 'GP', store: 'Test Store', price: 3.99, date: '2025-01-05T10:00:00Z' },
      { territory: 'MQ', store: 'Test Store 2', price: 4.20, date: '2025-01-05T10:00:00Z' },
    ],
    lastUpdate: '2025-01-05T10:00:00Z',
  },
]

/**
 * Valide un code EAN-13 avec checksum
 */
export function validateEAN13(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) return false

  const digits = ean.split('').map(Number)
  const check = digits.pop()!
  
  let sum = 0
  digits.forEach((digit, index) => {
    sum += digit * (index % 2 === 0 ? 1 : 3)
  })
  
  const calculatedCheck = (10 - (sum % 10)) % 10
  return calculatedCheck === check
}

/**
 * Valide un code EAN-8 avec checksum
 */
export function validateEAN8(ean: string): boolean {
  if (!/^\d{8}$/.test(ean)) return false

  const digits = ean.split('').map(Number)
  const check = digits.pop()!
  
  let sum = 0
  digits.forEach((digit, index) => {
    sum += digit * (index % 2 === 0 ? 3 : 1)
  })
  
  const calculatedCheck = (10 - (sum % 10)) % 10
  return calculatedCheck === check
}

/**
 * Valide un code EAN (EAN-8 ou EAN-13)
 */
export function validateEAN(ean: string): boolean {
  const cleaned = ean.trim()
  if (cleaned.length === 13) return validateEAN13(cleaned)
  if (cleaned.length === 8) return validateEAN8(cleaned)
  return false
}

/**
 * Recherche un produit par EAN dans le catalogue local
 */
export function getProductByEAN(ean: string): PublicProduct | null {
  const cleaned = ean.trim()
  if (!validateEAN(cleaned)) return null
  
  return LOCAL_CATALOG.find(product => product.ean === cleaned) || null
}

/**
 * Récupère tous les produits du catalogue (pour debug/admin)
 */
export function getAllProducts(): PublicProduct[] {
  return [...LOCAL_CATALOG]
}

export default {
  validateEAN,
  validateEAN13,
  validateEAN8,
  getProductByEAN,
  getAllProducts,
}
