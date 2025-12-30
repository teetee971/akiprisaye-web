/**
 * Service de gestion des entités légales (entreprises)
 *
 * Ce service gère les opérations CRUD sur les entités légales
 * avec validation stricte des identifiants SIREN/SIRET
 *
 * Conformité juridique:
 * - Validation selon le Décret n°82-130 du 9 février 1982
 * - Respect du RGPD (Règlement UE 2016/679)
 * - Données publiques issues du Répertoire SIRENE (Open Data INSEE)
 *
 * Base légale RGPD:
 * - Article 6.1.e: mission d'intérêt public
 * - Les numéros SIREN/SIRET sont des données publiques
 */

import { PrismaClient, LegalEntity, EntityStatus } from '@prisma/client';
import type {
  CreateLegalEntityInput,
  UpdateLegalEntityInput,
  SearchLegalEntityInput,
} from '@validators/legalEntitySchemas';

export class LegalEntityService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Crée une nouvelle entité légale
   *
   * Validation automatique via Prisma et schémas Zod
   *
   * @param data - Données de l'entité à créer
   * @returns L'entité légale créée
   * @throws Error si le SIREN ou SIRET existe déjà
   *
   * RGPD: Traçabilité via createdAt/updatedAt (Art. 5.2)
   */
  async create(data: CreateLegalEntityInput): Promise<LegalEntity> {
    // Vérification de l'unicité du SIREN
    const existingSiren = await this.prisma.legalEntity.findUnique({
      where: { siren: data.siren },
    });

    if (existingSiren) {
      throw new Error(`Une entité avec le SIREN ${data.siren} existe déjà`);
    }

    // Vérification de l'unicité du SIRET
    const existingSiret = await this.prisma.legalEntity.findUnique({
      where: { siret: data.siret },
    });

    if (existingSiret) {
      throw new Error(`Une entité avec le SIRET ${data.siret} existe déjà`);
    }

    // Création de l'entité
    return await this.prisma.legalEntity.create({
      data: {
        siren: data.siren,
        siret: data.siret,
        name: data.name,
        status: data.status || 'ACTIVE',
      },
    });
  }

  /**
   * Récupère une entité légale par son ID
   *
   * @param id - Identifiant UUID de l'entité
   * @returns L'entité légale ou null si non trouvée
   */
  async findById(id: string): Promise<LegalEntity | null> {
    return await this.prisma.legalEntity.findUnique({
      where: { id },
    });
  }

  /**
   * Récupère une entité légale par son SIREN
   *
   * @param siren - Numéro SIREN (9 chiffres)
   * @returns L'entité légale ou null si non trouvée
   */
  async findBySiren(siren: string): Promise<LegalEntity | null> {
    return await this.prisma.legalEntity.findUnique({
      where: { siren },
    });
  }

  /**
   * Récupère une entité légale par son SIRET
   *
   * @param siret - Numéro SIRET (14 chiffres)
   * @returns L'entité légale ou null si non trouvée
   */
  async findBySiret(siret: string): Promise<LegalEntity | null> {
    return await this.prisma.legalEntity.findUnique({
      where: { siret },
    });
  }

  /**
   * Recherche des entités légales selon des critères
   *
   * @param criteria - Critères de recherche
   * @returns Liste des entités correspondantes
   */
  async search(criteria: SearchLegalEntityInput): Promise<LegalEntity[]> {
    const where: {
      siren?: string;
      siret?: string;
      name?: { contains: string; mode: 'insensitive' };
      status?: EntityStatus;
    } = {};

    if (criteria.siren) {
      where.siren = criteria.siren;
    }

    if (criteria.siret) {
      where.siret = criteria.siret;
    }

    if (criteria.name) {
      // Recherche insensible à la casse et partielle
      where.name = {
        contains: criteria.name,
        mode: 'insensitive',
      };
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    return await this.prisma.legalEntity.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Liste toutes les entités légales avec pagination
   *
   * @param skip - Nombre d'entités à sauter
   * @param take - Nombre d'entités à retourner
   * @returns Liste paginée des entités
   */
  async findAll(skip = 0, take = 50): Promise<LegalEntity[]> {
    return await this.prisma.legalEntity.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Met à jour une entité légale
   *
   * @param id - Identifiant UUID de l'entité
   * @param data - Données à mettre à jour
   * @returns L'entité mise à jour
   * @throws Error si l'entité n'existe pas ou si le SIREN/SIRET est déjà utilisé
   *
   * RGPD: Mise à jour automatique de updatedAt (Art. 5.1.d - exactitude)
   */
  async update(id: string, data: UpdateLegalEntityInput): Promise<LegalEntity> {
    // Vérification de l'existence
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entité avec l'ID ${id} non trouvée`);
    }

    // Vérification de l'unicité du SIREN si modifié
    if (data.siren && data.siren !== existing.siren) {
      const existingSiren = await this.findBySiren(data.siren);
      if (existingSiren) {
        throw new Error(`Une entité avec le SIREN ${data.siren} existe déjà`);
      }
    }

    // Vérification de l'unicité du SIRET si modifié
    if (data.siret && data.siret !== existing.siret) {
      const existingSiret = await this.findBySiret(data.siret);
      if (existingSiret) {
        throw new Error(`Une entité avec le SIRET ${data.siret} existe déjà`);
      }
    }

    return await this.prisma.legalEntity.update({
      where: { id },
      data,
    });
  }

  /**
   * Marque une entité comme cessée (soft delete)
   *
   * Conforme au RGPD: conservation des données pour obligations légales
   * (Art. 6.1.c - obligation légale, Art. 17.3.b - archivage d'intérêt public)
   *
   * @param id - Identifiant UUID de l'entité
   * @returns L'entité mise à jour
   */
  async markAsCeased(id: string): Promise<LegalEntity> {
    return await this.update(id, { status: 'CEASED' });
  }

  /**
   * Supprime définitivement une entité légale
   *
   * ATTENTION: Cette opération est irréversible
   * À n'utiliser que pour le droit à l'effacement (RGPD Art. 17)
   * ou en cas de données erronées
   *
   * @param id - Identifiant UUID de l'entité
   * @returns L'entité supprimée
   */
  async delete(id: string): Promise<LegalEntity> {
    return await this.prisma.legalEntity.delete({
      where: { id },
    });
  }

  /**
   * Compte le nombre total d'entités légales
   *
   * @param status - Filtrer par statut (optionnel)
   * @returns Nombre d'entités
   */
  async count(status?: EntityStatus): Promise<number> {
    return await this.prisma.legalEntity.count({
      where: status ? { status } : undefined,
    });
  }

  /**
   * Récupère les statistiques des entités légales
   *
   * @returns Statistiques (total, actives, cessées)
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    ceased: number;
  }> {
    const [total, active, ceased] = await Promise.all([
      this.count(),
      this.count('ACTIVE'),
      this.count('CEASED'),
    ]);

    return {
      total,
      active,
      ceased,
    };
  }
}
