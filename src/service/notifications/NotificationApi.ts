import { CommonApi } from '@/lib/CommonApi';
import type {
  NotificationsListResponse,
  MarkReadResponse,
  GenericNotificationActionResponse,
  StudioNotification,
  StudioNotificationSettings,
} from './type';

/**
 * 1. Retrieve Studio Notifications List from Backend
 * Endpoint: GET /api/notifications/
 */
export const GetNotificationsApi = async (params?: {
  is_read?: boolean;
  type?: string;
  limit?: number;
}): Promise<NotificationsListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.is_read !== undefined) {
    searchParams.append('is_read', String(params.is_read));
  }
  if (params?.type && params.type !== 'all') {
    searchParams.append('type', params.type);
  }
  if (params?.limit) {
    searchParams.append('limit', String(params.limit));
  }

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = (await CommonApi('GET', `/api/notifications/${queryStr}`)) as unknown;

  // Handle standard DRF wrapper { results, unread_count, total_count }
  if (res && typeof res === 'object' && 'results' in res && Array.isArray((res as any).results)) {
    const obj = res as any;
    return {
      unread_count: typeof obj.unread_count === 'number' ? obj.unread_count : 0,
      total_count: typeof obj.total_count === 'number' ? obj.total_count : obj.results.length,
      results: obj.results as StudioNotification[],
    };
  }

  // Handle direct array response fallback
  if (Array.isArray(res)) {
    const unread = res.filter((item: any) => !item.is_read && !item.isRead).length;
    return {
      unread_count: unread,
      total_count: res.length,
      results: res as StudioNotification[],
    };
  }

  return {
    unread_count: 0,
    total_count: 0,
    results: [],
  };
};

/**
 * 2. Mark Single Notification as Read
 * Endpoint: POST /api/notifications/<id>/read/
 */
export const MarkNotificationReadApi = async (
  notificationId: string
): Promise<MarkReadResponse> => {
  return (await CommonApi(
    'POST',
    `/api/notifications/${notificationId}/read/`,
    {}
  )) as MarkReadResponse;
};

/**
 * 3. Mark All Notifications as Read Atomically
 * Endpoint: POST /api/notifications/mark-all-read/
 */
export const MarkAllNotificationsReadApi = async (): Promise<GenericNotificationActionResponse> => {
  return (await CommonApi(
    'POST',
    '/api/notifications/mark-all-read/',
    {}
  )) as GenericNotificationActionResponse;
};

/**
 * 4. Delete Single Notification
 * Endpoint: DELETE /api/notifications/<id>/
 */
export const DeleteNotificationApi = async (
  notificationId: string
): Promise<GenericNotificationActionResponse> => {
  return (await CommonApi(
    'DELETE',
    `/api/notifications/${notificationId}/`
  )) as GenericNotificationActionResponse;
};

/**
 * 5. Clear All Notifications for Current Studio
 * Endpoint: DELETE /api/notifications/clear-all/
 */
export const ClearAllNotificationsApi = async (): Promise<GenericNotificationActionResponse> => {
  return (await CommonApi(
    'DELETE',
    '/api/notifications/clear-all/'
  )) as GenericNotificationActionResponse;
};

/**
 * 6. Retrieve Studio Notification Settings
 * Endpoint: GET /api/notifications/settings/
 */
export const GetNotificationSettingsApi = async (): Promise<StudioNotificationSettings> => {
  const res = (await CommonApi('GET', '/api/notifications/settings/')) as any;
  if (res && typeof res === 'object') {
    if (res.settings && typeof res.settings === 'object') {
      return res.settings as StudioNotificationSettings;
    }
    return res as StudioNotificationSettings;
  }
  return {
    email_inquiries: true,
    inapp_inquiries: true,
    email_gallery_visited: true,
    email_gallery_download: true,
    inapp_gallery_activity: true,
    email_event_activity: true,
    inapp_event_activity: true,
    email_billing_alerts: true,
    inapp_billing_alerts: true,
    email_storage_warnings: true,
    inapp_storage_warnings: true,
    email_weekly_digest: true,
  };
};

/**
 * 7. Update Studio Notification Settings
 * Endpoint: PATCH /api/notifications/settings/
 */
export const UpdateNotificationSettingsApi = async (
  payload: Partial<StudioNotificationSettings>
): Promise<StudioNotificationSettings> => {
  const res = (await CommonApi('PATCH', '/api/notifications/settings/', payload)) as any;
  if (res && typeof res === 'object') {
    if (res.settings && typeof res.settings === 'object') {
      return res.settings as StudioNotificationSettings;
    }
    return res as StudioNotificationSettings;
  }
  return payload as StudioNotificationSettings;
};
