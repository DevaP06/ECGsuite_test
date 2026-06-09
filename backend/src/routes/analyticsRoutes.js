import express from 'express';
import { submitFeedback, getReviewMetrics, getInsights } from '../controllers/analyticsController.js';
import { requireRole } from '../middleware/auth.middleWare.js';
import { readLimiter, mlLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.

router.post('/feedback', mlLimiter, requireRole('CARDIOLOGIST'), submitFeedback);
router.get('/review-metrics', readLimiter, requireRole('CARDIOLOGIST'), getReviewMetrics);
router.get('/insights', readLimiter, requireRole('CARDIOLOGIST'), getInsights);

export default router;
