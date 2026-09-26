import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LiveEvent, EventStats } from '../types/event';
import type { MediaItem, Gallery } from '../types';
import { INITIAL_EVENTS, TETHER_SIMULATION_PHOTOS, getExpiryDateHoursAhead } from '../data/eventData';
import { useGallery } from './GalleryContext';

interface EventContextType {
  events: LiveEvent[];
  activeLiveEvents: LiveEvent[];
  upcomingEvents: LiveEvent[];
  pastEvents: LiveEvent[];
  getEventByIdOrSlug: (idOrSlug: string) => LiveEvent | undefined;
  createEvent: (data: Partial<LiveEvent>) => LiveEvent;
  updateEvent: (eventId: string, updates: Partial<LiveEvent>) => void;
  deleteEvent: (eventId: string) => void;
  addMediaToEvent: (
    eventId: string,
    items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]
  ) => void;
  removeMediaFromEvent: (eventId: string, mediaId: string) => void;
  updateEventBanner: (eventId: string, bannerUrl: string) => void;
  updateQRExpiry: (
    eventId: string,
    expiresAt: string,
    durationHours: number | 'custom'
  ) => void;
  toggleAutoSync: (eventId: string) => void;
  simulateTetherShot: (eventId: string) => MediaItem | null;
  moveEventToGallery: (
    eventId: string,
    targetMode: 'new' | 'existing',
    targetGalleryId: string | undefined,
    categoryAssignments: Record<string, string>, // mediaId -> sectionTitle
    newGalleryTitle?: string
  ) => Gallery | null;
  incrementEventStat: (eventId: string, statKey: keyof EventStats) => void;
  resetEventsData: () => void;
}

