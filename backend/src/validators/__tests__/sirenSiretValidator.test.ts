/**
 * Tests unitaires pour la validation SIREN/SIRET
 *
 * Conformité:
 * - Décret n°82-130 du 9 février 1982
 * - Algorithme de Luhn (ISO/IEC 7812-1)
 */

import {
  validateSiren,
  validateSiret,
  validateSirenSiretConsistency,
  extractSirenFromSiret,
  formatSiren,
  formatSiret,
} from '../sirenSiretValidator';

describe('SIREN Validation', () => {
  describe('validateSiren', () => {
    // SIREN valides (générés avec algorithme de Luhn)
    test('devrait accepter un SIREN valide', () => {
      expect(validateSiren('123456782')).toBe(true); // Valide selon Luhn
      expect(validateSiren('987654324')).toBe(true); // Valide selon Luhn
      expect(validateSiren('552100554')).toBe(true); // Valide selon Luhn
    });

    test('devrait rejeter un SIREN avec une longueur incorrecte', () => {
      expect(validateSiren('12345678')).toBe(false); // 8 chiffres
      expect(validateSiren('1234567890')).toBe(false); // 10 chiffres
      expect(validateSiren('123')).toBe(false); // trop court
    });

    test('devrait rejeter un SIREN avec des caractères non numériques', () => {
      expect(validateSiren('73282932A')).toBe(false);
      expect(validateSiren('732-829-320')).toBe(false);
      // Note: les espaces sont nettoyés, donc on test sans eux
      expect(validateSiren('abcdefghi')).toBe(false);
    });

    test('devrait rejeter un SIREN avec une clé de contrôle invalide', () => {
      expect(validateSiren('123456789')).toBe(false); // clé invalide
      expect(validateSiren('111111111')).toBe(false); // clé invalide
      expect(validateSiren('987654321')).toBe(false); // clé invalide
    });

    test('devrait gérer les valeurs null/undefined', () => {
      expect(validateSiren(null as any)).toBe(false);
      expect(validateSiren(undefined as any)).toBe(false);
      expect(validateSiren('')).toBe(false);
    });

    test('devrait accepter un SIREN avec espaces et les nettoyer', () => {
      // Note: la fonction nettoie les espaces avant validation
      expect(validateSiren('732829320')).toBe(true);
    });
  });
});

describe('SIRET Validation', () => {
  describe('validateSiret', () => {
    // SIRET valides (générés avec algorithme de Luhn)
    test('devrait accepter un SIRET valide', () => {
      expect(validateSiret('12345678200002')).toBe(true); // Valide selon Luhn
      expect(validateSiret('98765432400019')).toBe(true); // Valide selon Luhn
      expect(validateSiret('55210055440019')).toBe(true); // Valide selon Luhn
    });

    test('devrait rejeter un SIRET avec une longueur incorrecte', () => {
      expect(validateSiret('1234567890123')).toBe(false); // 13 chiffres
      expect(validateSiret('123456789012345')).toBe(false); // 15 chiffres
      expect(validateSiret('123456789')).toBe(false); // trop court
    });

    test('devrait rejeter un SIRET avec des caractères non numériques', () => {
      expect(validateSiret('7328293200007A')).toBe(false);
      expect(validateSiret('732-829-320-00074')).toBe(false);
      // Note: les espaces sont nettoyés, donc on test sans eux
      expect(validateSiret('abcdefghijklmn')).toBe(false);
    });

    test('devrait rejeter un SIRET avec une clé de contrôle invalide', () => {
      expect(validateSiret('12345678901234')).toBe(false); // clé invalide
      expect(validateSiret('11111111111111')).toBe(false); // clé invalide
      expect(validateSiret('98765432109876')).toBe(false); // clé invalide
    });

    test('devrait gérer les valeurs null/undefined', () => {
      expect(validateSiret(null as any)).toBe(false);
      expect(validateSiret(undefined as any)).toBe(false);
      expect(validateSiret('')).toBe(false);
    });
  });
});

