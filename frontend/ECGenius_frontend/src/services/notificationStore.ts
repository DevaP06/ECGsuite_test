// Local-only persistence for the CARDIOLOGIST review-queue notification feed,
// which is derived client-side from a shared queue (see utils/notifications.ts)
// and has no per-user backend record to track read/dismissed state against.
// PATIENT/PHC_DOCTOR feeds are backed by /api/notifications and track this
// state server-side instead (see services/notificationService.ts).

const READ_KEY = 'ecg:notifications:read';
const DISMISSED_KEY = 'ecg:notifications:dismissed';

function readIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

export function getReadIds(): Set<string> {
  return readIdSet(READ_KEY);
}

export function markAsRead(id: string): Set<string> {
  const next = getReadIds();
  next.add(id);
  writeIdSet(READ_KEY, next);
  return next;
}

export function markAllAsRead(ids: string[]): Set<string> {
  const next = getReadIds();
  ids.forEach((id) => next.add(id));
  writeIdSet(READ_KEY, next);
  return next;
}

export function getDismissedIds(): Set<string> {
  return readIdSet(DISMISSED_KEY);
}

export function dismiss(id: string): Set<string> {
  const next = getDismissedIds();
  next.add(id);
  writeIdSet(DISMISSED_KEY, next);
  return next;
}
