import express from 'express';
import { registerUser, loginUser, logoutUser, googleAuth, getMe } from '../controllers/authController.js';
import protect from '../middleware/auth.middleWare.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);

export default router;
