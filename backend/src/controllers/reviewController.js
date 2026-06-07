import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import SpecialistReview from '../models/SpecialistReview.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import { logAction } from '../services/auditService.js';

const VALID_PRIORITIES = ['normal', 'urgent', 'critical'];
const ACTIVE_STATUSES = ['pending', 'in_review'];

const primaryDiagnosisOf = (analysis) =>
  analysis?.analysisResult?.abnormalities?.[0] ?? analysis?.analysisResult?.rhythm ?? null;

const toQueueItem = (review) => {
  const analysis = review.analysisId && typeof review.analysisId === 'object' ? review.analysisId : null;
  const requester = review.requestedBy && typeof review.requestedBy === 'object' ? review.requestedBy : null;

  return {
    _id: review._id,
    analysisId: analysis ? analysis._id : review.analysisId,
    patientName: analysis?.patientInfo?.name ?? undefined,
    patientAge: analysis?.patientInfo?.age ?? undefined,
    gender: analysis?.patientInfo?.gender ?? undefined,
    primaryDiagnosis: analysis ? (primaryDiagnosisOf(analysis) ?? undefined) : undefined,
    priority: review.priority,
    status: review.reviewStatus,
    requestedBy: requester?.fullName ?? requester?.username ?? undefined,
    createdAt: review.createdAt
  };
};

// POST /api/review/request  (PHC_DOCTOR only)
export const requestReview = asyncHandler(async (req, res) => {
  const analysisId = String(req.body.analysisId ?? '');
  if (!analysisId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'A valid analysisId is required');
  }

  const priority = req.body.priority !== undefined ? String(req.body.priority) : 'normal';
  if (!VALID_PRIORITIES.includes(priority)) {
    return sendResponse(res, 400, false, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  const requestNotes = req.body.notes !== undefined ? String(req.body.notes).trim() : undefined;
  const requestedBy = req.user._id || req.user.id;

  const analysis = await ECGAnalysis.findOne({ _id: analysisId, userId: requestedBy });
  if (!analysis) {
    return sendResponse(res, 404, false, 'ECG analysis not found');
  }

  const existing = await SpecialistReview.findOne({ analysisId, reviewStatus: { $in: ACTIVE_STATUSES } });
  if (existing) {
    return sendResponse(res, 409, false, 'A review request is already pending for this analysis');
  }

  const review = await SpecialistReview.create({
    analysisId,
    cardiologistId: null,
    requestedBy,
    priority,
    requestNotes,
    reviewStatus: 'pending'
  });

  logAction({ req, userId: requestedBy, entityType: 'SPECIALIST_REVIEW', entityId: review._id, action: 'UPDATE', newValue: { analysisId, priority, reviewStatus: 'pending' } });

  return sendResponse(res, 201, true, 'Specialist review requested successfully', { review });
});

// GET /api/review/queue  (CARDIOLOGIST only)
export const getQueue = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { reviewStatus: { $in: ACTIVE_STATUSES } };

  const [reviews, total] = await Promise.all([
    SpecialistReview.find(filter)
      .sort({ priority: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'analysisId', select: 'patientInfo analysisResult' })
      .populate({ path: 'requestedBy', select: 'fullName username' }),
    SpecialistReview.countDocuments(filter)
  ]);

  return sendResponse(res, 200, true, 'Review queue fetched successfully', {
    reviews: reviews.map(toQueueItem),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  });
});

// GET /api/review/my-requests  (PHC_DOCTOR only)
export const getMyRequests = asyncHandler(async (req, res) => {
  const requestedBy = req.user._id || req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { requestedBy };

  const [reviews, total] = await Promise.all([
    SpecialistReview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'analysisId', select: 'patientInfo analysisResult' })
      .populate({ path: 'requestedBy', select: 'fullName username' }),
    SpecialistReview.countDocuments(filter)
  ]);

  return sendResponse(res, 200, true, 'Review requests fetched successfully', {
    requests: reviews.map(toQueueItem),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  });
});
