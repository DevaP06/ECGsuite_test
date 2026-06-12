import AxiosInstance from '../AxiosInstance';
import type { UserSettings, UpdateSettingsPayload, NotificationPreferences } from '../types/settings';

// ─── Settings service ──────────────────────────────────────────────────────
// Calls are proxied through AxiosInstance (base URL + auth headers set there).
// Endpoints are mounted under /api/settings and guarded by `protect` only —
// every authenticated role has its own Settings document.
// Responses are wrapped as { success, message, data: {...} } via sendResponse().

function unwrap<T>(res: { data: unknown }): T {
  const body = res.data as Record<string, unknown>;
  return (body.data ?? body) as T;
}

export const settingsService = {
  // GET /api/settings
  async getSettings(): Promise<UserSettings> {
    const res = await AxiosInstance.get<unknown>('/api/settings');
    return unwrap<{ settings: UserSettings }>(res).settings;
  },

  // PATCH /api/settings
  async updateSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
    const res = await AxiosInstance.patch<unknown>('/api/settings', payload);
    return unwrap<{ settings: UserSettings }>(res).settings;
  },

  // PATCH /api/settings/notifications
  async updateNotificationPreferences(payload: Partial<NotificationPreferences>): Promise<UserSettings> {
    const res = await AxiosInstance.patch<unknown>('/api/settings/notifications', payload);
    return unwrap<{ settings: UserSettings }>(res).settings;
  },
};
