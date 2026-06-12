export type NotificationCategory = 'diagnosis' | 'review' | 'alert';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

// Shape of a document returned by /api/notifications (PATIENT / PHC_DOCTOR feeds).
export interface PersistedNotification {
  _id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  description?: string | null;
  link?: string | null;
  sourceType?: 'ECG_ANALYSIS' | 'SPECIALIST_REVIEW' | null;
  sourceId?: string | null;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: PersistedNotification[];
  pagination: { total: number; page: number; limit: number; pages: number };
  unreadCount: number;
}
