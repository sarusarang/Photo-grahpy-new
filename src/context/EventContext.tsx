import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { LiveEvent, EventStats } from '../types/event';
import type { MediaItem } from '../types';
import type { Gallery } from '@/types/atelier';
import { normalizeServerEvent } from '@/utils/eventNormalizer';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useRestoreEvent,
  useUpdateEventQR,
  useMoveEventToGallery,
} from '@/hooks/useAtelierQueries';
import { TetherPhotoUploadApi, DeleteEventMediaApi } from '@/service/events/EventApi';
import { useQueryClient } from '@tanstack/react-query';

interface EventContextType {
  events: LiveEvent[];
  activeLiveEvents: LiveEvent[];
  upcomingEvents: LiveEvent[];
  pastEvents: LiveEvent[];
  trashEvents: LiveEvent[];
  isLoading: boolean;
  getEventByIdOrSlug: (idOrSlug: string) => LiveEvent | undefined;
  createEvent: (data: Partial<LiveEvent>) => Promise<LiveEvent>;
  updateEvent: (eventId: string, updates: Partial<LiveEvent>) => Promise<void>;
  deleteEvent: (eventId: string, permanent?: boolean) => Promise<void>;
  restoreEvent: (eventId: string, targetStatus?: 'live' | 'upcoming') => Promise<void>;
  addMediaToEvent: (
    eventId: string,
    items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]
  ) => void;
  removeMediaFromEvent: (eventId: string, mediaId: string) => Promise<void>;
  updateEventBanner: (eventId: string, bannerUrl: string) => Promise<void>;
  updateQRExpiry: (
    eventId: string,
    expiresAt: string,
    durationHours: number | 'custom'
  ) => Promise<void>;
  toggleAutoSync: (eventId: string) => void;
  simulateTetherShot: (eventId: string) => MediaItem | null;
  moveEventToGallery: (
    eventId: string,
    targetMode: 'new' | 'existing',
    targetGalleryId: string | undefined,
    categoryAssignments: Record<string, string>, // mediaId -> sectionTitle
    newGalleryTitle?: string
  ) => Promise<Gallery | null>;
  incrementEventStat: (eventId: string, statKey: keyof EventStats) => void;
  resetEventsData: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Prevent event API trigger on public/auth routes (home page '/', login page '/login', etc.)
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const shouldFetchEvents = Boolean(isAuthenticated && isDashboardRoute);

  const { data: apiEvents, isLoading } = useEvents(undefined, {
    enabled: shouldFetchEvents,
  });
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const restoreEventMutation = useRestoreEvent();
  const updateQRMutation = useUpdateEventQR();
  const moveEventMutation = useMoveEventToGallery();

  // Normalize server events — 100% live backend API response with zero mock fallbacks
  const events = useMemo<LiveEvent[]>(() => {
    if (apiEvents && Array.isArray(apiEvents)) {
      return apiEvents.map((e: any) => normalizeServerEvent(e));
    }
    return [];
  }, [apiEvents]);

  const activeLiveEvents = useMemo(() => {
    return events.filter((e) => e.status === 'live');
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return events.filter((e) => e.status === 'upcoming');
  }, [events]);

  const pastEvents = useMemo(() => {
    return events.filter((e) => e.status === 'completed' || e.status === 'moved_to_gallery');
  }, [events]);

  const trashEvents = useMemo(() => {
    return events.filter((e) => e.status === 'trash' || e.status === 'archived');
  }, [events]);

  const getEventByIdOrSlug = useCallback(
    (idOrSlug: string): LiveEvent | undefined => {
      if (!idOrSlug) return undefined;
      const query = idOrSlug.trim().toLowerCase();
      return events.find(
        (e) => e.id.toLowerCase() === query || e.slug.toLowerCase() === query
      );
    },
    [events]
  );

  const createEvent = useCallback(
    async (data: Partial<LiveEvent>): Promise<LiveEvent> => {
      const res = await createEventMutation.mutateAsync({
        title: data.title || 'Untitled Event',
        event_type: data.eventType || 'wedding',
        venue: data.venue,
        city: data.city,
        client_name: data.clientName,
        client_contact: data.clientContact,
        event_date: data.eventDate,
        event_time: data.eventTime,
        status: data.status || 'live',
        banner_url: data.bannerUrl,
        qr_duration_hours: data.qrSettings?.durationHours || 4,
        qr_expires_at: data.qrSettings?.expiresAt,
        qr_valid_from: data.qrSettings?.validFrom,
      });
      return normalizeServerEvent(res);
    },
    [createEventMutation]
  );

  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<LiveEvent>) => {
      await updateEventMutation.mutateAsync({
        id: eventId,
        updates,
      });
    },
    [updateEventMutation]
  );

  const deleteEvent = useCallback(
    async (eventId: string, permanent: boolean = false) => {
      await deleteEventMutation.mutateAsync({ id: eventId, permanent });
    },
    [deleteEventMutation]
  );

  const restoreEvent = useCallback(
    async (eventId: string, targetStatus: 'live' | 'upcoming' = 'upcoming') => {
      await restoreEventMutation.mutateAsync({ id: eventId, targetStatus });
    },
    [restoreEventMutation]
  );

  const addMediaToEvent = useCallback(
    (_eventId: string, _items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]) => {
      // In real backend mode, media files are uploaded as multipart Files via TetherPhotoUploadApi
      // Query cache is automatically invalidated upon completion
    },
    []
  );

  const removeMediaFromEvent = useCallback(
    async (eventId: string, mediaId: string) => {
      try {
        await DeleteEventMediaApi(eventId, mediaId);
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      } catch (err) {
        console.error('Failed to remove event media:', err);
      }
    },
    [queryClient]
  );

  const updateEventBanner = useCallback(
    async (eventId: string, bannerUrl: string) => {
      await updateEventMutation.mutateAsync({
        id: eventId,
        updates: { banner_url: bannerUrl },
      });
    },
    [updateEventMutation]
  );

  const updateQRExpiry = useCallback(
    async (
      eventId: string,
      expiresAt: string,
      durationHours: number | 'custom'
    ) => {
      await updateQRMutation.mutateAsync({
        eventId,
        durationHours,
        expiresAt,
      });
    },
    [updateQRMutation]
  );

  const toggleAutoSync = useCallback(
    async (eventId: string) => {
      const current = getEventByIdOrSlug(eventId);
      if (!current) return;
      await updateEventMutation.mutateAsync({
        id: eventId,
        updates: { auto_sync_enabled: !current.autoSyncEnabled },
      });
    },
    [getEventByIdOrSlug, updateEventMutation]
  );

  const simulateTetherShot = useCallback((_eventId: string): MediaItem | null => {
    // Deprecated simulation: replaced by live camera hardware capture and hot-folder watcher
    return null;
  }, []);

  const moveEventToGallery = useCallback(
    async (
      eventId: string,
      targetMode: 'new' | 'existing',
      targetGalleryId: string | undefined,
      categoryAssignments: Record<string, string>,
      newGalleryTitle?: string
    ): Promise<Gallery | null> => {
      const res = await moveEventMutation.mutateAsync({
        eventId,
        payload: {
          target_mode: targetMode,
          target_gallery_id: targetMode === 'existing' ? (targetGalleryId || null) : null,
          new_gallery_title: targetMode === 'new' ? newGalleryTitle : undefined,
          category_assignments: categoryAssignments,
        },
      });
      return res || null;
    },
    [moveEventMutation]
  );

  const incrementEventStat = useCallback(
    (_eventId: string, _statKey: keyof EventStats) => {
      // Backend automatically aggregates analytics on view / scan / search
    },
    []
  );

  const resetEventsData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }, [queryClient]);

  return (
    <EventContext.Provider
      value={{
        events,
        activeLiveEvents,
        upcomingEvents,
        pastEvents,
        trashEvents,
        isLoading,
        getEventByIdOrSlug,
        createEvent,
        updateEvent,
        deleteEvent,
        restoreEvent,
        addMediaToEvent,
        removeMediaFromEvent,
        updateEventBanner,
        updateQRExpiry,
        toggleAutoSync,
        simulateTetherShot,
        moveEventToGallery,
        incrementEventStat,
        resetEventsData,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
