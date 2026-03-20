import express from 'express';
import compareRouter from './routes/compare.js';
import productsRouter from './routes/products.js';
import historyRouter from './routes/history.js';
import signalRouter from './routes/signal.js';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/compare', compareRouter);
app.use('/api/products', productsRouter);
app.use('/api/products', historyRouter);
app.use('/api/products', signalRouter);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
