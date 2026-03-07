 
/**
 * Product Insight Service Tests - v1.5.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeIngredients,
  analyzeAdditives,
  parseNutritionTable,
  interpretNutrition,
  classifySugarDensity,
  classifySaltDensity,
  classifyCaloricDensity,
  analyzeFormulation,
} from '../services/productInsightService';
import type {
  NutritionPer100g,
  IngredientInsight,
  AdditiveInsight,
} from '../types/productInsight';

describe('Product Insight Service', () => {
  
  describe('Ingredient Analysis', () => {
    it('should parse and analyze simple ingredient list', async () => {
      const ingredientsText = 'Farine de blé, sucre, sel';
      const result = await analyzeIngredients(ingredientsText);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('role');
      expect(result[0]).toHaveProperty('origin');
    });
    
    it('should handle empty ingredient text', async () => {
      const result = await analyzeIngredients('');
      expect(result).toEqual([]);
    });
    
    it('should identify known ingredients', async () => {
      const ingredientsText = 'Sucre, sel, farine de blé';
      const result = await analyzeIngredients(ingredientsText);
      
      const sugar = result.find(ing => ing.name.toLowerCase().includes('sucre'));
      expect(sugar).toBeDefined();
      if (sugar) {
        expect(sugar.role).toBe('sweetener');
        expect(sugar.origin).toBe('vegetal');
      }
    });
    
    it('should handle ingredients with percentages', async () => {
      const ingredientsText = 'Tomates 60%, huile d\'olive 30%, sel 10%';
      const result = await analyzeIngredients(ingredientsText);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(ing => ing.name.toLowerCase().includes('tomate'))).toBe(true);
    });
    
    it('should mark unknown ingredients appropriately', async () => {
      const ingredientsText = 'Ingrédient totalement inconnu XYZ123';
      const result = await analyzeIngredients(ingredientsText);
      
      expect(result.length).toBeGreaterThan(0);
      // Unknown ingredients should still return basic info
      expect(result[0].role).toBeDefined();
      expect(result[0].origin).toBeDefined();
    });
  });
  
  describe('Additive Analysis', () => {
    it('should detect E-numbers in ingredient text', async () => {
      const ingredientsText = 'Farine, sucre, E330, E100';
      const result = await analyzeAdditives(ingredientsText);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result.some(add => add.code === 'E330')).toBe(true);
      expect(result.some(add => add.code === 'E100')).toBe(true);
    });
    
    it('should handle E-numbers with spaces', async () => {
      const ingredientsText = 'Ingrédients: E 330, E 200';
      const result = await analyzeAdditives(ingredientsText);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].code).toMatch(/E\d{3}/);
    });
    
    it('should return empty array when no additives present', async () => {
      const ingredientsText = 'Farine, sucre, sel';
      const result = await analyzeAdditives(ingredientsText);
      
      expect(result).toEqual([]);
    });
    
    it('should provide regulatory information for known additives', async () => {
      const ingredientsText = 'E330';
      const result = await analyzeAdditives(ingredientsText);
      
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('function');
      expect(result[0]).toHaveProperty('regulatoryNotes');
      expect(result[0]).toHaveProperty('countriesStatus');
    });
    
    it('should handle unknown additives gracefully', async () => {
      const ingredientsText = 'E9999'; // Non-existent E-number
      const result = await analyzeAdditives(ingredientsText);
      
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('E9999');
      expect(result[0].function).toBeDefined();
    });
  });
  
  describe('Nutrition Table Parsing', () => {
    it('should parse complete nutrition table', () => {
      const nutritionText = `
        Valeurs nutritionnelles pour 100g:
        Énergie: 2000 kJ / 478 kcal
        Matières grasses: 20g
        dont acides gras saturés: 10g
        Glucides: 60g
        dont sucres: 25g
        Protéines: 8g
        Sel: 1.5g
      `;
      
      const result = parseNutritionTable(nutritionText);
      
      expect(result.energyKcal).toBe(478);
      expect(result.energyKj).toBe(2000);
      expect(result.fats).toBe(20);
      expect(result.saturatedFats).toBe(10);
      expect(result.carbohydrates).toBe(60);
      expect(result.sugars).toBe(25);
      expect(result.proteins).toBe(8);
      expect(result.salt).toBe(1.5);
    });
    
    it('should handle missing values with defaults', () => {
      const nutritionText = 'Énergie: 100 kcal, Sel: 0.5g';
      const result = parseNutritionTable(nutritionText);
      
      expect(result.energyKcal).toBe(100);
      expect(result.salt).toBe(0.5);
      expect(result.fats).toBe(0);
      expect(result.sugars).toBe(0);
    });
    
    it('should handle comma decimal separator', () => {
      const nutritionText = 'Sucres: 12,5g, Sel: 1,2g';
      const result = parseNutritionTable(nutritionText);
      
      expect(result.sugars).toBe(12.5);
      expect(result.salt).toBe(1.2);
    });
    
    it('should return defaults for empty text', () => {
      const result = parseNutritionTable('');
      
      expect(result.energyKcal).toBe(0);
      expect(result.fats).toBe(0);
      expect(result.sugars).toBe(0);
      expect(result.salt).toBe(0);
    });
    
    it('should handle various label formats', () => {
      const nutritionText = `
        Energy: 500 kcal
        Fats: 15g
        Saturated: 5g
        Sugars: 20g
        Salt: 2g
      `;
      
      const result = parseNutritionTable(nutritionText);
      
      expect(result.energyKcal).toBe(500);
      expect(result.fats).toBe(15);
      expect(result.sugars).toBe(20);
      expect(result.salt).toBe(2);
    });
  });
  
  describe('Nutrition Interpretation', () => {
    it('should classify low sugar density correctly', () => {
      expect(classifySugarDensity(2)).toBe('low');
      expect(classifySugarDensity(4.9)).toBe('low');
    });
    
    it('should classify moderate sugar density correctly', () => {
      expect(classifySugarDensity(5)).toBe('moderate');
      expect(classifySugarDensity(10)).toBe('moderate');
      expect(classifySugarDensity(12.4)).toBe('moderate');
    });
    
    it('should classify high sugar density correctly', () => {
      expect(classifySugarDensity(12.5)).toBe('high');
      expect(classifySugarDensity(20)).toBe('high');
      expect(classifySugarDensity(24.9)).toBe('high');
    });
    
    it('should classify very high sugar density correctly', () => {
      expect(classifySugarDensity(25)).toBe('very_high');
      expect(classifySugarDensity(50)).toBe('very_high');
    });
    
    it('should classify salt density correctly', () => {
      expect(classifySaltDensity(0.1)).toBe('low');
      expect(classifySaltDensity(0.5)).toBe('moderate');
      expect(classifySaltDensity(2)).toBe('high');
      expect(classifySaltDensity(4)).toBe('very_high');
    });
    
    it('should classify caloric density correctly', () => {
      expect(classifyCaloricDensity(50)).toBe('low');
      expect(classifyCaloricDensity(200)).toBe('moderate');
      expect(classifyCaloricDensity(350)).toBe('high');
      expect(classifyCaloricDensity(500)).toBe('very_high');
    });
    
    it('should interpret complete nutrition data', () => {
      const nutrition: NutritionPer100g = {
        energyKcal: 450,
        fats: 15,
        saturatedFats: 8,
        sugars: 30,
        salt: 2,
      };
      
      const result = interpretNutrition(nutrition);
      
      expect(result.sugarDensity).toBe('very_high');
      expect(result.saltDensity).toBe('high');
      expect(result.caloricDensity).toBe('very_high');
      expect(result.fatDensity).toBeDefined();
      expect(result.saturatedFatDensity).toBeDefined();
    });
    
    it('should handle low-density product correctly', () => {
      const nutrition: NutritionPer100g = {
        energyKcal: 80,
        fats: 2,
        saturatedFats: 0.5,
        sugars: 3,
        salt: 0.2,
      };
      
      const result = interpretNutrition(nutrition);
      
      expect(result.sugarDensity).toBe('low');
      expect(result.saltDensity).toBe('low');
      expect(result.caloricDensity).toBe('low');
    });
  });
  
  describe('Formulation Analysis', () => {
    it('should classify minimal processing correctly', () => {
      const ingredients: IngredientInsight[] = [
        {
          name: 'Farine',
          role: 'base',
          origin: 'vegetal',
          frequencyInProducts: 'common',
          regulatoryStatus: { EU: 'authorized' },
        },
        {
          name: 'Eau',
          role: 'base',
          origin: 'mineral',
          frequencyInProducts: 'very_common',
          regulatoryStatus: { EU: 'authorized' },
        },
      ];
      
      const additives: AdditiveInsight[] = [];
      
      const result = analyzeFormulation(ingredients, additives);
      
      expect(result.processingLevel).toBe('minimal');
      expect(result.ingredientCount).toBe(2);
      expect(result.additiveCount).toBe(0);
    });
    
    it('should classify processed products correctly', () => {
      const ingredients: IngredientInsight[] = Array(8).fill({
        name: 'Ingrédient',
        role: 'base',
        origin: 'vegetal',
        frequencyInProducts: 'common',
        regulatoryStatus: { EU: 'authorized' },
      });
      
      const additives: AdditiveInsight[] = [
        {
          code: 'E330',
          function: 'Acidifiant',
          regulatoryNotes: 'Autorisé',
          countriesStatus: { EU: 'allowed' },
        },
      ];
      
      const result = analyzeFormulation(ingredients, additives);
      
      expect(result.processingLevel).toBe('processed');
      expect(result.ingredientCount).toBe(8);
      expect(result.additiveCount).toBe(1);
    });
    
    it('should classify ultra-processed products correctly', () => {
      const ingredients: IngredientInsight[] = Array(20).fill({
        name: 'Ingrédient',
        role: 'base',
        origin: 'vegetal',
        frequencyInProducts: 'common',
        regulatoryStatus: { EU: 'authorized' },
      });
      
      const additives: AdditiveInsight[] = Array(6).fill({
        code: 'E000',
        function: 'Additif',
        regulatoryNotes: 'Autorisé',
        countriesStatus: { EU: 'allowed' },
      });
      
      const result = analyzeFormulation(ingredients, additives);
      
      expect(result.processingLevel).toBe('ultra_processed');
    });
    
    it('should identify main categories', () => {
      const ingredients: IngredientInsight[] = [
        {
          name: 'Farine',
          role: 'base',
          origin: 'vegetal',
          frequencyInProducts: 'common',
          regulatoryStatus: { EU: 'authorized' },
        },
        {
          name: 'Lait',
          role: 'base',
          origin: 'animal',
          frequencyInProducts: 'common',
          regulatoryStatus: { EU: 'authorized' },
        },
      ];
      
      const result = analyzeFormulation(ingredients, []);
      
      expect(result.mainCategories).toContain('végétal');
      expect(result.mainCategories).toContain('animal');
    });
    
    it('should count ingredients and additives correctly', () => {
      const ingredients: IngredientInsight[] = Array(12).fill({
        name: 'Ingrédient',
        role: 'base',
        origin: 'vegetal',
        frequencyInProducts: 'common',
        regulatoryStatus: { EU: 'authorized' },
      });
      
      const additives: AdditiveInsight[] = Array(3).fill({
        code: 'E000',
        function: 'Additif',
        regulatoryNotes: 'Autorisé',
        countriesStatus: { EU: 'allowed' },
      });
      
      const result = analyzeFormulation(ingredients, additives);
      
      expect(result.ingredientCount).toBe(12);
      expect(result.additiveCount).toBe(3);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed OCR text gracefully', async () => {
      const malformedText = '###!@#$%^&*()';
      const result = await analyzeIngredients(malformedText);
      
      // Should not throw, should return empty or minimal data
      expect(result).toBeInstanceOf(Array);
    });
    
    it('should handle very long ingredient lists', async () => {
      const longList = Array(100).fill('ingrédient').join(', ');
      const result = await analyzeIngredients(longList);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
    
    it('should handle special characters in nutrition text', () => {
      const specialText = 'Énergie: 500 kçàl, Súcres: 10g, Sél: 1,5g';
      const result = parseNutritionTable(specialText);
      
      // Should parse despite special characters
      expect(result).toBeDefined();
      expect(result.energyKcal).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle zero values in nutrition', () => {
      const nutrition: NutritionPer100g = {
        energyKcal: 0,
        fats: 0,
        saturatedFats: 0,
        sugars: 0,
        salt: 0,
      };
      
      const result = interpretNutrition(nutrition);
      
      expect(result.sugarDensity).toBe('low');
      expect(result.saltDensity).toBe('low');
      expect(result.caloricDensity).toBe('low');
    });
  });
  
  describe('Data Quality Metrics', () => {
    it('should identify high-quality complete data', async () => {
      const ingredientsText = 'Farine de blé, sucre, sel, E330';
      const ingredients = await analyzeIngredients(ingredientsText);
      
      expect(ingredients.length).toBeGreaterThan(0);
      expect(ingredients.every(ing => ing.role && ing.origin)).toBe(true);
    });
    
    it('should handle partial nutrition data', () => {
      const partialText = 'Énergie: 300 kcal';
      const result = parseNutritionTable(partialText);
      
      expect(result.energyKcal).toBe(300);
      // Other values should have safe defaults
      expect(result.fats).toBe(0);
      expect(result.sugars).toBe(0);
    });
  });
  
  describe('Type Safety', () => {
    it('should return correctly typed ingredient insights', async () => {
      const result = await analyzeIngredients('Sucre');
      
      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        const first = result[0];
        expect(typeof first.name).toBe('string');
        expect(['sweetener', 'preservative', 'flavor', 'colorant', 'base', 'thickener', 'emulsifier', 'acidifier', 'antioxidant', 'other']).toContain(first.role);
        expect(['vegetal', 'animal', 'synthetic', 'mineral', 'mixed']).toContain(first.origin);
      }
    });
    
    it('should return correctly typed nutrition interpretation', () => {
      const nutrition: NutritionPer100g = {
        energyKcal: 200,
        fats: 10,
        saturatedFats: 3,
        sugars: 15,
        salt: 1,
      };
      
      const result = interpretNutrition(nutrition);
      
      expect(['low', 'moderate', 'high', 'very_high']).toContain(result.sugarDensity);
      expect(['low', 'moderate', 'high', 'very_high']).toContain(result.saltDensity);
      expect(['low', 'moderate', 'high', 'very_high']).toContain(result.caloricDensity);
    });
  });
});
