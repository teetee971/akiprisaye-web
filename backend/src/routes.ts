import { Router } from 'express'
import { getNews } from './controllers/news.controller'
import { getPrices, getPricePrediction } from './controllers/prices.controller'

const router = Router()

// News routes
router.get('/api/news', getNews)

// Price routes
router.get('/api/prices', getPrices)
router.get('/api/prices/prediction', getPricePrediction)

export default router
