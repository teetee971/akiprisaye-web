/**
 * Schémas de validation Zod pour les entités légales
 *
 * Conformité RGPD:
 * - Minimisation des données (Art. 5.1.c)
 * - Exactitude des données (Art. 5.1.d)
 * - Limitation de la conservation (Art. 5.1.e)
 */

import { z } from 'zod';
import {
  validateSiren,
  validateSiret,
  validateSirenSiretConsistency,
} from './sirenSiretValidator.js';

/**
 * Validation du format SIREN (9 chiffres)
 * Inclut la vérification de l'algorithme de Luhn
 */
export const sirenSchema = z
  .string()
  .trim()
  .length(9, 'Le SIREN doit contenir exactement 9 chiffres')
  .regex(/^\d{9}$/, 'Le SIREN ne doit contenir que des chiffres')
  .refine(
    (siren) => validateSiren(siren),
    'Le SIREN est invalide (vérification de la clé de contrôle échouée)'
  );

/**
 * Validation du format SIRET (14 chiffres)
 * Inclut la vérification de l'algorithme de Luhn
 */
export const siretSchema = z
  .string()
  .trim()
  .length(14, 'Le SIRET doit contenir exactement 14 chiffres')
  .regex(/^\d{14}$/, 'Le SIRET ne doit contenir que des chiffres')
  .refine(
    (siret) => validateSiret(siret),
    'Le SIRET est invalide (vérification de la clé de contrôle échouée)'
  );

/**
 * Énumération des statuts d'entité légale
 */
export const entityStatusSchema = z.enum(['ACTIVE', 'CEASED'], {
  errorMap: () => ({ message: 'Le statut doit être ACTIVE ou CEASED' }),
});

/**
 * Schéma complet de création d'une entité légale
 *
 * Validation stricte:
 * - SIREN: 9 chiffres + algorithme de Luhn
 * - SIRET: 14 chiffres + algorithme de Luhn
 * - Cohérence SIREN/SIRET: le SIRET doit commencer par le SIREN
 * - Nom: obligatoire, 1-255 caractères
 * - Statut: ACTIVE ou CEASED
 */
export const createLegalEntitySchema = z
  .object({
    siren: sirenSchema,
    siret: siretSchema,
    name: z
      .string()
      .trim()
      .min(1, "Le nom de l'entreprise est obligatoire")
      .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
    status: entityStatusSchema.default('ACTIVE'),
  })
  .refine((data) => validateSirenSiretConsistency(data.siren, data.siret), {
    message: 'Le SIRET doit commencer par le SIREN (incohérence détectée)',
    path: ['siret'],
  });

/**
 * Schéma de mise à jour d'une entité légale
 *
 * Tous les champs sont optionnels, mais s'ils sont présents,
 * ils doivent respecter les mêmes règles de validation
 */
export const updateLegalEntitySchema = z
  .object({
    siren: sirenSchema.optional(),
    siret: siretSchema.optional(),
    name: z
      .string()
      .trim()
      .min(1, "Le nom de l'entreprise ne peut pas être vide")
      .max(255, 'Le nom ne peut pas dépasser 255 caractères')
      .optional(),
    status: entityStatusSchema.optional(),
  })
  .refine(
    (data) => {
      // Si SIREN et SIRET sont tous deux présents, vérifier la cohérence
      if (data.siren && data.siret) {
        return validateSirenSiretConsistency(data.siren, data.siret);
      }
      return true;
    },
    {
      message: 'Le SIRET doit commencer par le SIREN (incohérence détectée)',
      path: ['siret'],
    }
  );

/**
 * Schéma de requête de recherche d'entité légale
 */
export const searchLegalEntitySchema = z.object({
  siren: sirenSchema.optional(),
  siret: siretSchema.optional(),
  name: z.string().trim().min(1).optional(),
  status: entityStatusSchema.optional(),
});

/**
 * Types TypeScript dérivés des schémas Zod
 */
export type CreateLegalEntityInput = z.infer<typeof createLegalEntitySchema>;
export type UpdateLegalEntityInput = z.infer<typeof updateLegalEntitySchema>;
export type SearchLegalEntityInput = z.infer<typeof searchLegalEntitySchema>;
