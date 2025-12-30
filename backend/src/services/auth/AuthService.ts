/**
 * Service d'authentification
 *
 * Gère l'authentification des utilisateurs avec JWT
 * - Login (email + mot de passe)
 * - Refresh token
 * - Logout (révocation refresh token)
 * - Gestion des refresh tokens en base
 *
 * Conformité RGPD:
 * - Minimisation des données dans les tokens
 * - Traçabilité des connexions (lastLogin)
 * - Révocation possible des tokens
 */

import { PrismaClient, User, RefreshToken } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../../security/password.js';
import {
  generateTokenPair,
  verifyRefreshToken,
} from '../../security/jwt.js';

export class AuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Authentifie un utilisateur avec email et mot de passe
   *
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe en clair
   * @returns User et tokens JWT (access + refresh)
   * @throws Error si identifiants invalides
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Rechercher l'utilisateur par email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Générer les tokens JWT
    const tokens = generateTokenPair(user.id, user.email);

    // Stocker le refresh token en base (hash SHA-256)
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Mettre à jour lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Retourner user sans le passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Rafraîchit l'access token avec un refresh token valide
   *
   * @param refreshToken - Refresh token JWT
   * @returns Nouveaux tokens (access + refresh)
   * @throws Error si refresh token invalide ou révoqué
   *
   * Note: Rotation des refresh tokens - l'ancien est révoqué
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Vérifier et décoder le refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Hasher le token pour recherche en base
    const tokenHash = this.hashToken(refreshToken);

    // Vérifier si le token existe et n'est pas révoqué
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new Error('Refresh token invalide');
    }

    if (storedToken.isRevoked) {
      throw new Error('Refresh token révoqué');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expiré');
    }

    // Vérifier que l'utilisateur existe et est actif
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new Error('Utilisateur invalide ou désactivé');
    }

    // Révoquer l'ancien refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Générer de nouveaux tokens (rotation)
    const newTokens = generateTokenPair(user.id, user.email);

    // Stocker le nouveau refresh token
    await this.storeRefreshToken(user.id, newTokens.refreshToken);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  /**
   * Déconnecte un utilisateur (révoque refresh token)
   *
   * @param refreshToken - Refresh token à révoquer
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    // Révoquer le token (si existe)
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * Crée un nouvel utilisateur
   *
   * @param email - Email unique
   * @param password - Mot de passe (sera hashé)
   * @param name - Nom complet
   * @returns Utilisateur créé (sans password)
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<Omit<User, 'passwordHash'>> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Retourner sans passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Stocke un refresh token en base (hashé)
   *
   * @param userId - ID utilisateur
   * @param refreshToken - Refresh token JWT
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    // Calculer la date d'expiration (7 jours par défaut)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Hash un token avec SHA-256
   *
   * @param token - Token à hasher
   * @returns Hash hexadécimal
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Nettoie les refresh tokens expirés
   *
   * À exécuter périodiquement (cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });

    return result.count;
  }

  /**
   * Révoque tous les refresh tokens d'un utilisateur
   *
   * Utile pour déconnexion globale ou changement de mot de passe
   *
   * @param userId - ID utilisateur
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
