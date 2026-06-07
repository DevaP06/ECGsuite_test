import express from 'express';
import { requestReview, getQueue, getMyRequests } from '../controllers/reviewController.js';
import { requireRole } from '../middleware/auth.middleWare.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.

router.post('/request', readLimiter, requireRole('PHC_DOCTOR'), requestReview);
router.get('/queue', readLimiter, requireRole('CARDIOLOGIST'), getQueue);
router.get('/my-requests', readLimiter, requireRole('PHC_DOCTOR'), getMyRequests);

export default router;
