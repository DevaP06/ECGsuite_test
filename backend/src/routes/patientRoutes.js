import express from 'express';
import { listPatients, getPatient, createPatient, getPatientAnalyses, getPatientTrends } from '../controllers/patientController.js';
import { requireRole } from '../middleware/auth.middleWare.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here are already guarded by `protect` at the mount point in index.js.
// Patients/Cardiologists/Admins can view; PHC Doctors and Admins register new patients.

router.get('/', readLimiter, requireRole('PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'), listPatients);
router.post('/', readLimiter, requireRole('PHC_DOCTOR', 'ADMIN'), createPatient);
router.get('/:id', readLimiter, requireRole('PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'), getPatient);
router.get('/:id/analyses', readLimiter, requireRole('PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'), getPatientAnalyses);
router.get('/:id/trends', readLimiter, requireRole('PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'), getPatientTrends);

export default router;
