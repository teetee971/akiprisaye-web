import { CivicNewsItem } from "../types/civic"

export async function fetchPublicNews(): Promise<CivicNewsItem[]> {
  // EXEMPLE : données issues de data.gouv.fr (API ouverte)
  return [
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
}
