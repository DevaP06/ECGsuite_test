import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import { predictECG } from '../services/mlService.js';

export const diagnoseECG = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, 400, false, 'No ECG image uploaded');
  }

  const result = await predictECG(req.file.path);

  return sendResponse(res, 200, true, 'Diagnosis generated successfully', result);
});
