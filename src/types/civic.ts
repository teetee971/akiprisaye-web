export interface CivicSource {
  name: string
  url: string
}

export interface CivicNewsItem {
  id: string
  title: string
  summary: string
  category: "PRIX" | "POLITIQUE" | "ALERTE" | "INNOVATION"
  territory: string
  publishedAt: string
  source: CivicSource
}

export interface PriceRecord {
  product: string
  territory: string
  price: number
  date: string
  source: CivicSource
}
