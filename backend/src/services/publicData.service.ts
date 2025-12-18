import { CivicNewsItem } from "../types/civic"

// Mock data for demonstration - in production, this would fetch from official APIs
const mockNewsData: CivicNewsItem[] = [
  {
    id: "dgccrf-001",
    title: "Nouvelle baisse des prix observée",
    summary: "La DGCCRF observe une baisse moyenne de 3 % sur les produits alimentaires.",
    category: "PRIX",
    territory: "Guadeloupe",
    publishedAt: "2025-11-07",
    source: {
      name: "DGCCRF",
      url: "https://www.economie.gouv.fr/dgccrf"
    }
  }
]

export async function fetchPublicNews(): Promise<CivicNewsItem[]> {
  // EXEMPLE : données issues de data.gouv.fr (API ouverte)
  // En production, ceci appellerait une vraie API publique
  return mockNewsData
}
