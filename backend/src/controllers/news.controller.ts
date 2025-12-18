import { Request, Response } from 'express'
import { fetchPublicNews } from '../services/publicData.service'

export async function getNews(req: Request, res: Response) {
  try {
    const news = await fetchPublicNews()
    res.json(news)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' })
  }
}
