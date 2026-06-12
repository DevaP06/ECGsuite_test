import type { UserRole } from './rbac';

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  authProvider: 'local' | 'google';
  phone?: string;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: Pagination;
}

// ─── Audit logs ───────────────────────────────────────────────────────────────
export type AuditAction = 'LOGIN' | 'REGISTER' | 'LOGOUT' | 'UPLOAD' | 'DELETE' | 'UPDATE' | 'VIEW' | 'REVIEW';

export type AuditEntityType =
  | 'USER' | 'ECG_ANALYSIS' | 'SPECIALIST_REVIEW' | 'PATIENT'
  | 'PATIENT_HISTORY' | 'ANNOTATION' | 'VALIDATION' | 'FEEDBACK'
  | 'ONTOLOGY_RULE' | 'MODEL_VERSION';

export interface AuditLogEntry {
  _id: string;
  userId?: string | null;
  entityType: AuditEntityType;
  entityId?: string | null;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  userId?: string;
  from?: string;
  to?: string;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  pagination: Pagination;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  users: {
    total: number;
    suspended: number;
    byRole: Record<string, number>;
  };
  analyses: {
    total: number;
    byStatus: Record<string, number>;
    last24h: number;
  };
}

// ─── System health ───────────────────────────────────────────────────────────
export interface SystemHealth {
  server: {
    uptimeSeconds: number;
    nodeVersion: string;
    memoryMb: number;
  };
  analysisQueue: {
    total: number;
    byStatus: { uploaded: number; processing: number; pending: number };
  };
  throughput24h: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    avgProcessingSeconds: number | null;
  };
  reviewQueue: {
    critical: number;
    urgent: number;
    normal: number;
    total: number;
  };
  auditActivity: {
    eventsLastHour: number;
  };
}

// ─── Model versions ──────────────────────────────────────────────────────────
export interface ModelVersion {
  _id: string;
  name: string;
  version: string;
  description?: string;
  framework?: string;
  accuracy?: number | null;
  active: boolean;
  deployedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: { _id: string; username: string; email: string } | string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateModelPayload {
  name: string;
  version: string;
  description?: string;
  framework?: string;
  accuracy?: number;
}

// ─── Program reports ──────────────────────────────────────────────────────────
export interface AdminReports {
  period: { days: number; since: string };
  analyses: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    emergencies: number;
    emergencyRate: number;
    avgProcessingSeconds: number | null;
    dailyTrend: Array<{ date: string; uploads: number; completed: number; failed: number }>;
  };
  reviews: {
    total: number;
    completed: number;
    pending: number;
    critical: number;
    completionRate: number;
    activeCardiologists: number;
  };
  users: {
    totalPatients: number;
    registrationTrend: Array<{ date: string; count: number }>;
  };
  diagnostics: {
    rhythmDistribution: Array<{ rhythm: string; count: number }>;
  };
}
