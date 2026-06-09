import express from 'express';
import { getRules, getRule } from '../controllers/ontologyController.js';
import { requireRole } from '../middleware/auth.middleWare.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.

router.get('/rules', readLimiter, requireRole('CARDIOLOGIST', 'ADMIN'), getRules);
router.get('/rules/:id', readLimiter, requireRole('CARDIOLOGIST', 'ADMIN'), getRule);

export default router;
