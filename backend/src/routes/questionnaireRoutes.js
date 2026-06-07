import express from 'express';
import { getQuestionnaire, submitQuestionnaire } from '../controllers/questionnaireController.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Guarded by `protect` at the mount point in index.js.
// Access to a specific analysis's questionnaire is enforced in the controller
// (analysis owner or a clinical role).

router.get('/:analysisId', readLimiter, getQuestionnaire);
router.post('/:analysisId', readLimiter, submitQuestionnaire);

export default router;
