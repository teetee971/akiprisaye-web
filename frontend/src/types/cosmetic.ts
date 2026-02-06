/**
 * Types for Cosmetic Evaluation Module
 * Based on EU Regulation 1223/2009 and official databases
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'RESTRICTED' | 'PROHIBITED';

export interface OfficialSource {
  name: string;
  url: string;
  type: 'COSING' | 'ANSES' | 'ECHA' | 'EU_REGULATION';
  accessDate?: string;
}

export interface Ingredient {
  inciName: string;
  commonName?: string;
  casNumber?: string;
  einecs?: string;
  function: string[];
  riskLevel: RiskLevel;
  restrictions?: string;
  sources: OfficialSource[];
  regulatoryReferences?: string[];
}

export interface CosmeticProduct {
  name: string;
  category: string;
  inciList: string;
  ingredients: Ingredient[];
}

export type WarningLevel = 'error' | 'warning' | 'info';

export interface Warning {
  level: WarningLevel;
  message: string;
  ingredients?: string[];
}

export interface EvaluationResult {
  product: CosmeticProduct;
  score: number;
  scoreBreakdown: {
    safeIngredients: number;
    moderateIngredients: number;
    riskIngredients: number;
    restrictedIngredients: number;
    prohibitedIngredients: number;
  };
  warnings: Warning[];
  sources: OfficialSource[];
  evaluationDate: string;
  disclaimer: string;
}
