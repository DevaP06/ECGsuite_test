import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import OntologyRule from '../models/OntologyRule.js';
import { logAction } from '../services/auditService.js';

const VALID_SYSTEMS = ['snomed', 'icd10', 'custom'];
const VALID_URGENCY = ['critical', 'high', 'moderate', 'low'];
const URGENCY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

// GET /api/ontology/rules  (CARDIOLOGIST | ADMIN)
export const getRules = asyncHandler(async (req, res) => {
  const rules = await OntologyRule.find({ active: true }).select('-__v').lean();

  rules.sort((a, b) => {
    const urgDiff = (URGENCY_ORDER[a.urgencyTier] ?? 4) - (URGENCY_ORDER[b.urgencyTier] ?? 4);
    return urgDiff !== 0 ? urgDiff : a.display.localeCompare(b.display);
  });

  return sendResponse(res, 200, true, 'Ontology rules fetched successfully', { rules });
});

// GET /api/ontology/rules/:id  (CARDIOLOGIST | ADMIN)
export const getRule = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid rule ID');
  }

  const rule = await OntologyRule.findById(req.params.id).select('-__v').lean();
  if (!rule) return sendResponse(res, 404, false, 'Ontology rule not found');

  return sendResponse(res, 200, true, 'Ontology rule fetched successfully', { rule });
});

// POST /api/ontology/rules  (ADMIN only)
export const createRule = asyncHandler(async (req, res) => {
  const code = String(req.body.code ?? '').trim();
  const display = String(req.body.display ?? '').trim();
  const system = String(req.body.system ?? '');
  const urgencyTier = String(req.body.urgencyTier ?? '');

  if (!code) return sendResponse(res, 400, false, 'code is required');
  if (!display) return sendResponse(res, 400, false, 'display is required');
  if (!VALID_SYSTEMS.includes(system)) {
    return sendResponse(res, 400, false, `system must be one of: ${VALID_SYSTEMS.join(', ')}`);
  }
  if (!VALID_URGENCY.includes(urgencyTier)) {
    return sendResponse(res, 400, false, `urgencyTier must be one of: ${VALID_URGENCY.join(', ')}`);
  }

  const confidenceThreshold = req.body.confidenceThreshold !== undefined
    ? Number(req.body.confidenceThreshold) : 70;
  if (!Number.isFinite(confidenceThreshold) || confidenceThreshold < 0 || confidenceThreshold > 100) {
    return sendResponse(res, 400, false, 'confidenceThreshold must be a number between 0 and 100');
  }

  const existing = await OntologyRule.findOne({ code }).lean();
  if (existing) return sendResponse(res, 409, false, `A rule with code "${code}" already exists`);

  const rule = await OntologyRule.create({
    code,
    display,
    system,
    urgencyTier,
    confidenceThreshold,
    isEmergency: req.body.isEmergency === true,
    triageCategory: req.body.triageCategory ? String(req.body.triageCategory).trim() : undefined,
    triggerConditions: Array.isArray(req.body.triggerConditions)
      ? req.body.triggerConditions.map(String) : [],
    relatedCodes: Array.isArray(req.body.relatedCodes)
      ? req.body.relatedCodes.map(String) : [],
    version: req.body.version ? String(req.body.version).trim() : undefined,
    active: true,
  });

  const userId = req.user._id || req.user.id;
  logAction({ req, userId, entityType: 'ONTOLOGY_RULE', entityId: rule._id, action: 'UPDATE', newValue: { code, system, urgencyTier } });

  return sendResponse(res, 201, true, 'Ontology rule created successfully', { rule });
});

// PATCH /api/ontology/rules/:id  (CARDIOLOGIST | ADMIN)
export const updateRule = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid rule ID');
  }

  const rule = await OntologyRule.findById(req.params.id);
  if (!rule) return sendResponse(res, 404, false, 'Ontology rule not found');

  const oldSnapshot = { system: rule.system, urgencyTier: rule.urgencyTier, active: rule.active };

  if (req.body.display !== undefined) rule.display = String(req.body.display).trim();
  if (req.body.system !== undefined) {
    if (!VALID_SYSTEMS.includes(String(req.body.system))) {
      return sendResponse(res, 400, false, `system must be one of: ${VALID_SYSTEMS.join(', ')}`);
    }
    rule.system = String(req.body.system);
  }
  if (req.body.urgencyTier !== undefined) {
    if (!VALID_URGENCY.includes(String(req.body.urgencyTier))) {
      return sendResponse(res, 400, false, `urgencyTier must be one of: ${VALID_URGENCY.join(', ')}`);
    }
    rule.urgencyTier = String(req.body.urgencyTier);
  }
  if (req.body.confidenceThreshold !== undefined) {
    const ct = Number(req.body.confidenceThreshold);
    if (!Number.isFinite(ct) || ct < 0 || ct > 100) {
      return sendResponse(res, 400, false, 'confidenceThreshold must be a number between 0 and 100');
    }
    rule.confidenceThreshold = ct;
  }
  if (req.body.isEmergency !== undefined) rule.isEmergency = req.body.isEmergency === true;
  if (req.body.triageCategory !== undefined) rule.triageCategory = String(req.body.triageCategory).trim() || undefined;
  if (req.body.triggerConditions !== undefined) {
    if (!Array.isArray(req.body.triggerConditions)) {
      return sendResponse(res, 400, false, 'triggerConditions must be an array');
    }
    rule.triggerConditions = req.body.triggerConditions.map(String);
  }
  if (req.body.relatedCodes !== undefined) {
    if (!Array.isArray(req.body.relatedCodes)) {
      return sendResponse(res, 400, false, 'relatedCodes must be an array');
    }
    rule.relatedCodes = req.body.relatedCodes.map(String);
  }
  if (req.body.version !== undefined) rule.version = String(req.body.version).trim() || undefined;
  if (req.body.active !== undefined) rule.active = req.body.active === true;

  await rule.save();

  const userId = req.user._id || req.user.id;
  logAction({ req, userId, entityType: 'ONTOLOGY_RULE', entityId: rule._id, action: 'UPDATE', oldValue: oldSnapshot, newValue: { system: rule.system, urgencyTier: rule.urgencyTier, active: rule.active } });

  return sendResponse(res, 200, true, 'Ontology rule updated successfully', { rule });
});

// DELETE /api/ontology/rules/:id  (ADMIN only — soft deactivate)
export const deleteRule = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid rule ID');
  }

  const rule = await OntologyRule.findById(req.params.id);
  if (!rule) return sendResponse(res, 404, false, 'Ontology rule not found');
  if (!rule.active) return sendResponse(res, 409, false, 'Rule is already inactive');

  rule.active = false;
  await rule.save();

  const userId = req.user._id || req.user.id;
  logAction({ req, userId, entityType: 'ONTOLOGY_RULE', entityId: rule._id, action: 'DELETE', oldValue: { active: true } });

  return sendResponse(res, 200, true, 'Ontology rule deactivated successfully', { rule });
});
