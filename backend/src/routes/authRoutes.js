import express from 'express';
import { registerUser, loginUser, logoutUser, googleAuth, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import protect from '../middleware/auth.middleWare.js';
import { authLimiter, readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/google', authLimiter, googleAuth);
router.get('/me', readLimiter, protect, getMe);
router.patch('/me', readLimiter, protect, updateProfile);
router.patch('/password', authLimiter, protect, changePassword);

export default router;
