import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import PatientHistory from '../models/PatientHistory.js';
import { logAction } from '../services/auditService.js';
import { QUESTIONNAIRE_SECTIONS, QUESTIONNAIRE_VERSION, VALID_QUESTION_IDS } from '../data/questionnaireSchema.js';

const CLINICAL_ROLES = ['PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];

const isValueJsonSafe = (value) => {
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'boolean' || t === 'number') return true;
  if (Array.isArray(value)) return value.every(v => typeof v === 'string');
  return false;
};

const canAccessAnalysis = (req, analysis) => {
  const userId = req.user._id || req.user.id;
  return String(analysis.userId) === String(userId) || CLINICAL_ROLES.includes(req.user.role);
};

// GET /api/questionnaire/:analysisId
export const getQuestionnaire = asyncHandler(async (req, res) => {
  const rawId = String(req.params.analysisId);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid analysis ID');
  }

  const analysis = await ECGAnalysis.findById(rawId).select('userId analysisResult');
  if (!analysis) {
    return sendResponse(res, 404, false, 'ECG analysis not found');
  }
  if (!canAccessAnalysis(req, analysis)) {
    return sendResponse(res, 403, false, 'You do not have access to this analysis');
  }

  const condition = analysis.analysisResult?.abnormalities?.[0] ?? null;

  return sendResponse(res, 200, true, 'Questionnaire schema fetched successfully', {
    analysisId: rawId,
    condition,
    sections: QUESTIONNAIRE_SECTIONS
  });
});

// POST /api/questionnaire/:analysisId
export const submitQuestionnaire = asyncHandler(async (req, res) => {
  const rawId = String(req.params.analysisId);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid analysis ID');
  }

  const analysis = await ECGAnalysis.findById(rawId).select('userId patientId');
  if (!analysis) {
    return sendResponse(res, 404, false, 'ECG analysis not found');
  }
  if (!canAccessAnalysis(req, analysis)) {
    return sendResponse(res, 403, false, 'You do not have access to this analysis');
  }

  if (!Array.isArray(req.body.answers)) {
    return sendResponse(res, 400, false, 'answers must be an array');
  }

  const answers = [];
  for (const entry of req.body.answers) {
    if (!entry || typeof entry !== 'object') {
      return sendResponse(res, 400, false, 'Each answer must be an object with questionId and value');
    }
    const questionId = String(entry.questionId ?? '');
    if (!VALID_QUESTION_IDS.has(questionId)) {
      return sendResponse(res, 400, false, `Unknown questionId: ${questionId}`);
    }
    const value = entry.value === undefined ? null : entry.value;
    if (!isValueJsonSafe(value)) {
      return sendResponse(res, 400, false, `Invalid value type for questionId: ${questionId}`);
    }
    answers.push({ questionId, value });
  }

  const recordedBy = req.user._id || req.user.id;

  const history = await PatientHistory.findOneAndUpdate(
    { analysisId: rawId },
    {
      analysisId: rawId,
      patientId: analysis.patientId ?? null,
      recordedBy,
      answers,
      questionnaireVersion: QUESTIONNAIRE_VERSION
    },
    { new: true, upsert: true, runValidators: true }
  );

  logAction({ req, userId: recordedBy, entityType: 'PATIENT_HISTORY', entityId: history._id, action: 'UPDATE', newValue: { analysisId: rawId, answerCount: answers.length } });

  return sendResponse(res, 200, true, 'Questionnaire submitted successfully', { history });
});
