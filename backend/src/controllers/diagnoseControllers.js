import fs from 'fs';
import path from 'path';
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

  const uploadRoot = path.resolve('uploads');
  const resolvedFilePath = path.resolve(uploadRoot, req.file.path);
  const isWithinUploadRoot =
    resolvedFilePath === uploadRoot || resolvedFilePath.startsWith(uploadRoot + path.sep);

  if (isWithinUploadRoot) {
    try { fs.unlinkSync(resolvedFilePath); } catch (_) { /* file already gone */ }
  }

  return sendResponse(res, 200, true, 'Diagnosis generated successfully', result);
});
