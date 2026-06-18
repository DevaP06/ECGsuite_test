import express from 'express';
import { getDoctorStats } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getDoctorStats);

export default router;
