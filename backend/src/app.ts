/**
 * Application Express - Backend A KI PRI SA YÉ
 *
 * Backend institutionnel pour la gestion des entreprises
 * Conformité RGPD et législation française
 *
 * Stack:
 * - Node.js 20+
 * - TypeScript
 * - Express
 * - PostgreSQL + Prisma
 * - Zod pour validation
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './database/prisma.js';

// Import routes
import authRoutes from './api/routes/auth.routes.js';
import legalEntityRoutes from './api/routes/legalEntity.routes.js';
import auditRoutes from './audit/audit.routes.js';
import adminRoutes from './admin/admin.routes.js';
import opendataRoutes from './api/routes/opendata.routes.js';
// API Gateway routes
import apiKeyRoutes from './api/routes/apiKey.routes.js';
import v1Routes from './api/v1/index.js';
// Phase 7: Infrastructure routes
import geocodingRoutes from './routes/geocoding.js';
import storesRoutes from './routes/stores.js';
import productsRoutes from './routes/products.js';
// Phase 8: Basket comparison routes
import basketRoutes from './routes/basket.js';
// Subscription & Payment routes
import subscriptionRoutes from './api/routes/subscription.routes.js';
// Verified Pricing routes
import pricesRoutes from './api/routes/prices.routes.js';
// Receipt OCR Import routes
import receiptsRoutes from './routes/receipts.js';
// Price comparison routes (Phase 6 — compare + territories + history + signal)
import compareRoutes from './routes/compare.js';
import territoriesRoutes from './routes/territories.js';
import historyRoutes from './routes/history.js';
import signalRoutes from './routes/signal.js';
// Monetization engine routes
import marketplaceRoutes from './api/routes/marketplace.routes.js';
import affiliatesRoutes from './api/routes/affiliates.routes.js';
import reportsRoutes from './api/routes/reports.routes.js';
import sponsorshipRoutes from './api/routes/sponsorship.routes.js';

// Import middlewares
import { apiLimiter } from './api/middlewares/rateLimit.middleware.js';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './api/middlewares/error.middleware.js';

// Import Swagger
import { setupSwagger } from './api/docs/swagger.js';

// Import Scheduler
import { syncScheduler } from './services/scheduler/syncScheduler.js';

// Charger les variables d'environnement
dotenv.config();

// Configuration de l'application
const app: Express = express();
const port = process.env.PORT || 3001;
const nodeEnv = process.env.NODE_ENV || 'development';

// Re-export shared Prisma client for backwards compatibility
export { default as prisma } from './database/prisma.js';

// ========================================
// Middlewares globaux
// ========================================

// CORS - Configuration stricte
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 heures
};
app.use(cors(corsOptions));

// Parser JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes en développement
if (nodeEnv === 'development') {
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    console.info(`[${new Date().toISOString()}] ${_req.method} ${_req.path}`);
    next();
  });
}

// Headers de sécurité
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Protection XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // RGPD - Pas de tracking
  res.setHeader('Permissions-Policy', 'interest-cohort=()');

  next();
});

// ========================================
// Routes de base
// ========================================

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Route racine
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'A KI PRI SA YÉ - Backend API',
    version: '4.0.0', // Sprint 6: Open Data API
    description: 'Backend institutionnel pour la gestion des entreprises',
    environment: nodeEnv,
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs',
      auth: '/api/auth',
      v1: '/api/v1',
      apiKeys: '/api/api-keys',
      legalEntities: '/api/legal-entities',
      audit: '/api/audit',
      admin: '/api/admin',
      opendata: '/api/opendata/v1', // Sprint 6
      geocoding: '/api/geocoding', // Phase 7
      stores: '/api/stores', // Phase 7
      products: '/api/products', // Phase 7
      basket: '/api/basket', // Phase 8
      prices: '/api/prices', // Verified Pricing System
    },
    legal: {
      rgpd: 'Conforme RGPD (EU) 2016/679',
      siren_siret: 'Décret n°82-130 du 9 février 1982',
      opendata_licence: 'Licence Ouverte / Open Licence v2.0',
      data_protection:
        process.env.DATA_PROTECTION_OFFICER_EMAIL || 'dpo@akiprisaye.app',
    },
  });
});

// ========================================
// Routes API
// ========================================

// Documentation Swagger (avant rate limiting pour accès libre)
if (process.env.ENABLE_SWAGGER !== 'false') {
  setupSwagger(app);
}

// Rate limiting sur toutes les routes API
app.use('/api', apiLimiter);

// Routes d'authentification (publiques)
app.use('/api/auth', authRoutes);

// API Gateway v1 (authentification requise)
app.use('/api/v1', v1Routes);

// API Keys management (JWT authentification uniquement)
app.use('/api/api-keys', apiKeyRoutes);

// Routes des entités juridiques (protégées par JWT)
app.use('/api/legal-entities', legalEntityRoutes);

// Routes audit (protégées par JWT + permission AUDIT_READ)
app.use('/api/audit', auditRoutes);

// Routes admin (protégées par JWT + SUPER_ADMIN ou permissions spécifiques)
app.use('/api/admin', adminRoutes);

// Routes Open Data (publiques - pas d'authentification)
// Sprint 6: API Open Data avec Licence Ouverte v2.0
app.use('/api/opendata', opendataRoutes);

// Phase 7: Infrastructure API routes (publiques avec rate limiting)
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);

// Phase 8: Basket comparison API routes (publiques avec rate limiting)
app.use('/api/basket', basketRoutes);

// Subscription & Payment API routes
app.use('/api/subscriptions', subscriptionRoutes);

// Verified Pricing API routes (public with rate limiting)
app.use('/api/prices', pricesRoutes);

// Receipt OCR Import routes
app.use('/api/receipts', receiptsRoutes);

// Price comparison (Phase 6)
app.use('/api/compare', compareRoutes);
app.use('/api/territories', territoriesRoutes);
app.use('/api/products', historyRoutes);   // mounts /:id/history under /api/products
app.use('/api/products', signalRoutes);    // mounts /:id/signal  under /api/products
// Monetization engine routes
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sponsorship', sponsorshipRoutes);

// ========================================
// Gestion des erreurs
// ========================================

// Route non trouvée (404)
app.use(notFoundMiddleware);

// Gestionnaire d'erreurs global
app.use(errorMiddleware);

// ========================================
// Démarrage du serveur
// ========================================

// Fonction de démarrage
async function startServer() {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    console.info('✅ Connexion à la base de données établie');

    // Initialiser le scheduler (en production uniquement)
    if (nodeEnv === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
      syncScheduler.start();
      console.info('✅ Scheduler de synchronisation démarré');
    } else {
      console.info('ℹ️  Scheduler de synchronisation désactivé (dev mode)');
    }

    // Démarrer le serveur
    app.listen(port, () => {
      console.info('========================================');
      console.info(`🚀 Serveur démarré sur le port ${port}`);
      console.info(`📡 Environnement: ${nodeEnv}`);
      console.info(`🔗 URL: http://localhost:${port}`);
      console.info('========================================');
      console.info('');
      console.info('🏢 Backend institutionnel A KI PRI SA YÉ');
      console.info('✅ Gestion des entreprises (SIREN/SIRET)');
      console.info('✅ Validation stricte des identifiants');
      console.info('✅ Conformité RGPD');
      console.info('✅ API REST avec JWT');
      console.info('✅ Synchronisation automatique (Open Food Facts, Open Prices)');
      console.info('');
      console.info('📚 Documentation: /api/docs');
      console.info('🔒 Sécurité: JWT + Rate limiting');
      console.info('========================================');
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt gracieux
async function shutdown() {
  console.info('\n🛑 Arrêt du serveur en cours...');

  try {
    // Arrêter le scheduler
    syncScheduler.stop();
    console.info('✅ Scheduler arrêté');

    await prisma.$disconnect();
    console.info('✅ Déconnexion de la base de données réussie');
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'arrêt:", error);
    process.exit(1);
  }
}

// Signaux d'arrêt
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Démarrer le serveur uniquement si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;
