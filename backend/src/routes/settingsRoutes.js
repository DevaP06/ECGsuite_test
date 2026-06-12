import express from 'express';
import { getSettings, updateSettings, updateNotificationSettings } from '../controllers/settingsController.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.

router.get('/', readLimiter, getSettings);
router.patch('/', readLimiter, updateSettings);
router.patch('/notifications', readLimiter, updateNotificationSettings);

export default router;
