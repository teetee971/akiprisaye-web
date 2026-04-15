import express from 'express';

// Legacy routes (src/routes/)
import compareRouter from './routes/compare.js';
import productsRouter from './routes/products.js';
import historyRouter from './routes/history.js';
import signalRouter from './routes/signal.js';
import healthRouter from './routes/health.js';
import territoriesRouter from './routes/territories.js';
import storesRouter from './routes/stores.js';
import basketRouter from './routes/basket.js';
import geocodingRouter from './routes/geocoding.js';
import creditsRouter from './routes/credits.js';
import receiptsRouter from './routes/receipts.js';

// API routes (src/api/routes/)
import authRoutes from './api/routes/auth.routes.js';
import alertsRoutes from './api/routes/alerts.routes.js';
import analyticsRoutes from './api/routes/analytics.routes.js';
import apiKeyRoutes from './api/routes/apiKey.routes.js';
import affiliateRoutes from './api/routes/affiliate.routes.js';
import affiliatesRoutes from './api/routes/affiliates.routes.js';
import gamificationRoutes from './api/routes/gamification.routes.js';
import legalEntityRoutes from './api/routes/legalEntity.routes.js';
import mapRoutes from './api/routes/map.routes.js';
import marketplaceRoutes from './api/routes/marketplace.routes.js';
import notificationsRoutes from './api/routes/notifications.routes.js';
import opendataRoutes from './api/routes/opendata.routes.js';
import pricesRoutes from './api/routes/prices.routes.js';
import promoRoutes from './api/routes/promo.routes.js';
import reportsRoutes from './api/routes/reports.routes.js';
import sponsorshipRoutes from './api/routes/sponsorship.routes.js';
import subscriptionRoutes from './api/routes/subscription.routes.js';
import syncRoutes from './api/routes/sync.routes.js';
import validationRoutes from './api/routes/validation.routes.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Legacy routes
app.use('/api/health', healthRouter);
app.use('/api/territories', territoriesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/basket', basketRouter);
app.use('/api/geocoding', geocodingRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/compare', compareRouter);
app.use('/api/products', productsRouter);
app.use('/api/products', historyRouter);
app.use('/api/products', signalRouter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/legal-entities', legalEntityRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/opendata', opendataRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sponsorship', sponsorshipRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/validation', validationRoutes);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
