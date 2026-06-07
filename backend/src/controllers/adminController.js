import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import User from '../models/User.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import AuditLog from '../models/AuditLog.js';
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
  const VALID_ENTITY_TYPES = ['USER', 'ECG_ANALYSIS', 'SPECIALIST_REVIEW'];

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
