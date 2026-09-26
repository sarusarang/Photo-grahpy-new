import type { LiveEvent, EventType, EventStatus } from '@/types/event';
import { normalizeServerMediaItem } from './galleryNormalizer';
import type { MediaItem } from '@/types';

/**
 * Normalizes raw Django REST Framework live event object into the frontend LiveEvent model.
 */
export const normalizeServerEvent = (e: any): LiveEvent => {
  if (!e) {
    throw new Error('Cannot normalize null or undefined live event');
  }

  const eventId = String(e.id);
  const mediaList: MediaItem[] = Array.isArray(e.media)
    ? e.media.map((m: any) => normalizeServerMediaItem(m, eventId))
    : [];

  const rawQr = e.qr_settings || e.qrSettings || {};

  return {
    id: eventId,
    slug: e.slug || eventId,
    title: e.title || 'Live Shoot',
    clientName: e.client_name || e.clientName || 'Valued Client',
    clientContact: e.client_contact || e.clientContact,
    eventType: (e.event_type || e.eventType || 'wedding') as EventType,
    status: (e.status || 'live') as EventStatus,
    bannerUrl:
      e.banner_url ||
      e.bannerUrl ||
      mediaList[0]?.url ||
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    eventDate: e.event_date || e.eventDate || new Date().toISOString().split('T')[0],
    eventTime: e.event_time || e.eventTime,
    venue: e.venue || 'Grand Ballroom',
    city: e.city,
    description: e.description,
    qrSettings: {
      validFrom: rawQr.valid_from || rawQr.validFrom || new Date().toISOString(),
      expiresAt: rawQr.expires_at || rawQr.expiresAt || new Date(Date.now() + 86400000).toISOString(),
      durationHours: rawQr.duration_hours || rawQr.durationHours || 24,
      isActive: Boolean(rawQr.is_active ?? rawQr.isActive ?? true),
      pinCode: rawQr.pin_code || rawQr.pinCode,
      allowGuestUploads: Boolean(rawQr.allow_guest_uploads ?? rawQr.allowGuestUploads ?? false),
    },
    media: mediaList,
    associatedGalleryId: e.associated_gallery_id || e.associatedGalleryId,
    autoSyncEnabled: Boolean(e.auto_sync_enabled ?? e.autoSyncEnabled),
    tetherCount: e.tether_count ?? e.tetherCount ?? 0,
    stats: {
      views: e.stats?.views ?? e.guest_views ?? 0,
      qrScans: e.stats?.qrScans ?? e.qr_scans ?? 0,
      aiSearches: e.stats?.aiSearches ?? e.ai_searches ?? 0,
      matchesFound: e.stats?.matchesFound ?? e.matches_found ?? 0,
      downloadsCount: e.stats?.downloadsCount ?? e.downloads_count ?? 0,
    },
    createdAt: e.created_at || e.createdAt || new Date().toISOString(),
    updatedAt: e.updated_at || e.updatedAt || new Date().toISOString(),
  };
};
