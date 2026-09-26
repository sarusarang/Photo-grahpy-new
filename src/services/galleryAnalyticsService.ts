import type { Gallery, MediaItem } from '../types';
import type {
  GalleryAnalyticsData,
  GalleryDailyStat,
  GalleryActivityEvent,
  GalleryPhotoPerformance,
} from '../types/analytics';

const STORAGE_PREFIX = 'photo_saas_analytics_';

/**
 * Generate dates array working backwards from today
 */
function generateDates(days: number): { label: string; short: string }[] {
  const dates: { label: string; short: string }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const shortMonth = String(d.getMonth() + 1).padStart(2, '0');
    const shortDay = String(day).padStart(2, '0');
    dates.push({
      label: `${month} ${day}`,
      short: `${shortMonth}/${shortDay}`,
    });
  }

  return dates;
}

/**
 * Seed initial realistic analytics tailored to the gallery's current metadata
 */
function seedGalleryAnalytics(gallery: Gallery): GalleryAnalyticsData {
  const baseViews = gallery.viewsCount || 240;
  const baseDownloads = gallery.downloadsCount || Math.round(baseViews * 0.28);
  const uniqueVisitors = Math.round(baseViews * 0.68);
  const photoImpressions = baseViews * Math.max(gallery.media.length > 0 ? 12 : 5, 8);
  const fullZipDownloads = Math.max(1, Math.round(baseDownloads * 0.35));
  const favoritesCount = gallery.media.filter((m) => m.isFavorite).length || Math.round(baseViews * 0.15);
  const sharesCount = Math.round(baseViews * 0.08) + 2;

  // Generate 30 days timeline
  const days30 = generateDates(30);
  const timeline: GalleryDailyStat[] = days30.map((d, index) => {
    // Generate realistic curve with recent activity spike
    const weight = (index + 1) / 30;
    const dailyViews = Math.max(1, Math.round((baseViews / 25) * (0.4 + Math.sin(index * 0.5) * 0.3 + weight * 0.6)));
    const dailyDownloads = Math.round(dailyViews * 0.25);
    const dailyFavorites = Math.round(dailyViews * 0.18);

    return {
      date: d.label,
      shortDate: d.short,
      views: dailyViews,
      downloads: dailyDownloads,
      favorites: dailyFavorites,
    };
  });

  // Top photos performance
  const topPhotos: GalleryPhotoPerformance[] = (gallery.media || []).slice(0, 8).map((m: MediaItem, i: number) => {
    const photoViews = Math.max(14, Math.round(baseViews * (0.85 - i * 0.08)));
    const photoFavs = m.isFavorite ? Math.max(6, Math.round(photoViews * 0.35)) : Math.round(photoViews * 0.12);
    const photoDl = Math.round(photoViews * 0.2);

    return {
      id: m.id,
      url: m.url,
      title: m.title || `Photo #${i + 1}`,
      sectionTitle: m.sectionTitle,
      views: photoViews,
      favorites: photoFavs,
      downloads: photoDl,
    };
  });

  // Recent client activity
  const recentActivity: GalleryActivityEvent[] = [
    {
      id: `act-${Date.now()}-1`,
      type: 'view',
      title: 'Client Link Opened',
      description: `${gallery.clientName} opened gallery viewing link on iOS Safari.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      timeAgo: '12m ago',
      device: 'mobile',
      location: 'New York, US',
    },
    {
      id: `act-${Date.now()}-2`,
      type: 'favorite',
      title: 'Photo Favorited',
      description: `Added "${topPhotos[0]?.title || 'Ceremony Highlight'}" to client album selection.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      timeAgo: '35m ago',
      device: 'mobile',
      mediaTitle: topPhotos[0]?.title,
    },
    {
      id: `act-${Date.now()}-3`,
      type: 'download_all',
      title: 'Master Archive Downloaded',
      description: 'Downloaded full high-resolution ZIP collection (142 photos).',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      timeAgo: '3h ago',
      device: 'desktop',
      location: 'San Francisco, US',
    },
    {
      id: `act-${Date.now()}-4`,
      type: 'share',
      title: 'Gallery Shared',
      description: 'Private link shared via WhatsApp message.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
      timeAgo: '7h ago',
      device: 'mobile',
    },
    {
      id: `act-${Date.now()}-5`,
      type: 'unlock',
      title: 'PIN Access Verified',
      description: 'Private passcode successfully entered from Chrome on macOS.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      timeAgo: 'Yesterday',
      device: 'desktop',
    },
  ];

  return {
    galleryId: gallery.id,
    totalViews: baseViews,
    uniqueVisitors,
    photoImpressions,
    totalDownloads: baseDownloads,
    fullZipDownloads,
    favoritesCount,
    sharesCount,
    avgSessionDuration: '6m 14s',
    bounceRate: '11.4%',
    devices: {
      mobile: 67,
      desktop: 28,
      tablet: 5,
    },
    trafficSources: {
      directLink: 56,
      email: 24,
      social: 14,
      qrCode: 6,
    },
    timeline,
    topPhotos,
    recentActivity,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Retrieve analytics for a specific gallery
 */
export function getGalleryAnalytics(
  gallery: Gallery,
  timeRange: '7d' | '30d' | 'all' = '30d'
): GalleryAnalyticsData {
  const key = `${STORAGE_PREFIX}${gallery.id}`;
  let data: GalleryAnalyticsData;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      data = JSON.parse(raw);
    } else {
      data = seedGalleryAnalytics(gallery);
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    data = seedGalleryAnalytics(gallery);
  }

  // Filter timeline according to requested time range
  let timeline = data.timeline;
  if (timeRange === '7d') {
    timeline = data.timeline.slice(-7);
  } else if (timeRange === '30d') {
    timeline = data.timeline.slice(-30);
  }

  return {
    ...data,
    timeline,
  };
}

/**
 * Save analytics back to localStorage and notify listeners
 */
function persistAndNotify(data: GalleryAnalyticsData): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${data.galleryId}`, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent('gallery_analytics_updated', {
        detail: { galleryId: data.galleryId, data },
      })
    );
  } catch (err) {
    console.error('Failed to save gallery analytics:', err);
  }
}

/**
 * Record a client page view event
 */
export function recordGalleryView(
  gallery: Gallery,
  options?: {
    device?: 'mobile' | 'desktop' | 'tablet';
    location?: string;
  }
): GalleryAnalyticsData {
  const current = getGalleryAnalytics(gallery, 'all');
  const device =
    options?.device ||
    (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop');
  const location = options?.location || 'Direct Client Link';

  const updatedViews = current.totalViews + 1;
  const updatedVisitors = current.uniqueVisitors + 1;
  const updatedImpressions = current.photoImpressions + (gallery.media?.length || 10);

  // Update today's timeline entry
  const updatedTimeline = [...current.timeline];
  const lastIndex = updatedTimeline.length - 1;
  if (lastIndex >= 0) {
    updatedTimeline[lastIndex] = {
      ...updatedTimeline[lastIndex],
      views: updatedTimeline[lastIndex].views + 1,
    };
  }

  const newEvent: GalleryActivityEvent = {
    id: `act-${Date.now()}`,
    type: 'view',
    title: 'Client Gallery Viewed',
    description: `Viewed on ${device === 'mobile' ? 'Smartphone' : device === 'desktop' ? 'Desktop' : 'Tablet'}.`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    device,
    location,
  };

  const updated: GalleryAnalyticsData = {
    ...current,
    totalViews: updatedViews,
    uniqueVisitors: updatedVisitors,
    photoImpressions: updatedImpressions,
    timeline: updatedTimeline,
    recentActivity: [newEvent, ...current.recentActivity.slice(0, 14)],
    lastUpdated: new Date().toISOString(),
  };

  persistAndNotify(updated);
  return updated;
}

/**
 * Record download event (ZIP or individual photos)
 */
export function recordGalleryDownload(
  gallery: Gallery,
  count: number = 1,
  isZip: boolean = false
): GalleryAnalyticsData {
  const current = getGalleryAnalytics(gallery, 'all');

  const updatedDownloads = current.totalDownloads + count;
  const updatedZipDownloads = isZip ? current.fullZipDownloads + 1 : current.fullZipDownloads;

  // Update today's timeline entry
  const updatedTimeline = [...current.timeline];
  const lastIndex = updatedTimeline.length - 1;
  if (lastIndex >= 0) {
    updatedTimeline[lastIndex] = {
      ...updatedTimeline[lastIndex],
      downloads: updatedTimeline[lastIndex].downloads + count,
    };
  }

  const newEvent: GalleryActivityEvent = {
    id: `act-${Date.now()}`,
    type: isZip ? 'download_all' : 'download_single',
    title: isZip ? 'Master Archive Downloaded' : 'Photos Downloaded',
    description: isZip
      ? `Downloaded full gallery archive (${gallery.media.length} photos).`
      : `Saved ${count} high-resolution photograph${count > 1 ? 's' : ''}.`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    device: window.innerWidth < 768 ? 'mobile' : 'desktop',
  };

  const updated: GalleryAnalyticsData = {
    ...current,
    totalDownloads: updatedDownloads,
    fullZipDownloads: updatedZipDownloads,
    timeline: updatedTimeline,
    recentActivity: [newEvent, ...current.recentActivity.slice(0, 14)],
    lastUpdated: new Date().toISOString(),
  };

  persistAndNotify(updated);
  return updated;
}

/**
 * Record a favorite action
 */
export function recordGalleryFavorite(
  gallery: Gallery,
  photoTitle?: string
): GalleryAnalyticsData {
  const current = getGalleryAnalytics(gallery, 'all');
  const updatedFavorites = current.favoritesCount + 1;

  const updatedTimeline = [...current.timeline];
  const lastIndex = updatedTimeline.length - 1;
  if (lastIndex >= 0) {
    updatedTimeline[lastIndex] = {
      ...updatedTimeline[lastIndex],
      favorites: updatedTimeline[lastIndex].favorites + 1,
    };
  }

  const newEvent: GalleryActivityEvent = {
    id: `act-${Date.now()}`,
    type: 'favorite',
    title: 'Photo Added to Favorites',
    description: photoTitle
      ? `"${photoTitle}" marked for album print selection.`
      : 'Client favorited photograph.',
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    mediaTitle: photoTitle,
  };

  const updated: GalleryAnalyticsData = {
    ...current,
    favoritesCount: updatedFavorites,
    timeline: updatedTimeline,
    recentActivity: [newEvent, ...current.recentActivity.slice(0, 14)],
    lastUpdated: new Date().toISOString(),
  };

  persistAndNotify(updated);
  return updated;
}

/**
 * Simulate an instant live client interaction for testing and demoing
 */
export function simulateLiveVisitor(gallery: Gallery): GalleryAnalyticsData {
  const cities = ['New York, US', 'London, UK', 'Milan, IT', 'Paris, FR', 'Sydney, AU', 'Toronto, CA'];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const devices: ('mobile' | 'desktop' | 'tablet')[] = ['mobile', 'mobile', 'desktop', 'tablet'];
  const randomDevice = devices[Math.floor(Math.random() * devices.length)];

  return recordGalleryView(gallery, {
    device: randomDevice,
    location: randomCity,
  });
}

/**
 * Export Gallery Analytics to CSV format
 */
export function exportGalleryAnalyticsCSV(
  analytics: GalleryAnalyticsData,
  galleryTitle: string
): void {
  const rows: string[][] = [
    ['GALLERY ENGAGEMENT & PERFORMANCE REPORT'],
    ['Gallery Title', galleryTitle],
    ['Report Generated', new Date().toLocaleString()],
    [''],
    ['KEY PERFORMANCE INDICATORS'],
    ['Metric', 'Value'],
    ['Total Client Views', String(analytics.totalViews)],
    ['Unique Visitors', String(analytics.uniqueVisitors)],
    ['Photo Impressions', String(analytics.photoImpressions)],
    ['Total Downloads', String(analytics.totalDownloads)],
    ['Full ZIP Downloads', String(analytics.fullZipDownloads)],
    ['Client Favorites', String(analytics.favoritesCount)],
    ['Shares & Links Copied', String(analytics.sharesCount)],
    ['Avg Session Duration', analytics.avgSessionDuration],
    ['Bounce Rate', analytics.bounceRate],
    [''],
    ['DEVICE BREAKDOWN'],
    ['Device', 'Share (%)'],
    ['Mobile', `${analytics.devices.mobile}%`],
    ['Desktop', `${analytics.devices.desktop}%`],
    ['Tablet', `${analytics.devices.tablet}%`],
    [''],
    ['DAILY TIMELINE (LAST 30 DAYS)'],
    ['Date', 'Views', 'Downloads', 'Favorites'],
  ];

  analytics.timeline.forEach((day) => {
    rows.push([day.date, String(day.views), String(day.downloads), String(day.favorites)]);
  });

  if (analytics.topPhotos.length > 0) {
    rows.push(['']);
    rows.push(['TOP PERFORMING PHOTOGRAPHS']);
    rows.push(['Photo Title', 'Section', 'Views', 'Favorites', 'Downloads']);
    analytics.topPhotos.forEach((p) => {
      rows.push([
        p.title,
        p.sectionTitle || 'General',
        String(p.views),
        String(p.favorites),
        String(p.downloads),
      ]);
    });
  }

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `${galleryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-analytics-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