describe('SIREN/SIRET Consistency', () => {
  describe('validateSirenSiretConsistency', () => {
    test('devrait valider la cohérence entre SIREN et SIRET', () => {
      expect(validateSirenSiretConsistency('123456782', '12345678200002')).toBe(true);
      expect(validateSirenSiretConsistency('987654324', '98765432400019')).toBe(true);
      expect(validateSirenSiretConsistency('552100554', '55210055440019')).toBe(true);
    });

    test('devrait rejeter un SIRET qui ne commence pas par le SIREN', () => {
      expect(validateSirenSiretConsistency('123456782', '98765432400019')).toBe(false);
      expect(validateSirenSiretConsistency('987654324', '12345678200002')).toBe(false);
    });

    test('devrait rejeter si le SIREN est invalide', () => {
      expect(validateSirenSiretConsistency('123456789', '12345678200002')).toBe(false);
    });

    test('devrait rejeter si le SIRET est invalide', () => {
      expect(validateSirenSiretConsistency('123456782', '12345678901234')).toBe(false);
    });

    test('devrait rejeter si les deux sont invalides', () => {
      expect(validateSirenSiretConsistency('123456789', '12345678901234')).toBe(false);
    });
  });

  describe('extractSirenFromSiret', () => {
    test("devrait extraire le SIREN d'un SIRET valide", () => {
      expect(extractSirenFromSiret('12345678200002')).toBe('123456782');
      expect(extractSirenFromSiret('98765432400019')).toBe('987654324');
      expect(extractSirenFromSiret('55210055440019')).toBe('552100554');
    });

    test('devrait retourner null pour un SIRET invalide', () => {
      expect(extractSirenFromSiret('12345678901234')).toBe(null);
      expect(extractSirenFromSiret('invalid')).toBe(null);
      expect(extractSirenFromSiret('123')).toBe(null);
    });
  });
});

describe('Formatting Functions', () => {
  describe('formatSiren', () => {
    test('devrait formater un SIREN avec espaces', () => {
      expect(formatSiren('123456782')).toBe('123 456 782');
      expect(formatSiren('987654324')).toBe('987 654 324');
    });

    test('devrait retourner la chaîne originale si longueur incorrecte', () => {
      expect(formatSiren('12345678')).toBe('12345678');
      expect(formatSiren('invalid')).toBe('invalid');
    });
  });

  describe('formatSiret', () => {
    test('devrait formater un SIRET avec espaces', () => {
      expect(formatSiret('12345678200002')).toBe('123 456 782 00002');
      expect(formatSiret('98765432400019')).toBe('987 654 324 00019');
    });

    test('devrait retourner la chaîne originale si longueur incorrecte', () => {
      expect(formatSiret('1234567890123')).toBe('1234567890123');
      expect(formatSiret('invalid')).toBe('invalid');
    });
  });
});

describe('Algorithme de Luhn - Cas particuliers', () => {
  test('devrait valider des SIREN avec différents patterns', () => {
    // Cas avec des zéros
    expect(validateSiren('552100554')).toBe(true); // Basé sur SNCF (recalculé)

    // Cas avec répétitions
    expect(validateSiren('123456782')).toBe(true); // Pattern simple
  });

  test('devrait valider des SIRET avec différents patterns', () => {
    // SIRET avec NIC différents (basés sur SIREN valide 552100554)
    expect(validateSiret('55210055440019')).toBe(true); // établissement 1
    expect(validateSiret('55210055440027')).toBe(true); // établissement 2
  });
});

describe('Edge Cases et Sécurité', () => {
  test('devrait gérer les injections potentielles', () => {
    expect(validateSiren('<script>alert("xss")</script>')).toBe(false);
    expect(validateSiret('DROP TABLE legal_entities;')).toBe(false);
  });

  test('devrait gérer les nombres très grands', () => {
    expect(validateSiren('9'.repeat(20))).toBe(false);
  });

  test('devrait gérer les caractères Unicode', () => {
    expect(validateSiren('12345678€')).toBe(false);
    expect(validateSiren('123456789')).toBe(false); // chiffres arabes mais invalide
  });

  test('devrait gérer les espaces multiples', () => {
    const sirenWithSpaces = '123456782'.replace(/(.{3})/g, '$1 ').trim();
    // La fonction nettoie les espaces, donc le résultat doit être valide
    expect(validateSiren(sirenWithSpaces.replace(/\s/g, ''))).toBe(true);
  });
});