const EVENTS_STORAGE_KEY = 'photo_saas_events_v2';

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { createGallery, addMediaToGallery, galleries } = useGallery();

  const [events, setEvents] = useState<LiveEvent[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved && (saved.includes('Royal Venetian') || saved.includes('Milano Fashion'))) {
        localStorage.removeItem(EVENTS_STORAGE_KEY);
        return [];
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed saving events to localStorage:', e);
    }
  }, [events]);

  const activeLiveEvents = useMemo(() => {
    return events.filter((e) => e.status === 'live');
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return events.filter((e) => e.status === 'upcoming');
  }, [events]);

  const pastEvents = useMemo(() => {
    return events.filter((e) => e.status === 'completed' || e.status === 'moved_to_gallery');
  }, [events]);

  const getEventByIdOrSlug = useCallback(
    (idOrSlug: string): LiveEvent | undefined => {
      const query = (idOrSlug || '').trim().toLowerCase();
      return events.find(
        (e) => e.id.toLowerCase() === query || e.slug.toLowerCase() === query
      );
    },
    [events]
  );

  const createEvent = useCallback((data: Partial<LiveEvent>): LiveEvent => {
    const id = `evt-${Date.now()}`;
    const slugBase = (data.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Math.floor(100 + Math.random() * 900)}`;

    const duration = data.qrSettings?.durationHours || 4;
    const expiresAt =
      data.qrSettings?.expiresAt ||
      getExpiryDateHoursAhead(typeof duration === 'number' ? duration : 4);

    const newEvent: LiveEvent = {
      id,
      slug,
      title: data.title || 'Untitled Live Event',
      clientName: data.clientName || 'Private Client',
      clientContact: data.clientContact || '',
      eventType: data.eventType || 'wedding',
      status: data.status || 'live',
      bannerUrl:
        data.bannerUrl ||
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85',
      eventDate: data.eventDate || new Date().toISOString().split('T')[0],
      eventTime: data.eventTime || '18:00',
      venue: data.venue || 'Private Venue',
      city: data.city || '',
      description: data.description || '',
      qrSettings: {
        validFrom: data.qrSettings?.validFrom || new Date().toISOString(),
        expiresAt,
        durationHours: duration,
        isActive: true,
        allowGuestUploads: false,
        ...(data.qrSettings || {}),
      },
      media: data.media || [],
      autoSyncEnabled: data.status === 'live',
      tetherCount: 0,
      stats: {
        views: 0,
        qrScans: 0,
        aiSearches: 0,
        matchesFound: 0,
        downloadsCount: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  }, []);

  const updateEvent = useCallback((eventId: string, updates: Partial<LiveEvent>) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : evt
      )
    );
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
  }, []);

  const addMediaToEvent = useCallback(
    (
      eventId: string,
      items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]
    ) => {
      const nowStr = new Date().toISOString().split('T')[0];
      const newItems: MediaItem[] = items.map((it, idx) => ({
        ...it,
        id: `evt-m-${Date.now()}-${idx}`,
        galleryId: eventId,
        dateAdded: nowStr,
      }));

      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          return {
            ...evt,
            media: [...newItems, ...evt.media], // newest on top
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const removeMediaFromEvent = useCallback((eventId: string, mediaId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          media: evt.media.filter((m) => m.id !== mediaId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const updateEventBanner = useCallback((eventId: string, bannerUrl: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              bannerUrl,
              updatedAt: new Date().toISOString(),
            }
          : evt
      )
    );
  }, []);

  const updateQRExpiry = useCallback(
    (
      eventId: string,
      expiresAt: string,
      durationHours: number | 'custom'
    ) => {
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          return {
            ...evt,
            qrSettings: {
              ...evt.qrSettings,
              expiresAt,
              durationHours,
              isActive: new Date(expiresAt).getTime() > Date.now(),
            },
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const toggleAutoSync = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              autoSyncEnabled: !evt.autoSyncEnabled,
              updatedAt: new Date().toISOString(),
            }
          : evt
      )
    );
  }, []);

  // Simulate an instant tethering shot landed from the photographer's camera buffer
  const simulateTetherShot = useCallback((eventId: string): MediaItem | null => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return null;

    const pool = TETHER_SIMULATION_PHOTOS;
    const randomItem = pool[Math.floor(Math.random() * pool.length)];

    const nowStr = new Date().toISOString().split('T')[0];
    const newMedia: MediaItem = {
      id: `evt-tether-${Date.now()}`,
      galleryId: eventId,
      type: 'photo',
      url: randomItem.url,
      thumbnailUrl: randomItem.url,
      title: `${randomItem.title} #${(target.tetherCount || 0) + 1}`,
      caption: randomItem.caption,
      sectionTitle: randomItem.sectionTitle,
      aspectRatio: randomItem.aspectRatio || 1.5,
      width: 2400,
      height: 1600,
      sizeMB: Number((8.5 + Math.random() * 4).toFixed(1)),
      dateAdded: nowStr,
      isFavorite: false,
    };

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          tetherCount: (evt.tetherCount || 0) + 1,
          media: [newMedia, ...evt.media],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return newMedia;
  }, [events]);

  const moveEventToGallery = useCallback(
    (
      eventId: string,
      targetMode: 'new' | 'existing',
      targetGalleryId: string | undefined,
      categoryAssignments: Record<string, string>,
      newGalleryTitle?: string
    ): Gallery | null => {
      const targetEvent = events.find((e) => e.id === eventId);
      if (!targetEvent) return null;

      // Apply the photographer's categorized titles to all media items
      const categorizedMedia: MediaItem[] = targetEvent.media.map((m) => {
        const assignedSection = categoryAssignments[m.id] || m.sectionTitle || 'GENERAL';
        return {
          ...m,
          sectionTitle: assignedSection.toUpperCase(),
        };
      });

      // Extract unique sections
      const sections = Array.from(
        new Set(categorizedMedia.map((m) => m.sectionTitle).filter(Boolean) as string[])
      );

      let finalGallery: Gallery | null = null;

      if (targetMode === 'new') {
        finalGallery = createGallery({
          title: newGalleryTitle || targetEvent.title,
          clientName: targetEvent.clientName,
          clientEmail: targetEvent.clientContact,
          eventDate: targetEvent.eventDate,
          coverImage: targetEvent.bannerUrl || categorizedMedia[0]?.url,
          templateId: 'editorial', // Default to Editorial
          media: categorizedMedia,
          sections: sections.length > 0 ? sections : ['CEREMONY', 'RECEPTION', 'PORTRAITS'],
          status: 'active',
          allowDownloads: true,
          allowFavorites: true,
        });
      } else if (targetMode === 'existing' && targetGalleryId) {
        addMediaToGallery(
          targetGalleryId,
          categorizedMedia.map((m) => ({
            type: m.type,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            title: m.title,
            caption: m.caption,
            sectionTitle: m.sectionTitle,
            aspectRatio: m.aspectRatio,
            width: m.width,
            height: m.height,
            sizeMB: m.sizeMB,
            isFavorite: m.isFavorite,
          }))
        );
        finalGallery = galleries.find((g) => g.id === targetGalleryId) || null;
      }

      // Mark the event as moved to gallery and link to the gallery
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          return {
            ...evt,
            status: 'moved_to_gallery',
            associatedGalleryId: finalGallery?.id || targetGalleryId,
            autoSyncEnabled: false,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      return finalGallery;
    },
    [events, createGallery, addMediaToGallery, galleries]
  );

  const incrementEventStat = useCallback(
    (eventId: string, statKey: keyof EventStats) => {
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          return {
            ...evt,
            stats: {
              ...evt.stats,
              [statKey]: (evt.stats[statKey] || 0) + 1,
            },
          };
        })
      );
    },
    []
  );

  const resetEventsData = useCallback(() => {
    setEvents(INITIAL_EVENTS);
    try {
      localStorage.removeItem(EVENTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <EventContext.Provider
      value={{
        events,
        activeLiveEvents,
        upcomingEvents,
        pastEvents,
        getEventByIdOrSlug,
        createEvent,
        updateEvent,
        deleteEvent,
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
