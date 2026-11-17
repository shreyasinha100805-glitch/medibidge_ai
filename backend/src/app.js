import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import medicineRoutes from './routes/medicineRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import caretakerRoutes from './routes/caretakerRoutes.js';
import healthLogRoutes from './routes/healthLogRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
]
  .map((origin) => origin?.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  const isLocalDevelopmentOrigin =
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  return process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin;
};

// ---- Security & core middleware ----------------------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, configured client URLs, and local development outside production.
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Time-Zone'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// General API rate limiter (protects against brute force / abuse)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Auth endpoint rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

app.get('/', (req, res) => {
  res.status(200).send('MediBridge API Running');
});

// ---- Health check ---------------------------------------------------
app.get('/api/health', async (req, res) => {
  const connection = mongoose.connection;
  let database = connection.readyState === 2 ? 'connecting' : 'disconnected';

  try {
    if (connection.readyState === 1 && connection.db) {
      const ping = await connection.db.admin().ping();
      if (ping?.ok === 1) database = 'connected';
    }
  } catch {
    // Keep credentials and driver details out of the public health response/logs.
    console.error('Health check MongoDB ping failed.');
  }

  const healthy = database === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    server: 'running',
    database,
  });
});

app.use('/api', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
    return;
  }

  try {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      next();
      return;
    }
  } catch (err) {
    console.error('Database connection retry failed.', err.name || 'Error');
  }

  res.status(503).json({
    success: false,
    message: 'Backend is starting up. Please try again in a few seconds.',
  });
});

// ---- Routes -----------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/caretakers', caretakerRoutes);
app.use('/api/health-logs', healthLogRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);

// ---- 404 + error handling (must be last) -----------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
