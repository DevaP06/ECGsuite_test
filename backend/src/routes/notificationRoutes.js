import express from 'express';
import { listNotifications, markAllAsRead, markAsRead, dismissNotification } from '../controllers/notificationController.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.

router.get('/', readLimiter, listNotifications);
router.patch('/read-all', readLimiter, markAllAsRead);
router.patch('/:id/read', readLimiter, markAsRead);
router.patch('/:id/dismiss', readLimiter, dismissNotification);

export default router;
