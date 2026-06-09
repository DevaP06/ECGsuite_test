import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import User from '../models/User.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import SpecialistReview from '../models/SpecialistReview.js';
import AuditLog from '../models/AuditLog.js';
import ModelVersion from '../models/ModelVersion.js';
import { logAction } from '../services/auditService.js';

const VALID_ROLES = ['PATIENT', 'PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];
const VALID_STATUSES = ['active', 'inactive', 'suspended'];

// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) {
    const role = String(req.query.role);
    if (!VALID_ROLES.includes(role)) {
      return sendResponse(res, 400, false, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }
    filter.role = role;
  }
  if (req.query.status) {
    const status = String(req.query.status);
    if (!VALID_STATUSES.includes(status)) {
      return sendResponse(res, 400, false, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    filter.status = status;
  }
  if (req.query.search) {
    const s = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { username: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { fullName: { $regex: s, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password -googleId').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return sendResponse(res, 200, true, 'Users fetched successfully', {
    users,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  });
});

// PATCH /api/admin/users/:id/status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const rawId = String(req.params.id);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid user ID');
  }

  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return sendResponse(res, 400, false, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const adminId = req.user._id || req.user.id;
  if (String(rawId) === String(adminId)) {
    return sendResponse(res, 400, false, 'Admins cannot change their own status');
  }

  const user = await User.findById(rawId).select('-password -googleId');
  if (!user) {
    return sendResponse(res, 404, false, 'User not found');
  }

  const oldStatus = user.status;
  user.status = status;
  await user.save();

  logAction({ req, userId: adminId, entityType: 'USER', entityId: user._id, action: 'UPDATE', oldValue: { status: oldStatus }, newValue: { status } });
  return sendResponse(res, 200, true, `User status updated to ${status}`, { user });
});

// PATCH /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const rawId = String(req.params.id);
  if (!rawId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid user ID');
  }

  const { role } = req.body;
  if (!role || !VALID_ROLES.includes(role)) {
    return sendResponse(res, 400, false, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const adminId = req.user._id || req.user.id;
  if (String(rawId) === String(adminId)) {
    return sendResponse(res, 400, false, 'Admins cannot change their own role');
  }

  const user = await User.findById(rawId).select('-password -googleId');
  if (!user) {
    return sendResponse(res, 404, false, 'User not found');
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  logAction({ req, userId: adminId, entityType: 'USER', entityId: user._id, action: 'UPDATE', oldValue: { role: oldRole }, newValue: { role } });
  return sendResponse(res, 200, true, `User role updated to ${role}`, { user });
});

// GET /api/admin/audit-logs
export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const VALID_ACTIONS = ['LOGIN', 'REGISTER', 'LOGOUT', 'UPLOAD', 'DELETE', 'UPDATE', 'VIEW', 'REVIEW'];
  const VALID_ENTITY_TYPES = ['USER', 'ECG_ANALYSIS', 'SPECIALIST_REVIEW', 'PATIENT', 'PATIENT_HISTORY', 'ANNOTATION', 'VALIDATION', 'FEEDBACK', 'ONTOLOGY_RULE'];

  const filter = {};
  if (req.query.action) {
    const action = String(req.query.action);
    if (!VALID_ACTIONS.includes(action)) {
      return sendResponse(res, 400, false, `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
    }
    filter.action = action;
  }
  if (req.query.entityType) {
    const entityType = String(req.query.entityType);
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return sendResponse(res, 400, false, `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }
    filter.entityType = entityType;
  }
  if (req.query.userId) {
    const uid = String(req.query.userId);
    if (!uid.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid userId');
    }
    filter.userId = new mongoose.Types.ObjectId(uid);
  }
  if (req.query.from || req.query.to) {
    filter.timestamp = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (Number.isNaN(from.getTime())) {
        return sendResponse(res, 400, false, 'Invalid "from" date');
      }
      filter.timestamp.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (Number.isNaN(to.getTime())) {
        return sendResponse(res, 400, false, 'Invalid "to" date');
      }
      filter.timestamp.$lte = to;
    }
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter)
  ]);

  return sendResponse(res, 200, true, 'Audit logs fetched', {
    logs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  });
});

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    usersByRole,
    suspendedUsers,
    totalAnalyses,
    analysesByStatus,
    recentUploads
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments({ status: 'suspended' }),
    ECGAnalysis.countDocuments(),
    ECGAnalysis.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ECGAnalysis.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
  ]);

  const roleBreakdown = Object.fromEntries(usersByRole.map(r => [r._id, r.count]));
  const statusBreakdown = Object.fromEntries(analysesByStatus.map(s => [s._id, s.count]));

  return sendResponse(res, 200, true, 'Stats fetched', {
    users: { total: totalUsers, suspended: suspendedUsers, byRole: roleBreakdown },
    analyses: { total: totalAnalyses, byStatus: statusBreakdown, last24h: recentUploads }
  });
});

