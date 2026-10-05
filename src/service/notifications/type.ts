export type NotificationType =
  | 'inquiry'
  | 'gallery'
  | 'event'
  | 'plan'
  | 'storage'
  | 'system';

export type NotificationPriority = 'info' | 'normal' | 'high' | 'urgent';

export interface StudioNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  description?: string;
  is_read: boolean;
  isRead?: boolean;
  action_url?: string;
  actionUrl?: string;
  action_label?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  time_ago?: string;
}

export interface NotificationsListResponse {
  status?: string;
  unread_count: number;
  total_count: number;
  results: StudioNotification[];
}

export interface MarkReadResponse {
  status: string;
  message: string;
  unread_count: number;
  notification?: StudioNotification;
}

export interface GenericNotificationActionResponse {
  status: string;
  message: string;
  unread_count: number;
  total_count?: number;
}

export interface StudioNotificationSettings {
  id?: string;
  // Inquiry alerts
  email_inquiries: boolean;
  inapp_inquiries: boolean;

  // Gallery & client activity
  email_gallery_visited: boolean;
  email_gallery_download: boolean;
  inapp_gallery_activity: boolean;

  // Live events activity
  email_event_activity: boolean;
  inapp_event_activity: boolean;

  // Subscription, Billing & auto-pay
  email_billing_alerts: boolean;
  inapp_billing_alerts: boolean;

  // Storage & cloud quotas
  email_storage_warnings: boolean;
  inapp_storage_warnings: boolean;

  // Analytics & summaries
  email_weekly_digest: boolean;

  updated_at?: string;
}

export interface NotificationSettingsResponse {
  success?: boolean;
  status?: string;
  settings: StudioNotificationSettings;
  message?: string;
}
