import express from 'express';
import { getRules, getRule, createRule, updateRule, deleteRule } from '../controllers/ontologyController.js';
import { requireRole } from '../middleware/auth.middleWare.js';
import { readLimiter, mlLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.

router.get('/rules',       readLimiter, requireRole('CARDIOLOGIST', 'ADMIN'), getRules);
router.get('/rules/:id',   readLimiter, requireRole('CARDIOLOGIST', 'ADMIN'), getRule);
router.post('/rules',      mlLimiter,   requireRole('ADMIN'),                  createRule);
router.patch('/rules/:id', mlLimiter,   requireRole('CARDIOLOGIST', 'ADMIN'), updateRule);
router.delete('/rules/:id', mlLimiter,  requireRole('ADMIN'),                  deleteRule);

export default router;
