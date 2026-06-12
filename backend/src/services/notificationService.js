import Notification from '../models/Notification.js';

/**
 * Fire-and-forget notification creation. Never throws — a failed notification
 * write must not break the request that triggered it (mirrors auditService).
 */
export function notify({ userId, category, title, description, link, sourceType, sourceId }) {
  if (!userId) return;

  Notification.create({
    userId,
    category,
    title,
    description: description ?? null,
    link: link ?? null,
    sourceType: sourceType ?? null,
    sourceId: sourceId ?? null,
  }).catch((err) => {
    console.error('[notification] Failed to create notification:', err.message);
  });
}
