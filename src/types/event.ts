import type { MediaItem } from './index';

export type EventType =
  | 'wedding'
  | 'reception'
  | 'sangeet'
  | 'gala'
  | 'fashion'
  | 'birthday'
  | 'corporate'
  | 'concert'
  | 'anniversary'
  | 'other';

export type EventStatus = 'live' | 'upcoming' | 'completed' | 'moved_to_gallery';

export interface EventQRSettings {
  validFrom: string; // ISO String
  expiresAt: string; // ISO String
  durationHours: number | 'custom';
  isActive: boolean;
  pinCode?: string;
  allowGuestUploads?: boolean;
}

export interface EventStats {
  views: number;
  qrScans: number;
  aiSearches: number;
  matchesFound: number;
  downloadsCount: number;
}

export interface LiveEvent {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  clientContact?: string;
  eventType: EventType;
  status: EventStatus;
  bannerUrl: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM
  venue: string;
  city?: string;
  description?: string;
  qrSettings: EventQRSettings;
  media: MediaItem[];
  associatedGalleryId?: string; // Set when moved to Gallery Drive
  autoSyncEnabled?: boolean;
  tetherCount?: number;
  stats: EventStats;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoCategoryAssignment {
  mediaId: string;
  sectionTitle: string;
}
