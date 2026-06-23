import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import Patient from '../models/Patient.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import { logAction } from '../services/auditService.js';

const VALID_GENDERS = ['male', 'female', 'other', 'prefer-not-to-say'];
const VALID_SORT_FIELDS = ['name', 'age', 'createdAt'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/patients
export const listPatients = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
  const skip = (page - 1) * pageSize;

  const sortField = VALID_SORT_FIELDS.includes(String(req.query.sort)) ? String(req.query.sort) : 'createdAt';
  const sortDir = String(req.query.dir) === 'asc' ? 1 : -1;

  const filter = {};
  if (req.query.q) {
    const q = escapeRegex(String(req.query.q).trim());
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { 'contact.phone': { $regex: q, $options: 'i' } },
      { 'contact.email': { $regex: q, $options: 'i' } }
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(pageSize),
    Patient.countDocuments(filter)
  ]);

  const patientIds = patients.map(p => p._id);
  const analysisCounts = await ECGAnalysis.aggregate([
    { $match: { patientId: { $in: patientIds } } },
    { $group: { _id: '$patientId', total: { $sum: 1 }, lastVisit: { $max: '$createdAt' } } }
  ]);
  const countsByPatient = new Map(analysisCounts.map(c => [String(c._id), c]));

  const data = patients.map(p => {
    const stats = countsByPatient.get(String(p._id));
    return {
      _id: p._id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.contact?.phone,
      lastVisit: stats?.lastVisit ?? null,
      totalECGs: stats?.total ?? 0,
      createdAt: p.createdAt
    };
  });

  return sendResponse(res, 200, true, 'Patients fetched successfully', {
    data, total, page, pageSize
  });
});

// GET /api/patients/:id
export const getPatient = asyncHandler(async (req, res) => {
  const rawId = String(req.params.id);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid patient ID');
  }

  const patient = await Patient.findById(rawId);
  if (!patient) {
    return sendResponse(res, 404, false, 'Patient not found');
  }

  const userId = req.user._id || req.user.id;
  if (req.user.role !== 'CARDIOLOGIST' && req.user.role !== 'ADMIN' && String(patient.registeredBy) !== String(userId)) {
    return sendResponse(res, 403, false, 'You do not have access to this patient');
  }

  const stats = await ECGAnalysis.aggregate([
    { $match: { patientId: patient._id } },
    { $group: { _id: '$patientId', total: { $sum: 1 }, lastVisit: { $max: '$createdAt' } } }
  ]);

  const patientObj = patient.toObject();
  patientObj.totalECGs = stats[0]?.total ?? 0;
  patientObj.lastVisit = stats[0]?.lastVisit ?? null;

  return sendResponse(res, 200, true, 'Patient fetched successfully', { patient: patientObj });
});

// POST /api/patients
export const createPatient = asyncHandler(async (req, res) => {
  const name = req.body.name !== undefined ? String(req.body.name).trim() : '';
  const age = Number(req.body.age);
  const gender = req.body.gender !== undefined ? String(req.body.gender) : '';

  if (!name) {
    return sendResponse(res, 400, false, 'name is required');
  }
  if (!Number.isFinite(age) || age < 0 || age > 150) {
    return sendResponse(res, 400, false, 'age must be a number between 0 and 150');
  }
  if (!VALID_GENDERS.includes(gender)) {
    return sendResponse(res, 400, false, `gender must be one of: ${VALID_GENDERS.join(', ')}`);
  }

  const contactInput = (req.body.contact && typeof req.body.contact === 'object') ? req.body.contact : {};
  const phone = contactInput.phone !== undefined ? String(contactInput.phone).trim() : '';
  if (!phone) {
    return sendResponse(res, 400, false, 'contact.phone is required');
  }
  const contact = {
    phone,
    email: contactInput.email !== undefined ? String(contactInput.email).trim() : undefined,
    address: contactInput.address !== undefined ? String(contactInput.address).trim() : undefined,
    emergencyContact: contactInput.emergencyContact !== undefined ? String(contactInput.emergencyContact).trim() : undefined
  };

  const profileInput = (req.body.medicalProfile && typeof req.body.medicalProfile === 'object') ? req.body.medicalProfile : {};
  const medicalProfile = {
    knownConditions: profileInput.knownConditions !== undefined ? String(profileInput.knownConditions).trim() : undefined,
    currentMedications: profileInput.currentMedications !== undefined ? String(profileInput.currentMedications).trim() : undefined,
    medicalHistory: profileInput.medicalHistory !== undefined ? String(profileInput.medicalHistory).trim() : undefined,
    notes: profileInput.notes !== undefined ? String(profileInput.notes).trim() : undefined
  };

  const registeredBy = req.user._id || req.user.id;

  const patient = await Patient.create({ name, age, gender, contact, medicalProfile, registeredBy });

  logAction({ req, userId: registeredBy, entityType: 'PATIENT', entityId: patient._id, action: 'UPDATE', newValue: { name, age, gender } });

  return sendResponse(res, 201, true, 'Patient registered successfully', { patient });
});

