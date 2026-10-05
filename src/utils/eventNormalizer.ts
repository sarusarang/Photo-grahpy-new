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

  // Resolve total storage metrics directly from DRF backend response with resilient fallback
  const rawSizeBytes =
    typeof e.total_size_bytes === 'number'
      ? e.total_size_bytes
      : typeof e.totalSizeBytes === 'number'
        ? e.totalSizeBytes
        : undefined;

  const rawSizeMB =
    typeof e.total_size_mb === 'number'
      ? e.total_size_mb
      : typeof e.totalSizeMB === 'number'
        ? e.totalSizeMB
        : undefined;

  const rawSizeFormatted = e.total_size_formatted || e.totalSizeFormatted;

  // Fallback calculation from loaded media if backend hasn't populated aggregate yet
  const computedBytes = mediaList.reduce((acc, m) => {
    const b = (m as any).size_bytes || (m as any).sizeBytes || (m.sizeMB ? m.sizeMB * 1024 * 1024 : 0);
    return acc + b;
  }, 0);

  const totalSizeBytes = rawSizeBytes !== undefined ? rawSizeBytes : (computedBytes > 0 ? computedBytes : undefined);
  const totalSizeMB =
    rawSizeMB !== undefined
      ? rawSizeMB
      : totalSizeBytes !== undefined
        ? Number((totalSizeBytes / (1024 * 1024)).toFixed(1))
        : undefined;

  const totalSizeFormatted =
    rawSizeFormatted ||
    (totalSizeBytes !== undefined
      ? totalSizeBytes > 1024 * 1024 * 1024
        ? `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : undefined);

  const photosCount =
    e.photos_count ??
    e.photosCount ??
    e.total_photos ??
    e.totalPhotos ??
    e.media_count ??
    e.mediaCount ??
    mediaList.filter((m) => m.type !== 'video').length;
  const videosCount = e.videos_count ?? e.videosCount ?? mediaList.filter((m) => m.type === 'video').length;

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
    totalSizeBytes,
    totalSizeMB,
    totalSizeFormatted,
    photographerName:
      e.photographer_name ||
      e.photographer_full_name ||
      e.photographerName ||
      e.photographer?.fullName ||
      e.photographer?.name ||
      undefined,
    studioName:
      e.studio_name ||
      e.studioName ||
      e.photographer?.studioName ||
      undefined,
    photosCount,
    videosCount,
    totalMediaCount:
      e.total_media_count ??
      e.totalMediaCount ??
      e.total_photos ??
      e.totalPhotos ??
      e.media_count ??
      (photosCount + videosCount > 0 ? photosCount + videosCount : mediaList.length),
    sectionCounts: e.section_counts || e.sectionCounts || undefined,
    createdAt: e.created_at || e.createdAt || new Date().toISOString(),
    updatedAt: e.updated_at || e.updatedAt || new Date().toISOString(),
  };
};
