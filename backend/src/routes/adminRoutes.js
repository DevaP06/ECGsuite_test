import express from 'express';
import { listUsers, updateUserStatus, updateUserRole, getAuditLogs, getStats, listAllAnalyses, getReports, getHealth, listModels, createModel, activateModel } from '../controllers/adminController.js';
import { readLimiter, mlLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by protect + requireRole('ADMIN') in index.js

router.get('/users', readLimiter, listUsers);
router.patch('/users/:id/status', readLimiter, updateUserStatus);
router.patch('/users/:id/role', readLimiter, updateUserRole);
router.get('/audit-logs', readLimiter, getAuditLogs);
router.get('/stats', readLimiter, getStats);
router.get('/reports', readLimiter, getReports);
router.get('/health', readLimiter, getHealth);
router.get('/analyses', readLimiter, listAllAnalyses);

// Model version management (Admin FR-4)
router.get('/models',                readLimiter, listModels);
router.post('/models',               mlLimiter,   createModel);
router.patch('/models/:id/activate', mlLimiter,   activateModel);

export default router;
