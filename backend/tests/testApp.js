import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../src/routes/authRoutes.js';
import ecgRoutes from '../src/routes/ecgRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import patientRoutes from '../src/routes/patientRoutes.js';
import questionnaireRoutes from '../src/routes/questionnaireRoutes.js';
import reviewRoutes from '../src/routes/reviewRoutes.js';
import analyticsRoutes from '../src/routes/analyticsRoutes.js';
import ontologyRoutes from '../src/routes/ontologyRoutes.js';
import protect, { requireRole } from '../src/middleware/auth.middleWare.js';
import { authLimiter, mlLimiter, readLimiter } from '../src/middleware/rateLimiter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// No ensureDatabaseReady — memory server is always connected in tests.
// Rate limiters are included to satisfy CodeQL; they skip in NODE_ENV=test.
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/ecg',           readLimiter, protect, ecgRoutes);
app.use('/api/admin',         readLimiter, protect, requireRole('ADMIN'), adminRoutes);
app.use('/api/patients',      readLimiter, protect, patientRoutes);
app.use('/api/questionnaire', readLimiter, protect, questionnaireRoutes);
app.use('/api/review',        readLimiter, protect, reviewRoutes);
app.use('/api/analytics',     readLimiter, protect, analyticsRoutes);
app.use('/api/ontology',      readLimiter, protect, ontologyRoutes);

app.use((error, req, res, _next) => {
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
  if (statusCode < 500) {
    return res.status(statusCode).json({ error: error.message, message: error.message });
  }
  res.status(statusCode).json({ error: 'Internal server error', message: error.message });
});

export default app;