// GET /api/patients/:id/analyses
export const getPatientAnalyses = asyncHandler(async (req, res) => {
  const rawId = String(req.params.id);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid patient ID');
  }

  const patient = await Patient.findById(rawId);
  if (!patient) {
    return sendResponse(res, 404, false, 'Patient not found');
  }

  const pUserId = req.user._id || req.user.id;
  if (req.user.role !== 'CARDIOLOGIST' && req.user.role !== 'ADMIN' && String(patient.registeredBy) !== String(pUserId)) {
    return sendResponse(res, 403, false, 'You do not have access to this patient');
  }

  const analyses = await ECGAnalysis.find({ patientId: rawId })
    .select('-filePath')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, 'Patient analyses fetched successfully', { analyses });
});

// GET /api/patients/:id/trends
export const getPatientTrends = asyncHandler(async (req, res) => {
  const rawId = String(req.params.id);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid patient ID');
  }

  const patient = await Patient.findById(rawId);
  if (!patient) {
    return sendResponse(res, 404, false, 'Patient not found');
  }

  const tUserId = req.user._id || req.user.id;
  if (req.user.role !== 'CARDIOLOGIST' && req.user.role !== 'ADMIN' && String(patient.registeredBy) !== String(tUserId)) {
    return sendResponse(res, 403, false, 'You do not have access to this patient');
  }

  const analyses = await ECGAnalysis.find({ patientId: rawId })
    .select('status createdAt analysisResult')
    .sort({ createdAt: 1 })
    .lean();

  const completed = analyses.filter((a) => a.status === 'completed' && a.analysisResult);

  const rhythmCounts = new Map();
  const dataPoints = [];
  let confidenceSum = 0;
  let emergencyCount = 0;

  for (const a of completed) {
    const r = a.analysisResult;
    const rhythm = r.rhythm ?? 'unknown';
    const confidence = r.confidence ?? 0;
    const emergencyLevel = r.emergencyLevel ?? 'none';

    rhythmCounts.set(rhythm, (rhythmCounts.get(rhythm) ?? 0) + 1);
    confidenceSum += confidence;
    if (r.isEmergency === true || emergencyLevel !== 'none') {
      emergencyCount += 1;
    }

    dataPoints.push({
      date: a.createdAt,
      rhythm,
      heartRate: r.heartRate ?? null,
      qrsDuration: r.qrsDuration ?? null,
      qtInterval: r.qtInterval ?? null,
      qtcInterval: r.qtcInterval ?? null,
      rrInterval: r.rrInterval ?? null,
      confidence,
      emergencyLevel
    });
  }

  const rhythmDistribution = Array.from(rhythmCounts.entries())
    .map(([rhythm, count]) => ({ rhythm, count }))
    .sort((a, b) => b.count - a.count);

  const dateRange = completed.length
    ? { from: completed[0].createdAt, to: completed[completed.length - 1].createdAt }
    : { from: null, to: null };

  const summary = {
    totalAnalyses: analyses.length,
    completedAnalyses: completed.length,
    averageConfidence: completed.length ? Number((confidenceSum / completed.length).toFixed(2)) : 0,
    emergencyCount,
    dateRange
  };

  return sendResponse(res, 200, true, 'Patient trends fetched successfully', {
    summary,
    rhythmDistribution,
    dataPoints
  });
});
