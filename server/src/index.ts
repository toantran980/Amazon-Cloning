import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import authRouter from './routes/auth';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import productsRouter from './routes/products';
import paymentsRouter from './routes/payments';
import prisma from './prismaClient';
import logger from './logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers & CSP directives allow Vite dev server, Google Fonts, and payment gateways.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        connectSrc: ["'self'", 'http://localhost:5173', 'http://localhost:3001', 'https://api.stripe.com'],
      },
    },
  })
);

// Structured request logging
app.use(pinoHttp({ logger }));

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());

// Stripe raw body parser specifically for webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Standard JSON body parser for all other API endpoints
app.use(express.json());

// Health Check Probe Endpoint for orchestrators & uptime monitoring
app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
      uptime: process.uptime(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Health probe DB error: ${errorMsg}`);
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: errorMsg,
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/payments', paymentsRouter);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
