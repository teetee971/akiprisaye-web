import { Request, Response } from 'express'
import { PriceRecord } from '../types/civic'
import { predictPrice } from '../services/prediction.service'
import { getPriceRecords } from '../services/priceData.service'

export async function getPrices(req: Request, res: Response) {
  try {
    const { product, territory } = req.query
    
    const prices = await getPriceRecords(
      product as string | undefined,
      territory as string | undefined
    )
    
    res.json(prices)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices' })
  }
}

export async function getPricePrediction(req: Request, res: Response) {
  try {
    const { product, territory } = req.query
    
    const prices = await getPriceRecords(
      product as string | undefined,
      territory as string | undefined
    )
    
    if (prices.length === 0) {
      return res.status(404).json({ error: 'No price data found' })
    }
    
    const prediction = predictPrice(prices)
    
    res.json({
      product,
      territory,
      prediction
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict prices' })
  }
}
