/**
 * Product Photo Analysis Service - v1.0.0
 * 
 * Analyzes product photos to extract comprehensive information:
 * - Ingredients via OCR
 * - Product identification
 * - Price trends
 * - Nutritional information
 * - Complete product sheet generation
 * 
 * Conforme aux principes institutionnels:
 * - Traitement 100% local
 * - Validation utilisateur obligatoire
 * - Messages clairs sur limites OCR
 */

import { runOCR } from './ocrService';
import { lookupProductByEan } from './eanProductService';
import { getProductDossier } from './productDossierService';
import { getProductInsights } from './productInsightService';
import type { ScannedProductContext } from '../types/scanFlow';
import type { ProductDossier } from '../types/productDossier';
import type { ProductInsight } from '../types/productInsight';

/**
 * Result of product photo analysis
 */
export interface ProductPhotoAnalysisResult {
  success: boolean;
  
  // Product identification
  ean?: string;
  productName?: string;
  brand?: string;
  
  // Extracted text from photo
  rawOcrText?: string;
  
  // Ingredients detected
  ingredients?: string[];
  ingredientsText?: string;
  
  // Nutritional information (if detected)
  nutritionalValues?: {
    energyKcal?: number;
    fat?: number;
    saturatedFat?: number;
    carbohydrates?: number;
    sugars?: number;
    proteins?: number;
    salt?: number;
  };
  
  // Price information (if detected)
  detectedPrice?: number;
  priceUnit?: string;
  
  // Comprehensive product data
  productSheet?: ProductSheet;
  
  // Confidence scores
  confidenceScore: number; // 0-100
  ocrQuality: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Metadata
  analysisTimestamp: Date;
  processingTime: number;
  
  // Warnings/limitations
  warnings: string[];
  
  error?: string;
}

/**
 * Complete product information sheet
 */
export interface ProductSheet {
  // Basic info
  ean?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  
  // Ingredients
  ingredients: {
    list: string[];
    rawText: string;
    additives: string[];
    allergens: string[];
  };
  
  // Nutrition
  nutrition?: {
    per100g: {
      energyKcal?: number;
      fat?: number;
      saturatedFat?: number;
      carbohydrates?: number;
      sugars?: number;
      proteins?: number;
      fiber?: number;
      salt?: number;
    };
    scores?: {
      nutriScore?: string;
      novaGroup?: number;
      ecoScore?: string;
    };
  };
  
  // Price information
  price?: {
    current?: number;
    history: Array<{
      date: string;
      price: number;
      store?: string;
    }>;
    trend: 'rising' | 'stable' | 'falling';
    averagePrice?: number;
  };
  
  // Product insights
  insights?: {
    processing: string;
    origin?: string;
    labels?: string[];
    certifications?: string[];
  };
  
  // Traceability
  traceability: {
    source: string;
    territory: string;
    lastUpdate: string;
    dataQuality: 'excellent' | 'good' | 'partial' | 'limited';
  };
}

/**
 * Extract ingredients from OCR text
 */
function extractIngredients(ocrText: string): {
  ingredients: string[];
  rawText: string;
} {
  // Common patterns for ingredient lists
  const patterns = [
    /ingrédients?\s*:?\s*([^.]+)/i,
    /composition\s*:?\s*([^.]+)/i,
    /liste\s+des\s+ingrédients?\s*:?\s*([^.]+)/i,
  ];
  
  let ingredientsText = '';
  
  for (const pattern of patterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      ingredientsText = match[1].trim();
      break;
    }
  }
  
  if (!ingredientsText) {
    return { ingredients: [], rawText: '' };
  }
  
  // Split ingredients by common separators
  const ingredients = ingredientsText
    .split(/[,;]/)
    .map(ing => ing.trim())
    .filter(ing => ing.length > 2)
    .map(ing => {
      // Remove percentages and clean up
      return ing.replace(/\(\d+%\)/g, '').trim();
    });
  
  return {
    ingredients,
    rawText: ingredientsText,
  };
}

/**
 * Extract nutritional values from OCR text
 */
