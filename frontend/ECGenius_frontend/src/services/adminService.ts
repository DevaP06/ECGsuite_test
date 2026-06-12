import AxiosInstance from '../AxiosInstance';
import type { UserRole } from '../types/rbac';
import type {
  AdminUser,
  UserListQuery,
  UserListResponse,
  UserStatus,
  AuditLogQuery,
  AuditLogListResponse,
  AdminStats,
  SystemHealth,
  AdminReports,
  ModelVersion,
  CreateModelPayload,
} from '../types/admin';

// ─── Admin service ────────────────────────────────────────────────────────────
// All calls are proxied through AxiosInstance (base URL + auth headers set there).
// Every endpoint here is mounted under /api/admin and guarded by
// protect + requireRole('ADMIN') on the backend.
// Responses are wrapped as { success, message, data: {...} } via sendResponse().

function unwrap<T>(res: { data: unknown }): T {
  const body = res.data as Record<string, unknown>;
  return (body.data ?? body) as T;
}

export const adminService = {
  // GET /api/admin/users
  async getUsers(query: UserListQuery = {}): Promise<UserListResponse> {
    const params = new URLSearchParams();
    if (query.page)   params.set('page', String(query.page));
    if (query.limit)  params.set('limit', String(query.limit));
    if (query.role)   params.set('role', query.role);
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);

    const res = await AxiosInstance.get<unknown>(`/api/admin/users?${params.toString()}`);
    return unwrap<UserListResponse>(res);
  },

  // PATCH /api/admin/users/:id/status
  async updateUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
    const res = await AxiosInstance.patch<unknown>(`/api/admin/users/${id}/status`, { status });
    return unwrap<{ user: AdminUser }>(res).user;
  },

  // PATCH /api/admin/users/:id/role
  async updateUserRole(id: string, role: UserRole): Promise<AdminUser> {
    const res = await AxiosInstance.patch<unknown>(`/api/admin/users/${id}/role`, { role });
    return unwrap<{ user: AdminUser }>(res).user;
  },

  // GET /api/admin/audit-logs
  async getAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    if (query.page)       params.set('page', String(query.page));
    if (query.limit)      params.set('limit', String(query.limit));
    if (query.action)     params.set('action', query.action);
    if (query.entityType) params.set('entityType', query.entityType);
    if (query.userId)     params.set('userId', query.userId);
    if (query.from)       params.set('from', query.from);
    if (query.to)         params.set('to', query.to);

    const res = await AxiosInstance.get<unknown>(`/api/admin/audit-logs?${params.toString()}`);
    return unwrap<AuditLogListResponse>(res);
  },

  // GET /api/admin/stats
  async getStats(): Promise<AdminStats> {
    const res = await AxiosInstance.get<unknown>('/api/admin/stats');
    return unwrap<AdminStats>(res);
  },

  // GET /api/admin/health
  async getHealth(): Promise<SystemHealth> {
    const res = await AxiosInstance.get<unknown>('/api/admin/health');
    return unwrap<SystemHealth>(res);
  },

  // GET /api/admin/reports?days=N
  async getReports(days?: number): Promise<AdminReports> {
    const qs = days ? `?days=${days}` : '';
    const res = await AxiosInstance.get<unknown>(`/api/admin/reports${qs}`);
    return unwrap<AdminReports>(res);
  },

  // GET /api/admin/models
  async getModels(): Promise<ModelVersion[]> {
    const res = await AxiosInstance.get<unknown>('/api/admin/models');
    return unwrap<{ models: ModelVersion[] }>(res).models ?? [];
  },

  // POST /api/admin/models
  async createModel(payload: CreateModelPayload): Promise<ModelVersion> {
    const res = await AxiosInstance.post<unknown>('/api/admin/models', payload);
    return unwrap<{ model: ModelVersion }>(res).model;
  },

  // PATCH /api/admin/models/:id/activate
  async activateModel(id: string): Promise<ModelVersion> {
    const res = await AxiosInstance.patch<unknown>(`/api/admin/models/${id}/activate`, {});
    return unwrap<{ model: ModelVersion }>(res).model;
  },
};
