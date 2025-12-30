/**
 * Tests unitaires pour les schémas de validation Zod
 */

import { z } from 'zod';
import {
  sirenSchema,
  siretSchema,
  entityStatusSchema,
  createLegalEntitySchema,
  updateLegalEntitySchema,
  searchLegalEntitySchema,
} from '../legalEntitySchemas';

describe('Zod Schema Validation', () => {
  describe('sirenSchema', () => {
    test('devrait accepter un SIREN valide', () => {
      expect(() => sirenSchema.parse('123456782')).not.toThrow();
      expect(() => sirenSchema.parse('987654324')).not.toThrow();
    });

    test('devrait rejeter un SIREN invalide', () => {
      expect(() => sirenSchema.parse('123456789')).toThrow();
      expect(() => sirenSchema.parse('12345678')).toThrow();
      expect(() => sirenSchema.parse('abcdefghi')).toThrow();
    });

    test('devrait nettoyer les espaces', () => {
      const result = sirenSchema.parse('  123456782  ');
      expect(result).toBe('123456782');
    });
  });

  describe('siretSchema', () => {
    test('devrait accepter un SIRET valide', () => {
      expect(() => siretSchema.parse('12345678200002')).not.toThrow();
      expect(() => siretSchema.parse('98765432400019')).not.toThrow();
    });

    test('devrait rejeter un SIRET invalide', () => {
      expect(() => siretSchema.parse('12345678901234')).toThrow();
      expect(() => siretSchema.parse('1234567890123')).toThrow();
      expect(() => siretSchema.parse('abcdefghijklmn')).toThrow();
    });

    test('devrait nettoyer les espaces', () => {
      const result = siretSchema.parse('  12345678200002  ');
      expect(result).toBe('12345678200002');
    });
  });

  describe('entityStatusSchema', () => {
    test('devrait accepter les statuts valides', () => {
      expect(() => entityStatusSchema.parse('ACTIVE')).not.toThrow();
      expect(() => entityStatusSchema.parse('CEASED')).not.toThrow();
    });

    test('devrait rejeter les statuts invalides', () => {
      expect(() => entityStatusSchema.parse('INVALID')).toThrow();
      expect(() => entityStatusSchema.parse('active')).toThrow(); // case sensitive
      expect(() => entityStatusSchema.parse('')).toThrow();
    });
  });

  describe('createLegalEntitySchema', () => {
    const validData = {
      siren: '123456782',
      siret: '12345678200002',
      name: 'Facebook France',
      status: 'ACTIVE' as const,
    };

    test('devrait accepter des données valides', () => {
      const result = createLegalEntitySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    test('devrait accepter des données sans statut (défaut ACTIVE)', () => {
      const data = {
        siren: '123456782',
        siret: '12345678200002',
        name: 'Facebook France',
      };
      const result = createLegalEntitySchema.parse(data);
      expect(result.status).toBe('ACTIVE');
    });

    test('devrait rejeter si SIREN invalide', () => {
      const data = { ...validData, siren: '123456789' };
      expect(() => createLegalEntitySchema.parse(data)).toThrow();
    });

    test('devrait rejeter si SIRET invalide', () => {
      const data = { ...validData, siret: '12345678901234' };
      expect(() => createLegalEntitySchema.parse(data)).toThrow();
    });

    test('devrait rejeter si SIREN et SIRET incohérents', () => {
      const data = {
        siren: '123456782',
        siret: '98765432400019', // SIRET de différente entreprise
        name: 'Test',
        status: 'ACTIVE' as const,
      };
      expect(() => createLegalEntitySchema.parse(data)).toThrow();
    });

    test('devrait rejeter si le nom est vide', () => {
      const data = { ...validData, name: '' };
      expect(() => createLegalEntitySchema.parse(data)).toThrow();
    });

    test('devrait rejeter si le nom est trop long', () => {
      const data = { ...validData, name: 'a'.repeat(256) };
      expect(() => createLegalEntitySchema.parse(data)).toThrow();
    });

    test('devrait nettoyer les espaces du nom', () => {
      const data = { ...validData, name: '  Facebook France  ' };
      const result = createLegalEntitySchema.parse(data);
      expect(result.name).toBe('Facebook France');
    });
  });

  describe('updateLegalEntitySchema', () => {
    test('devrait accepter des mises à jour partielles', () => {
      expect(() => updateLegalEntitySchema.parse({ name: 'New Name' })).not.toThrow();
      expect(() => updateLegalEntitySchema.parse({ status: 'CEASED' })).not.toThrow();
    });

    test('devrait accepter un objet vide', () => {
      expect(() => updateLegalEntitySchema.parse({})).not.toThrow();
    });

    test('devrait valider SIREN si présent', () => {
      expect(() => updateLegalEntitySchema.parse({ siren: '123456782' })).not.toThrow();
      expect(() => updateLegalEntitySchema.parse({ siren: '123456789' })).toThrow();
    });

    test('devrait valider SIRET si présent', () => {
      expect(() => updateLegalEntitySchema.parse({ siret: '12345678200002' })).not.toThrow();
      expect(() => updateLegalEntitySchema.parse({ siret: '12345678901234' })).toThrow();
    });

    test('devrait vérifier la cohérence SIREN/SIRET si les deux sont présents', () => {
      const validData = {
        siren: '123456782',
        siret: '12345678200002',
      };
      expect(() => updateLegalEntitySchema.parse(validData)).not.toThrow();

      const invalidData = {
        siren: '123456782',
        siret: '98765432400019',
      };
      expect(() => updateLegalEntitySchema.parse(invalidData)).toThrow();
    });

    test('devrait rejeter un nom vide si présent', () => {
      expect(() => updateLegalEntitySchema.parse({ name: '' })).toThrow();
      expect(() => updateLegalEntitySchema.parse({ name: '  ' })).toThrow();
    });
  });

  describe('searchLegalEntitySchema', () => {
    test('devrait accepter des critères de recherche valides', () => {
      expect(() => searchLegalEntitySchema.parse({ siren: '732829320' })).not.toThrow();
      expect(() => searchLegalEntitySchema.parse({ siret: '73282932000074' })).not.toThrow();
      expect(() => searchLegalEntitySchema.parse({ name: 'Facebook' })).not.toThrow();
      expect(() => searchLegalEntitySchema.parse({ status: 'ACTIVE' })).not.toThrow();
    });

    test('devrait accepter une recherche vide', () => {
      expect(() => searchLegalEntitySchema.parse({})).not.toThrow();
    });

    test('devrait accepter plusieurs critères', () => {
      const criteria = {
        name: 'Facebook',
        status: 'ACTIVE' as const,
      };
      expect(() => searchLegalEntitySchema.parse(criteria)).not.toThrow();
    });

    test('devrait valider SIREN si présent', () => {
      expect(() => searchLegalEntitySchema.parse({ siren: '123456789' })).toThrow();
    });

    test('devrait valider SIRET si présent', () => {
      expect(() => searchLegalEntitySchema.parse({ siret: '12345678901234' })).toThrow();
    });
  });

  describe("Messages d'erreur", () => {
    test("devrait fournir des messages d'erreur clairs pour SIREN", () => {
      try {
        sirenSchema.parse('12345678');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain('9 chiffres');
      }
    });

    test("devrait fournir des messages d'erreur clairs pour SIRET", () => {
      try {
        siretSchema.parse('1234567890123');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain('14 chiffres');
      }
    });

    test("devrait fournir un message d'erreur pour incohérence SIREN/SIRET", () => {
      try {
        createLegalEntitySchema.parse({
          siren: '123456782',
          siret: '98765432400019',
          name: 'Test',
          status: 'ACTIVE',
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        const consistencyError = zodError.errors.find(
          (e) => e.path.includes('siret') && e.message.includes('incohérence')
        );
        expect(consistencyError).toBeDefined();
      }
    });
  });
});
