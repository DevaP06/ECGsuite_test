import express from 'express';
import { registerUser, loginUser, logoutUser, googleAuth, getMe, updateProfile, changePassword, selectOnboardingRole, completeOnboardingProfile } from '../controllers/authController.js';
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
router.patch('/onboarding/role', readLimiter, protect, selectOnboardingRole);
router.post('/onboarding/profile', readLimiter, protect, completeOnboardingProfile);

export default router;