function extractNutritionalValues(ocrText: string): ProductPhotoAnalysisResult['nutritionalValues'] {
  const values: ProductPhotoAnalysisResult['nutritionalValues'] = {};
  
  // Pattern for nutritional table (per 100g/ml)
  const energyMatch = ocrText.match(/(?:énergie|energy|calories?)[\s:]*(\d+)\s*(?:kcal|kj)/i);
  if (energyMatch) values.energyKcal = parseFloat(energyMatch[1]);
  
  const fatMatch = ocrText.match(/(?:matières?\s+grasses?|lipides?|fat)[\s:]*(\d+(?:[.,]\d+)?)\s*g/i);
  if (fatMatch) values.fat = parseFloat(fatMatch[1].replace(',', '.'));
  
  const satFatMatch = ocrText.match(/(?:acides?\s+gras\s+saturés?|saturated\s+fat)[\s:]*(\d+(?:[.,]\d+)?)\s*g/i);
  if (satFatMatch) values.saturatedFat = parseFloat(satFatMatch[1].replace(',', '.'));
  
  const carbsMatch = ocrText.match(/(?:glucides?|carbohydrates?)[\s:]*(\d+(?:[.,]\d+)?)\s*g/i);
  if (carbsMatch) values.carbohydrates = parseFloat(carbsMatch[1].replace(',', '.'));
  
  const sugarsMatch = ocrText.match(/(?:sucres?|sugars?)[\s:]*(\d+(?:[.,]\d+)?)\s*g/i);
  if (sugarsMatch) values.sugars = parseFloat(sugarsMatch[1].replace(',', '.'));
  
  const proteinsMatch = ocrText.match(/(?:protéines?|proteins?)[\s:]*(\d+(?:[.,]\d+)?)\s*g/i);
  if (proteinsMatch) values.proteins = parseFloat(proteinsMatch[1].replace(',', '.'));
  
  const saltMatch = ocrText.match(/(?:sel|salt)[\s:]*(\d+(?:[.,]\d+)?)\s*g/i);
  if (saltMatch) values.salt = parseFloat(saltMatch[1].replace(',', '.'));
  
  return Object.keys(values).length > 0 ? values : undefined;
}

/**
 * Extract price from OCR text
 */
function extractPrice(ocrText: string): { price?: number; unit?: string } {
  // Patterns for price
  const pricePatterns = [
    /(\d+)[.,](\d{2})\s*€/,
    /€\s*(\d+)[.,](\d{2})/,
    /prix\s*:?\s*(\d+)[.,](\d{2})/i,
  ];
  
  for (const pattern of pricePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const euros = parseInt(match[1]);
      const cents = parseInt(match[2]);
      return {
        price: euros + cents / 100,
        unit: '€',
      };
    }
  }
  
  return {};
}

/**
 * Detect EAN code in OCR text
 */
function detectEAN(ocrText: string): string | undefined {
  // Look for EAN-13 (13 digits) or EAN-8 (8 digits)
  const eanMatch = ocrText.match(/\b\d{13}\b|\b\d{8}\b/);
  return eanMatch ? eanMatch[0] : undefined;
}

/**
 * Calculate OCR quality based on text characteristics
 */
