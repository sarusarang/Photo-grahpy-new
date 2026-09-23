export interface GalleryDailyStat {
  date: string; // e.g. "Sep 18"
  shortDate: string; // e.g. "09/18"
  views: number;
  downloads: number;
  favorites: number;
}

export interface GalleryActivityEvent {
  id: string;
  type: 'view' | 'download_all' | 'download_single' | 'favorite' | 'share' | 'unlock';
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  device?: 'mobile' | 'desktop' | 'tablet';
  location?: string;
  mediaTitle?: string;
}

export interface GalleryPhotoPerformance {
  id: string;
  url: string;
  title: string;
  sectionTitle?: string;
  views: number;
  favorites: number;
  downloads: number;
}

export interface GalleryAnalyticsData {
  galleryId: string;
  totalViews: number;
  uniqueVisitors: number;
  photoImpressions: number;
  totalDownloads: number;
  fullZipDownloads: number;
  favoritesCount: number;
  sharesCount: number;
  avgSessionDuration: string;
  bounceRate: string;
  devices: {
    mobile: number; // percentage
    desktop: number;
    tablet: number;
  };
  trafficSources: {
    directLink: number; // percentage
    email: number;
    social: number;
    qrCode: number;
  };
  timeline: GalleryDailyStat[];
  topPhotos: GalleryPhotoPerformance[];
  recentActivity: GalleryActivityEvent[];
  lastUpdated: string;
}
