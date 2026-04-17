/**
 * Tests unitaires pour le service d'évaluation cosmétique
 * Vérifie l'analyse INCI, le scoring et les sources officielles
 */

import { describe, it, expect } from 'vitest';
import {
  parseInciList,
  findIngredient,
  identifyIngredients,
  calculateScore,
  generateWarnings,
  evaluateProduct,
} from '../services/cosmeticEvaluationService';

describe('Cosmetic Evaluation Service', () => {
  describe('parseInciList', () => {
    it('should parse comma-separated INCI list', () => {
      const result = parseInciList('AQUA, GLYCERIN, NIACINAMIDE');
      expect(result).toEqual(['AQUA', 'GLYCERIN', 'NIACINAMIDE']);
    });

    it('should handle semicolon separators', () => {
      const result = parseInciList('AQUA; GLYCERIN; NIACINAMIDE');
      expect(result).toEqual(['AQUA', 'GLYCERIN', 'NIACINAMIDE']);
    });

    it('should trim whitespace', () => {
      const result = parseInciList('  AQUA  ,  GLYCERIN  ,  NIACINAMIDE  ');
      expect(result).toEqual(['AQUA', 'GLYCERIN', 'NIACINAMIDE']);
    });

    it('should handle empty string', () => {
      const result = parseInciList('');
      expect(result).toEqual([]);
    });

    it('should handle null or undefined', () => {
      expect(parseInciList(null)).toEqual([]);
      expect(parseInciList(undefined)).toEqual([]);
    });

    it('should convert to uppercase', () => {
      const result = parseInciList('aqua, glycerin, niacinamide');
      expect(result).toEqual(['AQUA', 'GLYCERIN', 'NIACINAMIDE']);
    });
  });

  describe('findIngredient', () => {
    it('should find AQUA in database', () => {
      const ingredient = findIngredient('AQUA');
      expect(ingredient).not.toBeNull();
      expect(ingredient.inciName).toBe('AQUA');
      expect(ingredient.riskLevel).toBe('LOW');
    });

    it('should find GLYCERIN in database', () => {
      const ingredient = findIngredient('GLYCERIN');
      expect(ingredient).not.toBeNull();
      expect(ingredient.inciName).toBe('GLYCERIN');
      expect(ingredient.commonName).toBe('Glycérine');
    });

    it('should find ingredients case-insensitively', () => {
      const ingredient = findIngredient('glycerin');
      expect(ingredient).not.toBeNull();
      expect(ingredient.inciName).toBe('GLYCERIN');
    });

    it('should return null for unknown ingredients', () => {
      const ingredient = findIngredient('UNKNOWN_INGREDIENT_XYZ123');
      expect(ingredient).toBeNull();
    });

    it('should find PHENOXYETHANOL with restrictions', () => {
      const ingredient = findIngredient('PHENOXYETHANOL');
      expect(ingredient).not.toBeNull();
      expect(ingredient.riskLevel).toBe('MODERATE');
      expect(ingredient.restrictions).toContain('1%');
    });
  });

  describe('identifyIngredients', () => {
    it('should identify all known ingredients', () => {
      const { identified, unknown } = identifyIngredients('AQUA, GLYCERIN, NIACINAMIDE');
      expect(identified.length).toBe(3);
      expect(unknown.length).toBe(0);
      expect(identified[0].inciName).toBe('AQUA');
      expect(identified[1].inciName).toBe('GLYCERIN');
      expect(identified[2].inciName).toBe('NIACINAMIDE');
    });

    it('should separate known and unknown ingredients', () => {
      const { identified, unknown } = identifyIngredients('AQUA, UNKNOWN_XYZ, GLYCERIN');
      expect(identified.length).toBe(2);
      expect(unknown.length).toBe(1);
      expect(unknown[0].inciName).toBe('UNKNOWN_XYZ');
      expect(unknown[0].riskLevel).toBe('MODERATE'); // Par précaution
    });

    it('should provide CosIng link for unknown ingredients', () => {
      const { unknown } = identifyIngredients('UNKNOWN_INGREDIENT');
      expect(unknown.length).toBe(1);
      expect(unknown[0].sources).toBeDefined();
      expect(unknown[0].sources[0].type).toBe('COSING');
    });
  });

  describe('calculateScore', () => {
    it('should give 100 for all LOW risk ingredients', () => {
      const ingredients = [{ riskLevel: 'LOW' }, { riskLevel: 'LOW' }, { riskLevel: 'LOW' }];
      const { score, breakdown } = calculateScore(ingredients);
      expect(score).toBe(100);
      expect(breakdown.safeIngredients).toBe(3);
    });

    it('should give 50 for all MODERATE risk ingredients', () => {
      const ingredients = [{ riskLevel: 'MODERATE' }, { riskLevel: 'MODERATE' }];
      const { score } = calculateScore(ingredients);
      expect(score).toBe(50);
    });

    it('should give 0 for all HIGH risk ingredients', () => {
      const ingredients = [{ riskLevel: 'HIGH' }, { riskLevel: 'HIGH' }];
      const { score } = calculateScore(ingredients);
      expect(score).toBe(0);
    });

    it('should penalize RESTRICTED ingredients', () => {
      const ingredients = [{ riskLevel: 'LOW' }, { riskLevel: 'RESTRICTED' }];
      const { score } = calculateScore(ingredients);
      expect(score).toBeLessThan(50);
    });

    it('should heavily penalize PROHIBITED ingredients', () => {
      const ingredients = [{ riskLevel: 'LOW' }, { riskLevel: 'PROHIBITED' }];
      const { score } = calculateScore(ingredients);
      expect(score).toBeLessThan(25);
    });

    it('should calculate correct breakdown', () => {
      const ingredients = [
        { riskLevel: 'LOW' },
        { riskLevel: 'LOW' },
        { riskLevel: 'MODERATE' },
        { riskLevel: 'HIGH' },
        { riskLevel: 'RESTRICTED' },
      ];
      const { breakdown } = calculateScore(ingredients);
      expect(breakdown.safeIngredients).toBe(2);
      expect(breakdown.moderateIngredients).toBe(1);
      expect(breakdown.riskIngredients).toBe(1);
      expect(breakdown.restrictedIngredients).toBe(1);
      expect(breakdown.prohibitedIngredients).toBe(0);
    });

    it('should return 0 for empty array', () => {
      const { score } = calculateScore([]);
      expect(score).toBe(0);
    });
  });

  describe('generateWarnings', () => {
    it('should warn about PROHIBITED ingredients', () => {
      const ingredients = [{ inciName: 'TEST', riskLevel: 'PROHIBITED' }];
      const warnings = generateWarnings(ingredients);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].level).toBe('error');
      expect(warnings[0].message).toContain('interdite');
    });

    it('should warn about RESTRICTED ingredients', () => {
      const ingredients = [{ inciName: 'TEST', riskLevel: 'RESTRICTED' }];
      const warnings = generateWarnings(ingredients);
      const restrictedWarning = warnings.find((w) => w.message.includes('restrictions'));
      expect(restrictedWarning).toBeDefined();
      expect(restrictedWarning.level).toBe('warning');
    });

    it('should warn about parfum/fragrance', () => {
      const ingredients = [{ inciName: 'PARFUM', riskLevel: 'MODERATE' }];
      const warnings = generateWarnings(ingredients);
      const parfumWarning = warnings.find((w) => w.message.includes('parfum'));
      expect(parfumWarning).toBeDefined();
      expect(parfumWarning.level).toBe('info');
    });

    it('should return empty array for all safe ingredients', () => {
      const ingredients = [
        { inciName: 'AQUA', riskLevel: 'LOW' },
        { inciName: 'GLYCERIN', riskLevel: 'LOW' },
      ];
      const warnings = generateWarnings(ingredients);
      expect(warnings.length).toBe(0);
    });
  });

  describe('evaluateProduct', () => {
    it('should evaluate a simple product', () => {
      const result = evaluateProduct('Test Cream', 'Crème visage', 'AQUA, GLYCERIN, NIACINAMIDE');

      expect(result.product.name).toBe('Test Cream');
      expect(result.product.category).toBe('Crème visage');
      expect(result.product.ingredients.length).toBe(3);
      expect(result.score).toBeGreaterThan(0);
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.disclaimer).toBeDefined();
    });

    it('should include evaluation date', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA');
      expect(result.evaluationDate).toBeDefined();
      expect(new Date(result.evaluationDate)).toBeInstanceOf(Date);
    });

    it('should include official sources', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA, GLYCERIN');
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources.some((s) => s.type === 'COSING')).toBe(true);
      expect(result.sources.some((s) => s.type === 'EU_REGULATION')).toBe(true);
    });

    it('should include legal disclaimer', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA');
      expect(result.disclaimer).toContain('AVERTISSEMENT');
      expect(result.disclaimer).toContain('avis médical');
      expect(result.disclaimer).toContain('Données officielles');
    });

    it('should handle products with restricted ingredients', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA, PHENOXYETHANOL');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('should handle unknown ingredients safely', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA, UNKNOWN_INGREDIENT_XYZ');
      expect(result.product.ingredients.length).toBe(2);
      const unknownIngredient = result.product.ingredients.find(
        (i) => i.inciName === 'UNKNOWN_INGREDIENT_XYZ'
      );
      expect(unknownIngredient).toBeDefined();
      expect(unknownIngredient.riskLevel).toBe('MODERATE');
    });
  });

  describe('Data Integrity', () => {
    it('should only use official sources', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA, GLYCERIN');

      for (const source of result.sources) {
        expect(['COSING', 'ANSES', 'ECHA', 'EU_REGULATION']).toContain(source.type);
        expect(source.url).toBeTruthy();
        expect(source.name).toBeTruthy();
      }
    });

    it('should have valid regulatory references', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'PHENOXYETHANOL');
      const phenoxy = result.product.ingredients.find((i) => i.inciName === 'PHENOXYETHANOL');

      expect(phenoxy.regulatoryReferences).toBeDefined();
      expect(phenoxy.regulatoryReferences.length).toBeGreaterThan(0);
    });

    it('should not make medical claims in disclaimer', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA');
      const disclaimer = result.disclaimer.toLowerCase();

      // Vérifier que le disclaimer interdit les affirmations médicales
      expect(disclaimer).toContain('ne constitue pas');
      expect(disclaimer).toContain('avis médical');
    });

    it('should emphasize official data only', () => {
      const result = evaluateProduct('Test', 'Crème visage', 'AQUA');
      const disclaimer = result.disclaimer.toLowerCase();

      expect(disclaimer).toContain('données officielles');
      expect(disclaimer).toContain('aucune donnée fictive');
    });
  });
});
