import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import OntologyRule from '../models/OntologyRule.js';

const URGENCY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

// GET /api/ontology/rules  (CARDIOLOGIST | ADMIN)
export const getRules = asyncHandler(async (req, res) => {
  const rules = await OntologyRule.find({ active: true })
    .select('-__v')
    .lean();

  rules.sort((a, b) => {
    const urgDiff = (URGENCY_ORDER[a.urgencyTier] ?? 4) - (URGENCY_ORDER[b.urgencyTier] ?? 4);
    if (urgDiff !== 0) return urgDiff;
    return a.display.localeCompare(b.display);
  });

  return sendResponse(res, 200, true, 'Ontology rules fetched successfully', { rules });
});

// GET /api/ontology/rules/:id  (CARDIOLOGIST | ADMIN)
export const getRule = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid rule ID');
  }

  const rule = await OntologyRule.findById(req.params.id).select('-__v').lean();
  if (!rule) {
    return sendResponse(res, 404, false, 'Ontology rule not found');
  }

  return sendResponse(res, 200, true, 'Ontology rule fetched successfully', { rule });
});
