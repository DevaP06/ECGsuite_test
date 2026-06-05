import AuditLog from '../models/AuditLog.js';

const getIp = (req) =>
  (req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
  req?.ip ||
  'unknown';

/**
 * Fire-and-forget audit log. Never throws — a failed audit must not break the request.
 */
export function logAction({ req, userId, entityType, entityId, action, oldValue, newValue }) {
  AuditLog.create({
    userId: userId ?? null,
    entityType,
    entityId: entityId ?? null,
    action,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    ipAddress: getIp(req),
    userAgent: req?.headers?.['user-agent'] ?? null
  }).catch((err) => {
    console.error('[audit] Failed to write audit log:', err.message);
  });
}
