/**
 * Press Kit Service
 * 
 * Generates press kits with inflation data and visualizations for media.
 */

import { PrismaClient } from '@prisma/client';
import { INFLATION_CONFIG } from '../../config/inflationConfig.js';
import { getInflationHistory } from './historyService.js';
import { getAllCategoriesInflation } from './categoryAnalysisService.js';
import { getMetroComparison, getAllMetroComparisons } from './metroComparisonService.js';
import { getTopMovers } from './topMoversService.js';

const prisma = new PrismaClient();

export interface PressKitHighlight {
  title: string;
  value: string | number;
  context: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface PressKitSection {
  title: string;
  summary: string;
  data: any;
  keyPoints: string[];
}

export interface PressKit {
  period: string;
  generatedAt: Date;
  title: string;
  subtitle: string;
  highlights: PressKitHighlight[];
  sections: PressKitSection[];
  metadata: {
    dataSource: string;
    methodology: string;
    contact: string;
    disclaimer: string;
  };
}

/**
 * Generate comprehensive press kit for a period
 */
export async function generatePressKit(period: string): Promise<PressKit> {
  try {
    const generatedAt = new Date();

    // Generate all sections
    const sections: PressKitSection[] = [];
    
    // 1. Overview section
    sections.push(await generateOverviewSection(period));

    // 2. Territory comparison section
    sections.push(await generateTerritoryComparisonSection(period));

    // 3. Metro comparison section
    sections.push(await generateMetroComparisonSection(period));

    // 4. Category analysis section
    sections.push(await generateCategoryAnalysisSection(period));

    // 5. Top movers section
    sections.push(await generateTopMoversSection(period));

    // Generate highlights
    const highlights = await generateHighlights(period, sections);

    // Format period for display
    const [year, month] = period.split('-');
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const monthName = monthNames[parseInt(month) - 1];

    return {
      period,
      generatedAt,
      title: `Observatoire des prix DOM-TOM - ${monthName} ${year}`,
      subtitle: 'Analyse mensuelle de l\'inflation dans les territoires d\'Outre-mer',
      highlights,
      sections,
      metadata: {
        dataSource: 'A Ki Pri Sa Yé - Observatoire citoyen des prix',
        methodology: 'Indice calculé sur un panier de référence de produits de consommation courante (base 100 : janvier 2024)',
        contact: 'presse@akiprisaye.fr',
        disclaimer: 'Les données présentées sont issues des observations citoyennes et peuvent ne pas refléter l\'ensemble du marché.',
      },
    };
  } catch (error) {
    console.error('Error generating press kit:', error);
    throw error;
  }
}

/**
 * Generate overview section
 */
async function generateOverviewSection(period: string): Promise<PressKitSection> {
  const indices = await prisma.priceIndex.findMany({
    where: { period },
    orderBy: { yearlyChange: 'desc' },
  });

  const avgInflation = indices.reduce((sum, idx) => sum + idx.yearlyChange, 0) / indices.length;
  const highest = indices[0];
  const lowest = indices[indices.length - 1];

  return {
    title: 'Vue d\'ensemble',
    summary: `L'inflation moyenne dans les DOM-TOM s'établit à ${avgInflation.toFixed(1)}% en glissement annuel pour ${period}.`,
    data: {
      avgInflation: Math.round(avgInflation * 10) / 10,
      territories: indices.map(idx => ({
        territory: idx.territory,
        name: INFLATION_CONFIG.territoryNames[idx.territory as keyof typeof INFLATION_CONFIG.territoryNames],
        inflation: idx.yearlyChange,
        basketPrice: idx.basketPrice,
      })),
    },
    keyPoints: [
      `Inflation moyenne: ${avgInflation.toFixed(1)}%`,
      `Plus forte inflation: ${highest.territory} (${highest.yearlyChange.toFixed(1)}%)`,
      `Plus faible inflation: ${lowest.territory} (${lowest.yearlyChange.toFixed(1)}%)`,
      `Nombre de territoires suivis: ${indices.length}`,
    ],
  };
}

/**
 * Generate territory comparison section
 */
async function generateTerritoryComparisonSection(period: string): Promise<PressKitSection> {
  const indices = await prisma.priceIndex.findMany({
    where: { period },
    orderBy: { yearlyChange: 'desc' },
  });

  const comparison = indices.map(idx => ({
    territory: idx.territory,
    name: INFLATION_CONFIG.territoryNames[idx.territory as keyof typeof INFLATION_CONFIG.territoryNames],
    indexValue: idx.indexValue,
    yearlyChange: idx.yearlyChange,
    monthlyChange: idx.monthlyChange,
    basketPrice: idx.basketPrice,
  }));

  return {
    title: 'Comparaison entre territoires',
    summary: `Analyse comparative de l'inflation entre les différents territoires d'Outre-mer.`,
    data: { comparison },
    keyPoints: [
      `Écart max entre territoires: ${(indices[0].yearlyChange - indices[indices.length - 1].yearlyChange).toFixed(1)} points`,
      `Panier le plus cher: ${comparison[0].name} (${comparison[0].basketPrice.toFixed(2)}€)`,
      `Évolution mensuelle moyenne: ${(comparison.reduce((sum, c) => sum + c.monthlyChange, 0) / comparison.length).toFixed(2)}%`,
    ],
  };
}

/**
 * Generate metro comparison section
 */
async function generateMetroComparisonSection(period: string): Promise<PressKitSection> {
  const comparisons = await getAllMetroComparisons(period);

  const avgGap = comparisons.reduce((sum, c) => sum + c.overallGap, 0) / comparisons.length;
  const maxGap = Math.max(...comparisons.map(c => c.overallGap));
  const minGap = Math.min(...comparisons.map(c => c.overallGap));

  return {
    title: 'Écart avec la France métropolitaine',
    summary: `Les prix dans les DOM-TOM sont en moyenne ${avgGap.toFixed(1)}% plus élevés qu'en métropole.`,
    data: {
      avgGap: Math.round(avgGap * 10) / 10,
      comparisons: comparisons.map(c => ({
        territory: c.territory,
        territoryName: c.territoryName,
        gap: c.overallGap,
        basketPriceGap: c.basketPriceGap,
      })),
    },
    keyPoints: [
      `Écart moyen: +${avgGap.toFixed(1)}%`,
      `Écart maximum: +${maxGap.toFixed(1)}%`,
      `Écart minimum: +${minGap.toFixed(1)}%`,
      `Surcoût moyen du panier: ${(comparisons.reduce((sum, c) => sum + c.basketPriceGap, 0) / comparisons.length).toFixed(2)}€`,
    ],
  };
}

/**
 * Generate category analysis section
 */
async function generateCategoryAnalysisSection(period: string): Promise<PressKitSection> {
  // Get category data for first territory as example
  const territory = INFLATION_CONFIG.territories[0];
  const categories = await getAllCategoriesInflation(territory, period);

  const sorted = [...categories].sort((a, b) => b.yearlyChange - a.yearlyChange);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  return {
    title: 'Analyse par catégorie',
    summary: `Les ${highest.categoryName} enregistrent la plus forte hausse (+${highest.yearlyChange.toFixed(1)}%).`,
    data: {
      categories: sorted.map(cat => ({
        category: cat.category,
        name: cat.categoryName,
        icon: cat.icon,
        yearlyChange: cat.yearlyChange,
        monthlyChange: cat.monthlyChange,
      })),
    },
    keyPoints: [
      `Plus forte hausse: ${highest.categoryName} (+${highest.yearlyChange.toFixed(1)}%)`,
      `Plus faible hausse: ${lowest.categoryName} (${lowest.yearlyChange >= 0 ? '+' : ''}${lowest.yearlyChange.toFixed(1)}%)`,
      `Nombre de catégories analysées: ${categories.length}`,
    ],
  };
}

/**
 * Generate top movers section
 */
async function generateTopMoversSection(period: string): Promise<PressKitSection> {
  const territory = INFLATION_CONFIG.territories[0];
  const movers = await getTopMovers(territory, period, 10);

  const topIncrease = movers.biggestIncrease;
  const topDecrease = movers.biggestDecrease;

  return {
    title: 'Produits en forte variation',
    summary: `${movers.topIncreases.length} produits en forte hausse, ${movers.topDecreases.length} en baisse.`,
    data: {
      increases: movers.topIncreases.slice(0, 5).map(m => ({
        product: m.productName,
        category: m.categoryName,
        change: m.change,
        oldPrice: m.oldPrice,
        newPrice: m.newPrice,
      })),
      decreases: movers.topDecreases.slice(0, 5).map(m => ({
        product: m.productName,
        category: m.categoryName,
        change: m.change,
        oldPrice: m.oldPrice,
        newPrice: m.newPrice,
      })),
    },
    keyPoints: [
      topIncrease ? `Plus forte hausse: ${topIncrease.productName} (+${topIncrease.change.toFixed(1)}%)` : '',
      topDecrease ? `Plus forte baisse: ${topDecrease.productName} (${topDecrease.change.toFixed(1)}%)` : '',
      `${movers.topIncreases.filter(m => m.change > 10).length} produits en hausse de plus de 10%`,
    ].filter(Boolean),
  };
}

/**
 * Generate highlights for press kit
 */
async function generateHighlights(
  period: string,
  sections: PressKitSection[]
): Promise<PressKitHighlight[]> {
  const highlights: PressKitHighlight[] = [];

  // Extract key metrics from sections
  const overview = sections.find(s => s.title === 'Vue d\'ensemble');
  if (overview) {
    const avgInflation = overview.data.avgInflation;
    highlights.push({
      title: 'Inflation moyenne',
      value: `${avgInflation}%`,
      context: 'En glissement annuel',
      severity: avgInflation > 4 ? 'alert' : avgInflation > 2 ? 'warning' : 'info',
    });
  }

  const metro = sections.find(s => s.title.includes('métropolitaine'));
  if (metro) {
    highlights.push({
      title: 'Écart avec la métropole',
      value: `+${metro.data.avgGap}%`,
      context: 'Prix supérieurs en moyenne',
      severity: metro.data.avgGap > 30 ? 'alert' : 'warning',
    });
  }

  const categories = sections.find(s => s.title.includes('catégorie'));
  if (categories && categories.data.categories.length > 0) {
    const top = categories.data.categories[0];
    highlights.push({
      title: 'Catégorie la plus touchée',
      value: `${top.name} +${top.yearlyChange.toFixed(1)}%`,
      context: 'Plus forte hausse',
      severity: top.yearlyChange > 6 ? 'alert' : 'warning',
    });
  }

  return highlights;
}

/**
 * Save press kit to database
 */
export async function savePressKit(pressKit: PressKit): Promise<void> {
  try {
    await prisma.inflationReport.upsert({
      where: {
        period: pressKit.period,
      },
      update: {
        globalIndex: 0, // To be calculated
        territoryData: {},
        categoryData: {},
        topMovers: {},
        metroComparison: pressKit as any,
        pressKitUrl: null,
        generatedAt: pressKit.generatedAt,
      },
      create: {
        period: pressKit.period,
        globalIndex: 0,
        territoryData: {},
        categoryData: {},
        topMovers: {},
        metroComparison: pressKit as any,
        pressKitUrl: null,
        generatedAt: pressKit.generatedAt,
      },
    });
  } catch (error) {
    console.error('Error saving press kit:', error);
    throw error;
  }
}

/**
 * Get press kits by date range
 */
export async function getPressKits(
  startPeriod: string,
  endPeriod: string
): Promise<PressKit[]> {
  try {
    const reports = await prisma.inflationReport.findMany({
      where: {
        period: {
          gte: startPeriod,
          lte: endPeriod,
        },
      },
      orderBy: {
        period: 'desc',
      },
    });

    return reports.map(report => report.metroComparison as unknown as PressKit);
  } catch (error) {
    console.error('Error getting press kits:', error);
    return [];
  }
}
