import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Middleware
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

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      const MONGO_URI = process.env.MONGO_URI;
      if (!MONGO_URI) {
        console.log('MONGO_URI not found, running without database');
        return;
      }
      await mongoose.connect(MONGO_URI);
      // Log connected host when available
      const host = mongoose.connection?.host || mongoose.connection?.client?.s?.hosts?.[0] || 'unknown';
      console.log(`MongoDB connected ✅: ${host}`);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't crash the app if MongoDB fails
  }
};

// Initialize DB connection (don't await to prevent blocking)
connectDB().catch(console.error);

// Import auth controller functions
import authRoutes from './src/routes/authRoutes.js';
import ecgRoutes from './src/routes/ecgRoutes.js';
import mlRoutes from './src/routes/mlRoutes.js';
import waitlistRoutes from './src/routes/waitlistRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import patientRoutes from './src/routes/patientRoutes.js';
import questionnaireRoutes from './src/routes/questionnaireRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
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
app.use('/api/auth', authRoutes);

// Waitlist routes
app.use('/api/waitlist', waitlistRoutes);

// Domain routes
app.use('/api/ecg', protect, ecgRoutes);
app.use('/api/ml', mlLimiter, protect, mlRoutes);
app.use('/api/admin', readLimiter, protect, requireRole('ADMIN'), adminRoutes);
app.use('/api/patients', readLimiter, protect, patientRoutes);
app.use('/api/questionnaire', readLimiter, protect, questionnaireRoutes);
app.use('/api/review', readLimiter, protect, reviewRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl,
    availableRoutes: [
      '/api',
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/google',
      '/api/auth/me',
      '/api/ecg/...',
      '/api/ml/...',
      '/api/admin/...',
      '/api/patients/...',
      '/api/questionnaire/...',
      '/api/review/...'
    ]
  });
});

// Start server only when running as a standalone server (not on Vercel serverless)
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless function compatibility
export default (req, res) => {
  return app(req, res);
};
