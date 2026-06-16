import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB, { waitForDbReady } from './src/db/index.js';
import { sendResponse } from './src/utils/responseHandler.js';

// Load environment variables
dotenv.config();

// Fail fast if required variables are missing so misconfigured deployments
// surface immediately rather than crashing on the first real request.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length && process.env.NODE_ENV !== 'test') {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

// Security headers (NF-2) — helmet before CORS so headers apply to all responses.
// crossOriginEmbedderPolicy is disabled to keep PDF downloads and external asset
// requests working across browsers without additional CORP headers on each response.
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc:      ["'none'"],
    },
  },
}));

const PROD_ORIGINS = [
  'https://ec-gsuite-test.vercel.app',
  'https://www.ecgenius.life',
  'https://ecgenius.life',
];
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production' ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));
app.use(express.json());
app.use(cookieParser());

// Attach a unique request ID to every request so logs and error responses
// are traceable end-to-end. The frontend reads this from X-Request-ID.
app.use((req, res, next) => {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
});

const ensureDatabaseReady = async (req, res, next) => {
  if (!process.env.MONGO_URI) {
    return sendResponse(res, 503, false, 'MONGO_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return next();
  }

  const ready = await waitForDbReady(8000);
  if (!ready) {
    return sendResponse(res, 503, false, 'MongoDB is not ready yet');
  }

  return next();
};

// Import auth controller functions
import authRoutes from './src/routes/authRoutes.js';
import ecgRoutes from './src/routes/ecgRoutes.js';
import waitlistRoutes from './src/routes/waitlistRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import patientRoutes from './src/routes/patientRoutes.js';
import clinicalContextRoutes from './src/routes/clinicalContextRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import ontologyRoutes from './src/routes/ontologyRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import protect, { requireRole } from './src/middleware/auth.middleWare.js';
import { readLimiter, waitlistLimiter } from './src/middleware/rateLimiter.js';

app.get('/api', (req, res) => {
  res.json({ message: 'ECGenius API', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Authentication routes with /api prefix
app.use('/api', ensureDatabaseReady);
app.use('/api/auth', authRoutes);

// Waitlist — public but rate-limited to prevent signup spam
app.use('/api/waitlist', waitlistLimiter, waitlistRoutes);

// Domain routes
app.use('/api/ecg', protect, ecgRoutes);
app.use('/api/admin', readLimiter, protect, requireRole('ADMIN'), adminRoutes);
app.use('/api/patients', readLimiter, protect, patientRoutes);
app.use('/api/clinical-context', readLimiter, protect, clinicalContextRoutes);
app.use('/api/review', readLimiter, protect, reviewRoutes);
app.use('/api/analytics', readLimiter, protect, analyticsRoutes);
app.use('/api/ontology', readLimiter, protect, ontologyRoutes);
app.use('/api/settings', readLimiter, protect, settingsRoutes);
app.use('/api/notifications', readLimiter, protect, notificationRoutes);

// Error handling middleware. Service-layer errors are thrown via createError(),
// which sets `error.statusCode` (400 validation, 401 bad credentials, 409
// conflicts, etc.) — this previously always replied 500 "Internal server error",
// so a simple "wrong password" looked identical to a server crash to the user
// and to the frontend's extractErrorMessage. 4xx messages are user-facing by
// design (they never carry internals), so pass them through; only 5xx details
// are masked outside development.
app.use((error, req, res, next) => {
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
  console.error('Unhandled error:', error);

  if (statusCode < 500) {
    return sendResponse(res, statusCode, false, error.message);
  }

  sendResponse(
    res,
    statusCode,
    false,
    process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  );
});

// 404 handler for unmatched routes
app.use((req, res) => {
  sendResponse(res, 404, false, 'Not found', {
    path: req.originalUrl,
    availableRoutes: [
      '/api',
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/logout',
      '/api/auth/google',
      '/api/auth/me',
      '/api/ecg/...',
      '/api/ml/...',
      '/api/admin/...',
      '/api/patients/...',
      '/api/clinical-context/...',
      '/api/review/...',
      '/api/settings/...',
      '/api/notifications/...'
    ]
  });
});

// Start server only when running as a standalone server (not on Vercel serverless)
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  // Wait for the initial MongoDB connection attempt to settle before accepting
  // traffic — otherwise the first wave of requests (login, dashboard fetches)
  // can race ensureDatabaseReady's 8s timeout and come back as a hard 503.
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // Serverless: module evaluation can't block on a connection, so kick it off
  // here and let ensureDatabaseReady gate individual requests until it's ready.
  connectDB().catch(console.error);
}

// For Vercel serverless function compatibility
export default (req, res) => {
  return app(req, res);
};
