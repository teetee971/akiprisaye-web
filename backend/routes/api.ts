// routes/api.ts - Legacy API route definitions (Express-compatible)
// This file is not part of the main backend compilation (src/**/*).
// It serves as documentation / placeholder for API route definitions.
// The active routes are in backend/src/routes/ and backend/src/api/routes/.

import { Router, Request, Response } from 'express';

const router = Router();

// Health check
router.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
  });
});

// Products
router.get('/api/products/search', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.get('/api/products/trending', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

// Prices
router.get('/api/prices', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.post('/api/prices', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.get('/api/prices/compare', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

// News
router.get('/api/news', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.get('/api/news/:id', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.post('/api/news', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

// Contact
router.post('/api/contact', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.get('/api/contact', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

router.patch('/api/contact/:id', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented — use active routes in src/api/routes' });
});

// Open Data
router.get('/api/opendata/prices', (req: Request, res: Response) => {
  const format = (req.query['format'] as string) || 'json';
  const territory = (req.query['territory'] as string) || 'all';
  res.json({
    message: 'Open Data Prices endpoint',
    format,
    territory,
    licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
    documentation: '/observatoire/methodologie',
    note: 'Use client-side export functionality or contact us for API access',
  });
});

router.get('/api/opendata/anomalies', (req: Request, res: Response) => {
  const format = (req.query['format'] as string) || 'json';
  const territory = (req.query['territory'] as string) || 'all';
  res.json({
    message: 'Open Data Anomalies endpoint',
    format,
    territory,
    licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
    documentation: '/observatoire/methodologie',
    note: 'Use client-side export functionality or contact us for API access',
  });
});

export default router;
