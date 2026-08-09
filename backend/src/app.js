import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import medicineRoutes from './routes/medicineRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import caretakerRoutes from './routes/caretakerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
]
  .map((origin) => origin?.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;

  const isLocalhost =
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  return isLocalhost || origin.endsWith('.vercel.app');
};

// ---- Security & core middleware ----------------------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl), local dev, configured client URLs, and Vercel preview/prod domains.
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
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
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Stricter limiter specifically for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// ---- Health check ---------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MediBridge AI API is running.' });
});

// ---- Routes -----------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/caretakers', caretakerRoutes);
app.use('/api/notifications', notificationRoutes);

// ---- 404 + error handling (must be last) -----------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
