import { Request, Response } from 'express'
import { PriceRecord } from '../../frontend/src/types/civic'
import { predictPrice } from '../services/prediction.service'

// Mock data for demonstration
const mockPriceData: PriceRecord[] = [
  {
    product: "Lait UHT 1L",
    territory: "Guadeloupe",
    price: 1.85,
    date: "2025-11-01",
    source: {
      name: "DGCCRF",
      url: "https://www.economie.gouv.fr/dgccrf"
    }
  },
  {
    product: "Lait UHT 1L",
    territory: "Guadeloupe",
    price: 1.79,
    date: "2025-11-15",
    source: {
      name: "DGCCRF",
      url: "https://www.economie.gouv.fr/dgccrf"
    }
  }
]

export async function getPrices(req: Request, res: Response) {
  try {
    const { product, territory } = req.query
    
    let filteredPrices = mockPriceData
    
    if (product) {
      filteredPrices = filteredPrices.filter(p => p.product === product)
    }
    
    if (territory) {
      filteredPrices = filteredPrices.filter(p => p.territory === territory)
    }
    
    res.json(filteredPrices)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices' })
  }
}

export async function getPricePrediction(req: Request, res: Response) {
  try {
    const { product, territory } = req.query
    
    let filteredPrices = mockPriceData
    
    if (product) {
      filteredPrices = filteredPrices.filter(p => p.product === product)
    }
    
    if (territory) {
      filteredPrices = filteredPrices.filter(p => p.territory === territory)
    }
    
    if (filteredPrices.length === 0) {
      return res.status(404).json({ error: 'No price data found' })
    }
    
    const prediction = predictPrice(filteredPrices)
    
    res.json({
      product,
      territory,
      prediction
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict prices' })
  }
}
