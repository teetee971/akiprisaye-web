// routes.ts - API routes configuration
// This file defines all API endpoints for the backend

import type { Route } from '@adonisjs/core/types';

/**
 * Define API routes
 * All routes are prefixed with /api
 */
export default function routes(Route: Route) {
  // Health check endpoint
  Route.get('/api/health', async ({ response }) => {
    return response.ok({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.1.0'
    });
  });

  // ============================================
  // PRODUCTS ROUTES
  // ============================================
  
  // Search products by name/keyword
  Route.get('/api/products/search', 'ProductsController.search');
  
  // Get trending products by territory
  Route.get('/api/products/trending', 'ProductsController.trending');

  // ============================================
  // PRICES ROUTES
  // ============================================
  
  // Get prices by EAN and territory
  Route.get('/api/prices', 'PricesController.index');
  
  // Add new price data
  Route.post('/api/prices', 'PricesController.store');
  
  // Compare multiple products
  Route.get('/api/prices/compare', 'PricesController.compare');

  // ============================================
  // NEWS ROUTES
  // ============================================
  
  // Get all news articles
  Route.get('/api/news', 'NewsController.index');
  
  // Get single news article
  Route.get('/api/news/:id', 'NewsController.show');
  
  // Create new article (admin only in production)
  Route.post('/api/news', 'NewsController.store');

  // ============================================
  // CONTACT ROUTES
  // ============================================
  
  // Submit contact form
  Route.post('/api/contact', 'ContactController.store');
  
  // Get contact messages (admin only in production)
  Route.get('/api/contact', 'ContactController.index');
  
  // Update message status (admin only in production)
  Route.patch('/api/contact/:id', 'ContactController.update');

  // ============================================
  // OPEN DATA ROUTES
  // ============================================
  
  // Get open data prices export
  Route.get('/api/opendata/prices', async ({ request, response }) => {
    const format = request.qs().format || 'json';
    const territory = request.qs().territory || 'all';
    
    return response.ok({
      message: 'Open Data Prices endpoint',
      format,
      territory,
      licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
      documentation: '/observatoire/methodologie',
      note: 'Use client-side export functionality or contact us for API access'
    });
  });
  
  // Get open data anomalies export
  Route.get('/api/opendata/anomalies', async ({ request, response }) => {
    const format = request.qs().format || 'json';
    const territory = request.qs().territory || 'all';
    
    return response.ok({
      message: 'Open Data Anomalies endpoint',
      format,
      territory,
      licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
      documentation: '/observatoire/methodologie',
      note: 'Use client-side export functionality or contact us for API access'
    });
  });

  // ============================================
  // FUTURE ROUTES (Placeholders)
  // ============================================
  
  // AI Tips endpoint (to be implemented)
  Route.get('/api/ai/tips', async ({ response }) => {
    return response.ok({
      message: 'AI Tips endpoint - Coming soon',
      status: 'placeholder'
    });
  });

  // User history endpoint (to be implemented)
  Route.get('/api/history', async ({ response }) => {
    return response.ok({
      message: 'User history endpoint - Coming soon',
      status: 'placeholder'
    });
  });

  // Scanner/OCR endpoint (to be implemented)
  Route.post('/api/scan', async ({ response }) => {
    return response.ok({
      message: 'OCR Scanner endpoint - Coming soon',
      status: 'placeholder'
    });
  });
}

/**
 * Express.js compatible routes (for Firebase Functions)
 * This is a simplified version that works with Express
 */
export function expressRoutes(app: any) {
  const PricesController = require('../app/Controllers/PricesController').default;
  const NewsController = require('../app/Controllers/NewsController').default;
  const ContactController = require('../app/Controllers/ContactController').default;
  const ProductsController = require('../app/Controllers/ProductsController').default;

  const pricesCtrl = new PricesController();
  const newsCtrl = new NewsController();
  const contactCtrl = new ContactController();
  const productsCtrl = new ProductsController();

  // Helper to wrap controller methods
  const wrap = (method: Function) => {
    return async (req: any, res: any) => {
      const request = {
        qs: () => req.query,
        body: () => req.body,
        params: req.params
      };

      const response = {
        ok: (data: any) => res.status(200).json(data),
        created: (data: any) => res.status(201).json(data),
        badRequest: (data: any) => res.status(400).json(data),
        notFound: (data: any) => res.status(404).json(data),
        internalServerError: (data: any) => res.status(500).json(data)
      };

      try {
        await method.call(this, { request, response, params: req.params });
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  };

  // Health check
  app.get('/api/health', (req: any, res: any) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.1.0'
    });
  });

  // Products routes
  app.get('/api/products/search', wrap(productsCtrl.search.bind(productsCtrl)));
  app.get('/api/products/trending', wrap(productsCtrl.trending.bind(productsCtrl)));

  // Prices routes
  app.get('/api/prices', wrap(pricesCtrl.index.bind(pricesCtrl)));
  app.post('/api/prices', wrap(pricesCtrl.store.bind(pricesCtrl)));
  app.get('/api/prices/compare', wrap(pricesCtrl.compare.bind(pricesCtrl)));

  // News routes
  app.get('/api/news', wrap(newsCtrl.index.bind(newsCtrl)));
  app.get('/api/news/:id', wrap(newsCtrl.show.bind(newsCtrl)));
  app.post('/api/news', wrap(newsCtrl.store.bind(newsCtrl)));

  // Contact routes
  app.post('/api/contact', wrap(contactCtrl.store.bind(contactCtrl)));
  app.get('/api/contact', wrap(contactCtrl.index.bind(contactCtrl)));
  app.patch('/api/contact/:id', wrap(contactCtrl.update.bind(contactCtrl)));

  // Open Data routes
  app.get('/api/opendata/prices', (req: any, res: any) => {
    const format = req.query.format || 'json';
    const territory = req.query.territory || 'all';
    res.json({
      message: 'Open Data Prices endpoint',
      format,
      territory,
      licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
      documentation: '/observatoire/methodologie',
      note: 'Use client-side export functionality or contact us for API access'
    });
  });
  
  app.get('/api/opendata/anomalies', (req: any, res: any) => {
    const format = req.query.format || 'json';
    const territory = req.query.territory || 'all';
    res.json({
      message: 'Open Data Anomalies endpoint',
      format,
      territory,
      licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
      documentation: '/observatoire/methodologie',
      note: 'Use client-side export functionality or contact us for API access'
    });
  });

  // Placeholder routes
  app.get('/api/ai/tips', (req: any, res: any) => {
    res.json({ message: 'AI Tips endpoint - Coming soon', status: 'placeholder' });
  });

  app.get('/api/history', (req: any, res: any) => {
    res.json({ message: 'User history endpoint - Coming soon', status: 'placeholder' });
  });

  app.post('/api/scan', (req: any, res: any) => {
    res.json({ message: 'OCR Scanner endpoint - Coming soon', status: 'placeholder' });
  });
}
