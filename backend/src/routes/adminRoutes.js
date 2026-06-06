import express from 'express';
import { listUsers, updateUserStatus, updateUserRole, getAuditLogs, getStats, listAllAnalyses } from '../controllers/adminController.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by protect + requireRole('ADMIN') in index.js

router.get('/users', readLimiter, listUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.get('/audit-logs', readLimiter, getAuditLogs);
router.get('/stats', readLimiter, getStats);
router.get('/analyses', readLimiter, listAllAnalyses);

export default router;
