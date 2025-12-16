// src/routes/waitlistRoutes.js
import express from 'express';
import { 
  addToWaitlist, 
  getWaitlist, 
  checkWaitlistStatus,
  getUserWaitlistStatus,
  linkWaitlistToUser
} from '../controllers/waitlistController.js';

const router = express.Router();

// Public routes
router.post('/join', addToWaitlist);
router.get('/check', checkWaitlistStatus);

// Authenticated routes
router.get('/status/:userId', getUserWaitlistStatus);
router.post('/link-user', linkWaitlistToUser);

// Admin routes
router.get('/all', getWaitlist);

export default router;