// GET /api/admin/analyses
export const listAllAnalyses = asyncHandler(async (req, res) => {
  const VALID_ANALYSIS_STATUSES = ['uploaded', 'processing', 'pending', 'completed', 'failed', 'archived'];

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) {
    const status = String(req.query.status);
    if (!VALID_ANALYSIS_STATUSES.includes(status)) {
      return sendResponse(res, 400, false, `Invalid status. Must be one of: ${VALID_ANALYSIS_STATUSES.join(', ')}`);
    }
    filter.status = status;
  }
  if (req.query.userId) {
    const uid = String(req.query.userId);
    if (!uid.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid userId');
    }
    filter.userId = new mongoose.Types.ObjectId(uid);
  }

  const [analyses, total] = await Promise.all([
    ECGAnalysis.find(filter).select('-filePath').sort({ createdAt: -1 }).skip(skip).limit(limit),
    ECGAnalysis.countDocuments(filter)
  ]);

  return sendResponse(res, 200, true, 'Analyses fetched', {
    analyses,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  });
});

// GET /api/admin/reports?days=30  (ADMIN — FR-7 program utilisation reporting)
export const getReports = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [
    uploadTrend,
    completionStats,
    emergencyCount,
    reviewStats,
    registrationTrend,
    rhythmDistribution,
    totalPatients,
    activeCardiologists
  ] = await Promise.all([
    // Daily upload + completion counts for the period
    ECGAnalysis.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        uploads: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]),

    // Overall completion/failure rates
    ECGAnalysis.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        emergencies: { $sum: { $cond: ['$analysisResult.isEmergency', 1, 0] } },
        avgProcessingMs: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$processedAt', null] }, { $ne: ['$createdAt', null] }] },
              { $subtract: ['$processedAt', '$createdAt'] },
              null
            ]
          }
        }
      }}
    ]),

    // Emergency analyses count in period
    ECGAnalysis.countDocuments({ createdAt: { $gte: since }, 'analysisResult.isEmergency': true }),

    // Specialist review summary
    SpecialistReview.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$reviewStatus', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$reviewStatus', 'pending'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } }
      }}
    ]),

    // New user registrations per day
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),

    // Top rhythm classifications from completed analyses
    ECGAnalysis.aggregate([
      { $match: { createdAt: { $gte: since }, status: 'completed', 'analysisResult.rhythm': { $ne: null } } },
      { $group: { _id: '$analysisResult.rhythm', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    // Total registered patients
    User.countDocuments({ role: 'PATIENT' }),

    // Active cardiologists (at least 1 review completed)
    SpecialistReview.distinct('cardiologistId', { reviewStatus: 'completed', reviewDate: { $gte: since } })
  ]);

  const cs = completionStats[0] ?? { total: 0, completed: 0, failed: 0, emergencies: 0, avgProcessingMs: null };
  const rs = reviewStats[0] ?? { total: 0, completed: 0, pending: 0, critical: 0 };

  return sendResponse(res, 200, true, 'Program report fetched successfully', {
    period: { days, since: since.toISOString() },
    analyses: {
      total: cs.total,
      completed: cs.completed,
      failed: cs.failed,
      successRate: cs.total > 0 ? Math.round((cs.completed / cs.total) * 100) : 0,
      emergencies: emergencyCount,
      emergencyRate: cs.completed > 0 ? Math.round((emergencyCount / cs.completed) * 100) : 0,
      avgProcessingSeconds: cs.avgProcessingMs ? Math.round(cs.avgProcessingMs / 1000) : null,
      dailyTrend: uploadTrend.map(d => ({ date: d._id, uploads: d.uploads, completed: d.completed, failed: d.failed }))
    },
    reviews: {
      total: rs.total,
      completed: rs.completed,
      pending: rs.pending,
      critical: rs.critical,
      completionRate: rs.total > 0 ? Math.round((rs.completed / rs.total) * 100) : 0,
      activeCardiologists: activeCardiologists.length
    },
    users: {
      totalPatients,
      registrationTrend: registrationTrend.map(d => ({ date: d._id, count: d.count }))
    },
    diagnostics: {
      rhythmDistribution: rhythmDistribution.map(r => ({ rhythm: r._id, count: r.count }))
    }
  });
});

