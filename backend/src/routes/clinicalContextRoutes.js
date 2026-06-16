import express from 'express';
import { submitClinicalContext } from '../controllers/clinicalContextController.js';
import { mlLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Guarded by `protect` at the mount point in index.js. Access to a specific
// analysis is enforced in the controller (analysis owner or a clinical role).
// mlLimiter because each call fans out to the ml-api / ontology services.
router.post('/:analysisId', mlLimiter, submitClinicalContext);

export default router;
