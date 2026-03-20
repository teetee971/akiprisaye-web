/**
 * Firebase Functions entry point — compare API
 *
 * Exposes the same Express app as a Cloud Function named "api".
 * Deploy with: firebase deploy --only functions:api
 *
 * Hosting rewrite (add to firebase.json > hosting > rewrites):
 *   { "source": "/api/**", "function": "api" }
 *
 * NOTE: this file is intentionally separate from backend/src/app.ts
 * so the main Express server can still be deployed standalone (e.g. on
 * a VPS or Cloud Run) without requiring firebase-functions.
 */

import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import healthRoute     from './routes/health.js';
import compareRoute    from './routes/compare.js';
import territoriesRoute from './routes/territories.js';
import historyRoute    from './routes/history.js';
import signalRoute     from './routes/signal.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/health',      healthRoute);
app.use('/api/compare',     compareRoute);
app.use('/api/territories', territoriesRoute);
app.use('/api/products',    historyRoute);  // /:id/history
app.use('/api/products',    signalRoute);   // /:id/signal

export const api = functions.https.onRequest(app);
