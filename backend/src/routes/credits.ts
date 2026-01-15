/**
 * Routes pour le système de crédits, marketplace et gamification
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { Router } from 'express';
import * as creditsController from '../controllers/credits/creditsController.js';
import * as marketplaceController from '../controllers/credits/marketplaceController.js';
import * as gamificationController from '../controllers/credits/gamificationController.js';

const router = Router();

// ==========================================
// ROUTES CRÉDITS
// ==========================================

/**
 * GET /api/credits/balance
 * Obtenir la balance de crédits
 */
router.get('/credits/balance', creditsController.getBalance);

/**
 * POST /api/credits/earn
 * Gagner des crédits (endpoint interne)
 */
router.post('/credits/earn', creditsController.earnCredits);

/**
 * POST /api/credits/redeem
 * Demander un retrait de crédits
 */
router.post('/credits/redeem', creditsController.redeemCredits);

/**
 * GET /api/credits/transactions
 * Obtenir l'historique des transactions
 */
router.get('/credits/transactions', creditsController.getTransactions);

/**
 * GET /api/credits/stats
 * Obtenir les statistiques de gains
 */
router.get('/credits/stats', creditsController.getStats);

// ==========================================
// ROUTES MARKETPLACE
// ==========================================

/**
 * GET /api/marketplace/offers
 * Obtenir toutes les offres disponibles
 */
router.get('/marketplace/offers', marketplaceController.getOffers);

/**
 * POST /api/marketplace/purchase
 * Acheter une offre avec des crédits
 */
router.post('/marketplace/purchase', marketplaceController.purchaseOffer);

/**
 * GET /api/marketplace/purchases
 * Obtenir l'historique des achats
 */
router.get('/marketplace/purchases', marketplaceController.getPurchases);

// ==========================================
// ROUTES GAMIFICATION
// ==========================================

/**
 * GET /api/gamification/badges
 * Obtenir tous les badges disponibles
 */
router.get('/gamification/badges', gamificationController.getAllBadgesEndpoint);

/**
 * GET /api/gamification/leaderboard
 * Obtenir le leaderboard
 */
router.get('/gamification/leaderboard', gamificationController.getLeaderboard);

/**
 * GET /api/gamification/progress
 * Obtenir la progression de l'utilisateur
 */
router.get('/gamification/progress', gamificationController.getProgress);

/**
 * POST /api/gamification/check-badges
 * Vérifier et débloquer de nouveaux badges
 */
router.post('/gamification/check-badges', gamificationController.checkBadges);

/**
 * GET /api/gamification/my-badges
 * Obtenir les badges débloqués par l'utilisateur
 */
router.get('/gamification/my-badges', gamificationController.getMyBadges);

export default router;