function calculateOCRQuality(ocrText: string, confidence: number): ProductPhotoAnalysisResult['ocrQuality'] {
  const hasIngredients = /ingrédients?|composition/i.test(ocrText);
  const hasNutrition = /énergie|energy|protéines?|glucides?/i.test(ocrText);
  const textLength = ocrText.trim().length;
  
  let score = confidence;
  if (hasIngredients) score += 10;
  if (hasNutrition) score += 10;
  if (textLength > 100) score += 10;
  
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * Analyze product photo and extract all information
 * 
 * @param imageData - Base64 image data or URL
 * @param options - Analysis options
 */
export async function analyzeProductPhoto(
  imageData: string,
  options: {
    territoire?: string;
    includeHistory?: boolean;
  } = {}
): Promise<ProductPhotoAnalysisResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  try {
    // Step 1: Run OCR on the image
    const ocrResult = await runOCR(imageData);
    
    if (!ocrResult.success || !ocrResult.rawText) {
      return {
        success: false,
        error: ocrResult.error || 'OCR extraction failed',
        confidenceScore: 0,
        ocrQuality: 'poor',
        analysisTimestamp: new Date(),
        processingTime: Date.now() - startTime,
        warnings: ['OCR failed to extract text from image'],
      };
    }
    
    const ocrText = ocrResult.rawText;
    const ocrConfidence = ocrResult.confidence || 0;
    
    // Step 2: Extract ingredients
    const { ingredients, rawText: ingredientsText } = extractIngredients(ocrText);
    
    if (ingredients.length === 0) {
      warnings.push('Aucun ingrédient détecté. Vérifiez la qualité de la photo.');
    }
    
    // Step 3: Extract nutritional values
    const nutritionalValues = extractNutritionalValues(ocrText);
    
    if (!nutritionalValues) {
      warnings.push('Informations nutritionnelles non détectées.');
    }
    
    // Step 4: Try to detect EAN
    const detectedEAN = detectEAN(ocrText);
    
    // Step 5: Extract price
    const { price: detectedPrice, unit: priceUnit } = extractPrice(ocrText);
    
    // Step 6: If EAN detected, fetch complete product data
    let productSheet: ProductSheet | undefined;
    let productName: string | undefined;
    let brand: string | undefined;
    
    if (detectedEAN) {
      try {
        const productLookup = await lookupProductByEan(detectedEAN, {
          territoire: options.territoire || 'martinique',
          source: 'scan_photo',
        });
        
        if (productLookup.success && productLookup.product) {
          const product = productLookup.product;
          productName = product.nom;
          brand = product.marque;
          
          // Get comprehensive product dossier
          const dossierResponse = await getProductDossier({
            ean: detectedEAN,
            territory: options.territoire,
            includeHistory: options.includeHistory !== false,
          });
          
          if (dossierResponse.success && dossierResponse.data) {
            productSheet = await buildProductSheet(
              dossierResponse.data,
              ingredients,
              ingredientsText,
              nutritionalValues,
              detectedPrice
            );
          }
        } else {
          warnings.push('Produit non référencé dans la base de données.');
        }
      } catch (error) {
        warnings.push('Erreur lors de la récupération des données produit.');
      }
    } else {
      warnings.push('Code EAN non détecté. Analyse basée sur les informations visibles uniquement.');
    }
    
    // Calculate confidence score
    const baseConfidence = ocrConfidence;
    let confidenceScore = baseConfidence;
    
    if (detectedEAN) confidenceScore += 20;
    if (ingredients.length > 0) confidenceScore += 15;
    if (nutritionalValues) confidenceScore += 10;
    if (detectedPrice) confidenceScore += 5;
    
    confidenceScore = Math.min(100, confidenceScore);
    
    const ocrQuality = calculateOCRQuality(ocrText, ocrConfidence);
    
    return {
      success: true,
      ean: detectedEAN,
      productName,
      brand,
      rawOcrText: ocrText,
      ingredients,
      ingredientsText,
      nutritionalValues,
      detectedPrice,
      priceUnit,
      productSheet,
      confidenceScore,
      ocrQuality,
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
      warnings,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during analysis',
      confidenceScore: 0,
      ocrQuality: 'poor',
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
      warnings: ['Analysis failed'],
    };
  }
}

/**
 * Build complete product sheet from dossier and extracted data
 */
async function buildProductSheet(
  dossier: ProductDossier,
  extractedIngredients: string[],
  ingredientsRawText: string,
  nutritionalValues?: ProductPhotoAnalysisResult['nutritionalValues'],
  detectedPrice?: number
): Promise<ProductSheet> {
  // Get latest snapshot
  const latestSnapshot = dossier.analysisHistory[0];
  
  // Build price history
  const priceHistory: ProductSheet['price'] = {
    current: detectedPrice,
    history: [],
    trend: 'stable',
  };
  
  // Use dossier data for comprehensive sheet
  return {
    ean: dossier.ean,
    name: latestSnapshot?.productName || 'Produit',
    brand: latestSnapshot?.brand,
    imageUrl: latestSnapshot?.images?.[0],
    
    ingredients: {
      list: extractedIngredients.length > 0 
        ? extractedIngredients 
        : (latestSnapshot?.ingredients || []),
      rawText: ingredientsRawText || '',
      additives: latestSnapshot?.additives || [],
      allergens: latestSnapshot?.allergens || [],
    },
    
    nutrition: nutritionalValues ? {
      per100g: nutritionalValues,
      scores: {
        nutriScore: latestSnapshot?.nutriScore,
        novaGroup: latestSnapshot?.novaGroup,
        ecoScore: latestSnapshot?.ecoScore,
      },
    } : undefined,
    
    price: priceHistory,
    
    insights: {
      processing: latestSnapshot?.processingLevel || 'unknown',
      origin: latestSnapshot?.origin,
      labels: latestSnapshot?.labels || [],
      certifications: latestSnapshot?.certifications || [],
    },
    
    traceability: {
      source: 'photo_analysis',
      territory: dossier.territorySnapshots[0]?.territory || 'unknown',
      lastUpdate: dossier.lastUpdate,
      dataQuality: dossier.dataQuality,
    },
  };
}
