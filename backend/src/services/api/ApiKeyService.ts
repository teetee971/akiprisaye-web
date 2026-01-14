/**
 * Service de gestion des API Keys
 * 
 * Fonctionnalités:
 * - Génération de clés API sécurisées
 * - Vérification et authentification
 * - Tracking d'usage
 * - Gestion du cycle de vie (révocation, expiration)
 * - Statistiques d'utilisation
 * 
 * Sécurité:
 * - Clés hashées avec bcrypt
 * - Préfixe visible pour identification
 * - Rate limiting par clé
 * - Révocation instantanée
 * 
 * RGPD: Art. 32 - Sécurité du traitement
 */

import { PrismaClient, ApiKey, ApiKeyStatus, ApiPermission, SubscriptionTier } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKeyWithSecret, UsageStats, SUBSCRIPTION_PLANS, DEFAULT_PERMISSIONS } from '../../types/api.js';

export class ApiKeyService {
  private prisma: PrismaClient;
  private readonly API_KEY_PREFIX = 'akp_live_';
  private readonly BCRYPT_ROUNDS = 10;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Génère une nouvelle API key pour un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @param name - Nom descriptif de la clé
   * @param permissions - Permissions personnalisées (optionnel)
   * @param expiresIn - Durée de validité en jours (optionnel)
   * @returns API Key avec la clé secrète (affichée une seule fois)
   */
  async generateApiKey(
    userId: string,
    name: string,
    permissions?: ApiPermission[],
    expiresIn?: number
  ): Promise<ApiKeyWithSecret> {
    // Récupérer l'utilisateur et son niveau d'abonnement
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier le nombre de clés existantes
    const existingKeysCount = await this.prisma.apiKey.count({
      where: {
        userId,
        status: ApiKeyStatus.ACTIVE,
      },
    });

    const plan = SUBSCRIPTION_PLANS[user.subscriptionTier];
    if (existingKeysCount >= plan.features.apiKeysCount) {
      throw new Error(
        `Limite de clés API atteinte (${plan.features.apiKeysCount}). ` +
        `Veuillez mettre à niveau votre abonnement ou révoquer une clé existante.`
      );
    }

    // Générer la clé secrète
    const secret = crypto.randomBytes(32).toString('hex');
    const key = `${this.API_KEY_PREFIX}${secret}`;

    // Hasher la clé pour stockage
    const keyHash = await bcrypt.hash(key, this.BCRYPT_ROUNDS);

    // Déterminer les permissions (utiliser les permissions par défaut si non spécifiées)
    const defaultPermissions = this.getDefaultPermissions(user.subscriptionTier);
    const finalPermissions = permissions || defaultPermissions;

    // Valider que l'utilisateur a le droit d'accorder ces permissions
    if (!this.canGrantPermissions(user.subscriptionTier, finalPermissions)) {
      throw new Error('Permissions non autorisées pour votre niveau d\'abonnement');
    }

    // Calculer les rate limits selon l'abonnement
    const rateLimits = this.getRateLimits(user.subscriptionTier);

    // Calculer la date d'expiration si spécifiée
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // Créer la clé en base de données
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash,
        prefix: this.API_KEY_PREFIX,
        permissions: finalPermissions,
        rateLimitDay: rateLimits.requestsPerDay,
        rateLimitHour: rateLimits.requestsPerHour,
        rateLimitMinute: rateLimits.requestsPerMinute,
        status: ApiKeyStatus.ACTIVE,
        expiresAt,
      },
    });

    // Retourner la clé avec le secret (affiché une seule fois)
    return {
      ...apiKey,
      secret: key,
    };
  }

  /**
   * Vérifie et authentifie une API key
   * 
   * @param key - Clé API complète (avec préfixe)
   * @returns Informations de la clé API
   * @throws Error si la clé est invalide, révoquée ou expirée
   */
  async verifyApiKey(key: string): Promise<ApiKey> {
    // Vérifier le format
    if (!key.startsWith(this.API_KEY_PREFIX)) {
      throw new Error('Format de clé API invalide');
    }

    // Récupérer toutes les clés actives avec ce préfixe
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        prefix: this.API_KEY_PREFIX,
        status: ApiKeyStatus.ACTIVE,
      },
    });

    // Comparer le hash
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.keyHash);

      if (isValid) {
        // Vérifier l'expiration
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          // Marquer comme expirée
          await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { status: ApiKeyStatus.EXPIRED },
          });
          throw new Error('Clé API expirée');
        }

        // Mettre à jour la date de dernière utilisation
        await this.prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });

        return apiKey;
      }
    }

    throw new Error('Clé API invalide');
  }

  /**
   * Révoque une API key
   * 
   * @param keyId - ID de la clé à révoquer
   * @param userId - ID de l'utilisateur (pour vérifier la propriété)
   */
  async revokeApiKey(keyId: string, userId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new Error('Clé API non trouvée');
    }

    if (apiKey.userId !== userId) {
      throw new Error('Vous n\'avez pas les droits pour révoquer cette clé');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { status: ApiKeyStatus.REVOKED },
    });
  }

  /**
   * Liste toutes les API keys d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Liste des clés (sans les secrets)
   */
  async listApiKeys(userId: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Retirer le keyHash des résultats
    return apiKeys.map(({ keyHash: _, ...apiKey }) => apiKey);
  }

  /**
   * Enregistre l'utilisation d'une API key
   * 
   * @param apiKeyId - ID de la clé API
   * @param endpoint - Endpoint appelé
   * @param method - Méthode HTTP
   * @param statusCode - Code de statut HTTP
   * @param responseTime - Temps de réponse en ms
   * @param clientIp - IP du client (optionnel)
   */
  async trackUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    clientIp?: string
  ): Promise<void> {
    await this.prisma.apiUsage.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTime,
        clientIp,
      },
    });
  }

  /**
   * Récupère les statistiques d'usage d'une API key
   * 
   * @param apiKeyId - ID de la clé API
   * @param period - Période ('day', 'week', 'month')
   * @returns Statistiques d'utilisation
   */
  async getUsageStats(
    apiKeyId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<UsageStats> {
    const startDate = this.getStartDate(period);

    // Statistiques par endpoint
    const byEndpoint = await this.prisma.apiUsage.groupBy({
      by: ['endpoint'],
      where: {
        apiKeyId,
        timestamp: { gte: startDate },
      },
      _count: true,
      _avg: {
        responseTime: true,
      },
    });

    // Total des requêtes
    const totalRequests = await this.prisma.apiUsage.count({
      where: {
        apiKeyId,
        timestamp: { gte: startDate },
      },
    });

    return {
      totalRequests,
      period,
      byEndpoint,
    };
  }

  /**
   * Nettoie les anciennes entrées d'usage (> 90 jours)
   * À exécuter périodiquement (cron job)
   * 
   * @returns Nombre d'entrées supprimées
   */
  async cleanupOldUsage(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await this.prisma.apiUsage.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Obtient les permissions par défaut selon le niveau d'abonnement
   */
  private getDefaultPermissions(tier: SubscriptionTier): ApiPermission[] {
    return DEFAULT_PERMISSIONS[tier];
  }

  /**
   * Vérifie si un utilisateur peut accorder certaines permissions
   */
  private canGrantPermissions(
    tier: SubscriptionTier,
    permissions: ApiPermission[]
  ): boolean {
    const allowedPermissions = this.getDefaultPermissions(tier);
    
    // Vérifier que toutes les permissions demandées sont autorisées
    return permissions.every(p => allowedPermissions.includes(p));
  }

  /**
   * Calcule les rate limits selon le niveau d'abonnement
   */
  private getRateLimits(tier: SubscriptionTier) {
    const plan = SUBSCRIPTION_PLANS[tier];
    const dailyLimit = plan.features.apiRateLimit;

    return {
      requestsPerDay: dailyLimit,
      requestsPerHour: Math.floor(dailyLimit / 24),
      requestsPerMinute: Math.floor(dailyLimit / 1440),
    };
  }

  /**
   * Calcule la date de début selon la période
   */
  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        now.setHours(0, 0, 0, 0);
        return now;
      case 'week':
        now.setDate(now.getDate() - 7);
        now.setHours(0, 0, 0, 0);
        return now;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        now.setHours(0, 0, 0, 0);
        return now;
      default:
        return now;
    }
  }
}
