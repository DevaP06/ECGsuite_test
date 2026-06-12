import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import Notification from '../models/Notification.js';

const VALID_CATEGORIES = ['diagnosis', 'review', 'alert'];

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { userId, dismissed: false };

  if (req.query.category !== undefined) {
    const category = String(req.query.category);
    if (!VALID_CATEGORIES.includes(category)) {
      return sendResponse(res, 400, false, `category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    filter.category = category;
  }

  if (String(req.query.unreadOnly) === 'true') {
    filter.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, dismissed: false, read: false }),
  ]);

  return sendResponse(res, 200, true, 'Notifications fetched', {
    notifications,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    unreadCount,
  });
});

// PATCH /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const result = await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  return sendResponse(res, 200, true, 'All notifications marked as read', { modifiedCount: result.modifiedCount });
});

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid notification ID');
  }
  const userId = req.user._id || req.user.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: { read: true } },
    { new: true }
  );
  if (!notification) return sendResponse(res, 404, false, 'Notification not found');

  return sendResponse(res, 200, true, 'Notification marked as read', { notification });
});

// PATCH /api/notifications/:id/dismiss
export const dismissNotification = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'Invalid notification ID');
  }
  const userId = req.user._id || req.user.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: { dismissed: true } },
    { new: true }
  );
  if (!notification) return sendResponse(res, 404, false, 'Notification not found');

  return sendResponse(res, 200, true, 'Notification dismissed', { notification });
});
