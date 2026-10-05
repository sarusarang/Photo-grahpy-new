import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GetNotificationsApi,
  MarkNotificationReadApi,
  MarkAllNotificationsReadApi,
  DeleteNotificationApi,
  ClearAllNotificationsApi,
  GetNotificationSettingsApi,
  UpdateNotificationSettingsApi,
} from './NotificationApi';
import type {
  NotificationsListResponse,
  MarkReadResponse,
  GenericNotificationActionResponse,
  StudioNotificationSettings,
} from './type';

/**
 * 1. Query Hook: Fetch Live Studio Notifications from Backend
 */
export const useNotifications = (params?: {
  is_read?: boolean;
  type?: string;
  limit?: number;
}) => {
  return useQuery<NotificationsListResponse>({
    queryKey: ['notifications', params?.type, params?.is_read],
    queryFn: () => GetNotificationsApi(params),
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 30, // Polling every 30 seconds for live updates
    refetchOnWindowFocus: true,
  });
};

/**
 * 2. Mutation Hook: Mark Single Notification as Read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: (notificationId: string) => MarkNotificationReadApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      console.warn('Failed to mark notification as read:', err?.message);
    },
  });
};

/**
 * 3. Mutation Hook: Mark All Notifications as Read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<GenericNotificationActionResponse, Error, void>({
    mutationFn: () => MarkAllNotificationsReadApi(),
    onSuccess: (data) => {
      toast.success('All Caught Up', {
        description: data?.message || 'All notifications marked as read.',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', {
        description: err?.message || 'Could not mark notifications as read.',
      });
    },
  });
};

/**
 * 4. Mutation Hook: Delete Single Notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<GenericNotificationActionResponse, Error, string>({
    mutationFn: (notificationId: string) => DeleteNotificationApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error('Delete Failed', {
        description: err?.message || 'Could not delete notification.',
      });
    },
  });
};

/**
 * 5. Mutation Hook: Clear All Notifications
 */
export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation<GenericNotificationActionResponse, Error, void>({
    mutationFn: () => ClearAllNotificationsApi(),
    onSuccess: (data) => {
      toast.success('Notifications Cleared', {
        description: data?.message || 'All notifications removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', {
        description: err?.message || 'Could not clear notifications.',
      });
    },
  });
};

/**
 * 6. Query Hook: Fetch Studio Notification Preferences
 */
export const useNotificationSettings = () => {
  return useQuery<StudioNotificationSettings>({
    queryKey: ['notification-settings'],
    queryFn: () => GetNotificationSettingsApi(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * 7. Mutation Hook: Update Studio Notification Preferences
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<StudioNotificationSettings, Error, Partial<StudioNotificationSettings>>({
    mutationFn: (payload) => UpdateNotificationSettingsApi(payload),
    onSuccess: (data) => {
      toast.success('Preferences Saved', {
        description: 'Your studio notification preferences have been updated.',
      });
      queryClient.setQueryData(['notification-settings'], data);
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
    onError: (err: any) => {
      toast.error('Update Failed', {
        description: err?.message || 'Could not save notification preferences.',
      });
    },
  });
};
