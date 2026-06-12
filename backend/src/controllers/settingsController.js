import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import Settings from '../models/Settings.js';

const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_DENSITIES = ['comfortable', 'compact'];
const NOTIFICATION_KEYS = ['diagnosisUpdates', 'reviewUpdates', 'emergencyAlerts', 'emailDigest'];

const getOrCreateSettings = (userId) =>
  Settings.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true }
  );

// GET /api/settings
export const getSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const settings = await getOrCreateSettings(userId);
  return sendResponse(res, 200, true, 'Settings fetched', { settings });
});

// PATCH /api/settings — accepts partial { appearance?, notifications?, privacy? }
export const updateSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { appearance, notifications, privacy } = req.body ?? {};
  const $set = {};

  if (appearance !== undefined) {
    if (typeof appearance !== 'object' || appearance === null) {
      return sendResponse(res, 400, false, 'appearance must be an object');
    }
    if (appearance.theme !== undefined) {
      if (!VALID_THEMES.includes(appearance.theme)) {
        return sendResponse(res, 400, false, `appearance.theme must be one of: ${VALID_THEMES.join(', ')}`);
      }
      $set['appearance.theme'] = appearance.theme;
    }
    if (appearance.density !== undefined) {
      if (!VALID_DENSITIES.includes(appearance.density)) {
        return sendResponse(res, 400, false, `appearance.density must be one of: ${VALID_DENSITIES.join(', ')}`);
      }
      $set['appearance.density'] = appearance.density;
    }
  }

  if (notifications !== undefined) {
    if (typeof notifications !== 'object' || notifications === null) {
      return sendResponse(res, 400, false, 'notifications must be an object');
    }
    for (const key of NOTIFICATION_KEYS) {
      if (notifications[key] !== undefined) {
        if (typeof notifications[key] !== 'boolean') {
          return sendResponse(res, 400, false, `notifications.${key} must be a boolean`);
        }
        $set[`notifications.${key}`] = notifications[key];
      }
    }
  }

  if (privacy !== undefined) {
    if (typeof privacy !== 'object' || privacy === null) {
      return sendResponse(res, 400, false, 'privacy must be an object');
    }
    if (privacy.shareAnonymizedDataForResearch !== undefined) {
      if (typeof privacy.shareAnonymizedDataForResearch !== 'boolean') {
        return sendResponse(res, 400, false, 'privacy.shareAnonymizedDataForResearch must be a boolean');
      }
      $set['privacy.shareAnonymizedDataForResearch'] = privacy.shareAnonymizedDataForResearch;
    }
  }

  if (Object.keys($set).length === 0) {
    return sendResponse(res, 400, false, 'No valid settings fields provided');
  }

  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set, $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true }
  );

  return sendResponse(res, 200, true, 'Settings updated', { settings });
});

// PATCH /api/settings/notifications — accepts a partial NotificationPreferences object directly
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const body = req.body ?? {};
  const $set = {};

  for (const key of NOTIFICATION_KEYS) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'boolean') {
        return sendResponse(res, 400, false, `${key} must be a boolean`);
      }
      $set[`notifications.${key}`] = body[key];
    }
  }

  if (Object.keys($set).length === 0) {
    return sendResponse(res, 400, false, `No valid notification preference fields provided. Expected one or more of: ${NOTIFICATION_KEYS.join(', ')}`);
  }

  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set, $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true }
  );

  return sendResponse(res, 200, true, 'Notification settings updated', { settings });
});
