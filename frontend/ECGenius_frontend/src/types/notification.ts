export type NotificationCategory = 'diagnosis' | 'review' | 'alert';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}
