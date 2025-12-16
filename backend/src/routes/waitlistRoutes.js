// src/routes/waitlistRoutes.js
import express from 'express';
import { 
  addToWaitlist, 
  getWaitlist, 
  checkWaitlistStatus 
} from '../controllers/waitlistController.js';

const router = express.Router();

// Public routes
router.post('/join', addToWaitlist);
router.get('/check', checkWaitlistStatus);

// Admin routes (add auth middleware later if needed)
router.get('/all', getWaitlist);

export default router;
