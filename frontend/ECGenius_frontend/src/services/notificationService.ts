import AxiosInstance from '../AxiosInstance';
import type { NotificationListResponse, PersistedNotification } from '../types/notification';

// ─── Notification service ──────────────────────────────────────────────────
// Calls are proxied through AxiosInstance (base URL + auth headers set there).
// Endpoints are mounted under /api/notifications and guarded by `protect` only.
// Responses are wrapped as { success, message, data: {...} } via sendResponse().

function unwrap<T>(res: { data: unknown }): T {
  const body = res.data as Record<string, unknown>;
  return (body.data ?? body) as T;
}

export const notificationService = {
  // GET /api/notifications
  async getNotifications(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<NotificationListResponse> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.unreadOnly) search.set('unreadOnly', 'true');

    const res = await AxiosInstance.get<unknown>(`/api/notifications?${search.toString()}`);
    return unwrap<NotificationListResponse>(res);
  },

  // PATCH /api/notifications/:id/read
  async markAsRead(id: string): Promise<PersistedNotification> {
    const res = await AxiosInstance.patch<unknown>(`/api/notifications/${id}/read`);
    return unwrap<{ notification: PersistedNotification }>(res).notification;
  },

  // PATCH /api/notifications/read-all
  async markAllAsRead(): Promise<number> {
    const res = await AxiosInstance.patch<unknown>('/api/notifications/read-all');
    return unwrap<{ modifiedCount: number }>(res).modifiedCount;
  },

  // PATCH /api/notifications/:id/dismiss
  async dismiss(id: string): Promise<PersistedNotification> {
    const res = await AxiosInstance.patch<unknown>(`/api/notifications/${id}/dismiss`);
    return unwrap<{ notification: PersistedNotification }>(res).notification;
  },
};
