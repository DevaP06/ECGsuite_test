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

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ec-gsuite-test.vercel.app',
    'https://www.ecgenius.life',
    'https://ecgenius.life'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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
import mlRoutes from './src/routes/mlRoutes.js';
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
import { mlLimiter, readLimiter } from './src/middleware/rateLimiter.js';

// Test routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasMongoUri: !!process.env.MONGO_URI
  });
});

// Lightweight test endpoint (useful for smoke tests)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// Authentication routes with /api prefix
app.use('/api', ensureDatabaseReady);
app.use('/api/auth', authRoutes);

// Waitlist routes
app.use('/api/waitlist', waitlistRoutes);

// Domain routes
app.use('/api/ecg', protect, ecgRoutes);
app.use('/api/ml', mlLimiter, protect, mlRoutes);
app.use('/api/admin', readLimiter, protect, requireRole('ADMIN'), adminRoutes);
app.use('/api/patients', readLimiter, protect, patientRoutes);
app.use('/api/clinical-context', protect, clinicalContextRoutes);
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
