// Local-only persistence for notification read/dismissed state and per-user
// notification preferences. No backend notification endpoint exists yet —
// mirrors the `ecg:clinicalContext:submitted:*` local-persistence pattern so
// this is ready to be backed by a real API later without changing callers.

const READ_KEY = 'ecg:notifications:read';
const DISMISSED_KEY = 'ecg:notifications:dismissed';
const PREFERENCES_KEY = 'ecg:notifications:preferences';

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

export interface NotificationPreferences {
  diagnosisUpdates: boolean;
  reviewUpdates: boolean;
  emergencyAlerts: boolean;
  emailDigest: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  diagnosisUpdates: true,
  reviewUpdates: true,
  emergencyAlerts: true,
  emailDigest: false,
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}
