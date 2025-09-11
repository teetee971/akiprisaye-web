import type { StoreMetrics, RankingData } from '@/components/StoreMetrics';
import type { Store } from '@shared/schema';

export interface ExportData {
  timestamp: string;
  filters: {
    territory?: string;
    category?: string;
  };
  ranking: Array<{
    rank: number;
    storeName: string;
    storeId: string;
    overallScore: number;
    averagePrice: number;
    territoryCount: number;
    totalProducts: number;
    priceCompetitiveness: number;
    territorialCoverage: number;
    productDiversity: number;
    priceStability: number;
  }>;
  summary: {
    totalStores: number;
    topScore: number;
    averageScore: number;
    territories: number;
    totalProducts: number;
  };
}

export async function exportRankingToCSV(
  rankingData: RankingData,
  stores: Store[],
  filters: { territory?: string; category?: string } = {}
): Promise<void> {
  const data = prepareExportData(rankingData, stores, filters);
  
  // Prepare CSV headers
  const headers = [
    'Rang',
    'Enseigne',
    'Score Global',
    'Prix Moyen (€)',
    'Compétitivité Prix (%)',
    'Couverture Territoriale (%)',
    'Nombre Territoires',
    'Diversité Produits',
    'Stabilité Prix (%)',
    'Total Produits'
  ];

  // Prepare CSV rows
  const rows = data.ranking.map(store => [
    store.rank,
    store.storeName,
    store.overallScore.toFixed(1),
    store.averagePrice.toFixed(2),
    store.priceCompetitiveness.toFixed(1),
    store.territorialCoverage.toFixed(1),
    store.territoryCount,
    store.productDiversity,
    store.priceStability.toFixed(1),
    store.totalProducts
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `palmares_enseignes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportRankingToJSON(
  rankingData: RankingData,
  stores: Store[],
  filters: { territory?: string; category?: string } = {}
): Promise<void> {
  const data = prepareExportData(rankingData, stores, filters);
  
  // Create JSON content
  const jsonContent = JSON.stringify(data, null, 2);
  
  // Download JSON file
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `palmares_enseignes_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function shareRanking(
  rankingData: RankingData,
  filters: { territory?: string; category?: string } = {}
): void {
  const topStores = rankingData.metrics.slice(0, 3);
  const territoryText = filters.territory ? ` en ${filters.territory}` : '';
  const categoryText = filters.category ? ` pour ${filters.category}` : '';
  
  const shareText = `🏆 Palmarès des enseignes A KI PRI SA YÉ${territoryText}${categoryText}:
  
🥇 ${topStores[0]?.storeName} - ${topStores[0]?.overallScore.toFixed(0)}/100
🥈 ${topStores[1]?.storeName} - ${topStores[1]?.overallScore.toFixed(0)}/100  
🥉 ${topStores[2]?.storeName} - ${topStores[2]?.overallScore.toFixed(0)}/100

Découvrez le classement complet sur A KI PRI SA YÉ !
#AKIPRISAYE #PalmaresEnseignes #OutreMer`;

  if (navigator.share) {
    navigator.share({
      title: 'Palmarès des enseignes A KI PRI SA YÉ',
      text: shareText,
      url: window.location.href
    }).catch(console.error);
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      // Show notification that text was copied
      console.log('Texte copié dans le presse-papiers');
    }).catch(console.error);
  }
}

function prepareExportData(
  rankingData: RankingData,
  stores: Store[],
  filters: { territory?: string; category?: string }
): ExportData {
  const { metrics } = rankingData;
  
  const ranking = metrics.map((metric, index) => ({
    rank: index + 1,
    storeName: metric.storeName,
    storeId: metric.storeId,
    overallScore: metric.overallScore,
    averagePrice: metric.averagePrice,
    territoryCount: metric.territoryCount,
    totalProducts: metric.totalProducts,
    priceCompetitiveness: metric.priceCompetitiveness,
    territorialCoverage: metric.territorialCoverage,
    productDiversity: metric.productDiversity,
    priceStability: metric.priceStability
  }));

  const scores = metrics.map(m => m.overallScore);
  const totalProducts = metrics.reduce((sum, m) => sum + m.totalProducts, 0);
  const territories = new Set(stores.flatMap(s => s.territories)).size;

  return {
    timestamp: new Date().toISOString(),
    filters,
    ranking,
    summary: {
      totalStores: metrics.length,
      topScore: Math.max(...scores),
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      territories,
      totalProducts
    }
  };
}