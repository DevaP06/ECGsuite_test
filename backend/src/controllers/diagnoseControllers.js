import fs from 'fs';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import { predictECG } from '../services/mlService.js';

export const diagnoseECG = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, 400, false, 'No ECG image uploaded');
  }

  const patientAge = Number(req.body?.patientAge || 0);
  const patientGender = req.body?.patientGender;
  const genderValue = patientGender === 'male' ? 1 : patientGender === 'female' ? 0 : 2;

  const result = await predictECG(req.file.path, patientAge, genderValue);

  try { fs.unlinkSync(req.file.path); } catch (_) { /* file already gone */ }

  return sendResponse(res, 200, true, 'Diagnosis generated successfully', result);
});
