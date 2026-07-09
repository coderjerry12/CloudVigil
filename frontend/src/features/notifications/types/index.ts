/**
 * Notification types for CloudVigil — Phase 7
 */

export interface Notification {
  notificationId: string;
  recipientId: string;
  recipientRole: string;
  notificationType: string;
  title: string;
  message: string;
  deliveryChannel: string;
  status: string;
  referenceId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
