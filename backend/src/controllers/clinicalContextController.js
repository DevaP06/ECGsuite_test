import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import { refineOntology } from '../services/mlService.js';
import { toOntologyPatient } from '../utils/clinicalContextMapper.js';
import { mapOntologyEnrichment, deriveEmergencyLevel } from '../utils/ontologyMapping.js';
import { logAction } from '../services/auditService.js';

const CLINICAL_ROLES = ['PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];

const canAccessAnalysis = (req, analysis) => {
  const userId = req.user._id || req.user.id;
  return String(analysis.userId) === String(userId) || CLINICAL_ROLES.includes(req.user.role);
};

// labelProbabilities is stored as a Mongoose Map — coerce to a plain object of
// { modelAcronymLabel: probability } regardless of how Mongoose hands it back.
const toPlainProbabilities = (labelProbabilities) => {
  if (!labelProbabilities) return {};
  if (typeof labelProbabilities.entries === 'function') {
    return Object.fromEntries(labelProbabilities);
  }
  return { ...labelProbabilities };
};

// POST /api/clinical-context/:analysisId
// Re-runs the ontology stage with the submitted clinical context and persists
// the patient-refined differential back onto the analysis.
export const submitClinicalContext = asyncHandler(async (req, res) => {
  const rawId = String(req.params.analysisId);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid analysis ID');
  }

  const clinicalContext = req.body?.clinicalContext;
  if (!clinicalContext || typeof clinicalContext !== 'object') {
    return sendResponse(res, 400, false, 'clinicalContext object is required');
  }

  const analysis = await ECGAnalysis.findById(rawId).select('userId analysisResult');
  if (!analysis) {
    return sendResponse(res, 404, false, 'ECG analysis not found');
  }
  if (!canAccessAnalysis(req, analysis)) {
    return sendResponse(res, 403, false, 'You do not have access to this analysis');
  }

  const labelProbabilities = toPlainProbabilities(analysis.analysisResult?.labelProbabilities);
  if (Object.keys(labelProbabilities).length === 0) {
    return sendResponse(res, 422, false, 'Analysis has no model probabilities to refine');
  }

  const { patient, patientEvidence } = toOntologyPatient(clinicalContext);

  const refined = await refineOntology(labelProbabilities, patient, patientEvidence);
  if (refined === null) {
    return sendResponse(res, 503, false, 'Diagnosis service is temporarily unavailable. Your answers were not lost — please retry.');
  }

  const ontologyEnrichment = mapOntologyEnrichment(refined.ontology);
  const emergencyLevel = deriveEmergencyLevel(ontologyEnrichment);
  const isEmergency = ontologyEnrichment.some(item => item.isEmergency === true);

  analysis.analysisResult.ontologyEnrichment = ontologyEnrichment;
  analysis.analysisResult.emergencyLevel = emergencyLevel;
  analysis.analysisResult.isEmergency = isEmergency;
  analysis.clinicalContext = clinicalContext;
  analysis.clinicalContextAt = new Date();
  await analysis.save();

  const userId = req.user._id || req.user.id;
  logAction({
    req, userId, entityType: 'ECG_ANALYSIS', entityId: analysis._id, action: 'UPDATE',
    newValue: { clinicalContextApplied: true, emergencyLevel, isEmergency },
  });

  return sendResponse(res, 200, true, 'Clinical context applied — diagnosis refined', {
    analysisId: rawId,
    analysisResult: analysis.analysisResult,
  });
});
