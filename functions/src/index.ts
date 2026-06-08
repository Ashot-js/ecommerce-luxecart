import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();

// ---- Secrets ----
const jwtSecret = defineSecret('JWT_SECRET');
const databaseUrl = defineSecret('DATABASE_URL');

// ---- Middleware ----
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ---- Health check (v5 pooler) ----
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: 'production',
  });
});

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// ---- 404 handler ----
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---- Global error handler ----
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err?.message || err);
  res.status(500).json({
    error: 'Internal server error',
    details: err?.message || String(err),
  });
});

// Export as Firebase Function (Gen 2)
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    maxInstances: 1,
    timeoutSeconds: 60,
    secrets: [jwtSecret, databaseUrl],
    invoker: 'public',
  },
  app,
);