// GET /api/admin/health  (ADMIN — FR-3 system performance monitoring)
export const getHealth = asyncHandler(async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    queueDepth,
    last24hStats,
    reviewQueueDepth,
    recentAuditActivity
  ] = await Promise.all([
    // Processing queue: how many analyses are stuck in non-terminal states
    ECGAnalysis.aggregate([
      { $match: { status: { $in: ['uploaded', 'processing', 'pending'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Last 24h throughput
    ECGAnalysis.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgProcessingMs: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$processedAt', null] }, { $ne: ['$createdAt', null] }] },
              { $subtract: ['$processedAt', '$createdAt'] },
              null
            ]
          }
        }
      }}
    ]),

    // Specialist review queue pressure
    SpecialistReview.aggregate([
      { $match: { reviewStatus: { $in: ['pending', 'in_review'] } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),

    // Audit log events in the last hour (system activity pulse)
    AuditLog.countDocuments({ timestamp: { $gte: oneHourAgo } })
  ]);

  const queueByStatus = Object.fromEntries(queueDepth.map(q => [q._id, q.count]));
  const reviewByPriority = Object.fromEntries(reviewQueueDepth.map(r => [r._id, r.count]));
  const last24h = last24hStats[0] ?? { total: 0, completed: 0, failed: 0, avgProcessingMs: null };

  const totalQueueDepth = (queueByStatus.uploaded ?? 0) + (queueByStatus.processing ?? 0) + (queueByStatus.pending ?? 0);

  return sendResponse(res, 200, true, 'System health fetched successfully', {
    server: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    },
    analysisQueue: {
      total: totalQueueDepth,
      byStatus: {
        uploaded: queueByStatus.uploaded ?? 0,
        processing: queueByStatus.processing ?? 0,
        pending: queueByStatus.pending ?? 0
      }
    },
    throughput24h: {
      total: last24h.total,
      completed: last24h.completed,
      failed: last24h.failed,
      successRate: last24h.total > 0 ? Math.round((last24h.completed / last24h.total) * 100) : 0,
      avgProcessingSeconds: last24h.avgProcessingMs ? Math.round(last24h.avgProcessingMs / 1000) : null
    },
    reviewQueue: {
      critical: reviewByPriority.critical ?? 0,
      urgent: reviewByPriority.urgent ?? 0,
      normal: reviewByPriority.normal ?? 0,
      total: (reviewByPriority.critical ?? 0) + (reviewByPriority.urgent ?? 0) + (reviewByPriority.normal ?? 0)
    },
    auditActivity: {
      eventsLastHour: recentAuditActivity
    }
  });
});


// ── Model Version Management (Admin FR-4) ────────────────────────────────────

// GET /api/admin/models
export const listModels = asyncHandler(async (req, res) => {
  const models = await ModelVersion.find({})
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username email')
    .select('-__v')
    .lean();

  return sendResponse(res, 200, true, 'Model versions fetched', { models });
});

// POST /api/admin/models
export const createModel = asyncHandler(async (req, res) => {
  const name    = String(req.body.name    ?? '').trim();
  const version = String(req.body.version ?? '').trim();

  if (!name)    return sendResponse(res, 400, false, 'name is required');
  if (!version) return sendResponse(res, 400, false, 'version is required');

  if (req.body.accuracy !== undefined) {
    const acc = Number(req.body.accuracy);
    if (!Number.isFinite(acc) || acc < 0 || acc > 100) {
      return sendResponse(res, 400, false, 'accuracy must be a number between 0 and 100');
    }
  }

  const existing = await ModelVersion.findOne({ name, version }).lean();
  if (existing) return sendResponse(res, 409, false, `Model "${name}" v${version} already exists`);

  const userId = req.user._id || req.user.id;
  const model = await ModelVersion.create({
    name,
    version,
    description:  req.body.description ? String(req.body.description).trim()  : undefined,
    framework:    req.body.framework    ? String(req.body.framework).trim()    : undefined,
    accuracy:     req.body.accuracy     !== undefined ? Number(req.body.accuracy) : null,
    metadata:     req.body.metadata     && typeof req.body.metadata === 'object' ? req.body.metadata : {},
    active:       false,
    createdBy:    userId,
  });

  logAction({ req, userId, entityType: 'MODEL_VERSION', entityId: model._id, action: 'UPDATE', newValue: { name, version } });

  return sendResponse(res, 201, true, 'Model version created', { model });
});

// PATCH /api/admin/models/:id/activate
export const activateModel = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid model ID');
  }

  const model = await ModelVersion.findById(req.params.id);
  if (!model) return sendResponse(res, 404, false, 'Model version not found');
  if (model.active) return sendResponse(res, 409, false, 'This model version is already active');

  // Deactivate every currently-active version, then activate the requested one.
  await ModelVersion.updateMany({ active: true }, { $set: { active: false } });
  model.active     = true;
  model.deployedAt = new Date();
  await model.save();

  const userId = req.user._id || req.user.id;
  logAction({ req, userId, entityType: 'MODEL_VERSION', entityId: model._id, action: 'UPDATE', newValue: { active: true, deployedAt: model.deployedAt } });

  return sendResponse(res, 200, true, 'Model version activated', { model });
});
