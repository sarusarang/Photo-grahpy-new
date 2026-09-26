import type { Gallery, MediaItem } from '@/types';
import { getInitialGalleryCover } from './coverImageUtils';

/**
 * Normalizes raw Django REST Framework gallery media item into the frontend MediaItem model.
 */
export const normalizeServerMediaItem = (m: any, defaultGalleryId: string = ''): MediaItem => {
  const fileUrl = m.file_url || m.url || m.file || m.preview_url || m.thumbnail_url || '';
  const thumbUrl = m.thumbnail_url || m.preview_url || fileUrl;
  const rawSize = m.file_size || m.size_bytes || m.sizeBytes || m.size;

  const isVideo =
    m.media_type === 'video' ||
    m.type === 'video' ||
    (typeof fileUrl === 'string' && /\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/i.test(fileUrl));

  return {
    id: String(m.id),
    galleryId: String(m.gallery || m.galleryId || defaultGalleryId),
    type: isVideo ? 'video' : 'photo',
    url: fileUrl,
    thumbnailUrl: thumbUrl,
    title: m.title || m.original_filename || (isVideo ? 'Video Highlight' : 'Photograph'),
    caption: m.caption || '',
    sectionTitle: m.section_title || m.sectionTitle || undefined,
    aspectRatio: m.aspect_ratio || m.aspectRatio || (isVideo ? 1.77 : 1.5),
    width: m.width || (isVideo ? 1920 : 2400),
    height: m.height || (isVideo ? 1080 : 1600),
    sizeMB: m.sizeMB || (rawSize ? Number((rawSize / (1024 * 1024)).toFixed(1)) : (isVideo ? 15 : 2.5)),
    dateAdded: m.created_at || m.dateAdded || new Date().toISOString(),
    isCover: Boolean(m.is_cover ?? m.isCover),
    isFavorite: Boolean(m.is_favorite ?? m.isFavorite),
    duration: m.duration,
    videoEmbedUrl: m.video_embed_url || m.videoEmbedUrl,
  };
};

/**
 * Normalizes raw Django REST Framework gallery object into the frontend Gallery model.
 */
export const normalizeServerGallery = (g: any): Gallery => {
  if (!g) {
    throw new Error('Cannot normalize null or undefined gallery');
  }

  const galleryId = String(g.id);
  const mediaList: MediaItem[] = Array.isArray(g.media)
    ? g.media.map((m: any) => normalizeServerMediaItem(m, galleryId))
    : [];

  const rawSections = g.sections;
  let sections: string[] = [];
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    sections = rawSections.map((s: any) => (typeof s === 'string' ? s : s.title || String(s)));
  }

  const templateId = g.template_id || g.templateId || 'editorial';
  const initialCover = getInitialGalleryCover(templateId);

  const photosCount = g.photos_count ?? g.photosCount ?? mediaList.filter((m) => m.type !== 'video').length;
  const videosCount = g.videos_count ?? g.videosCount ?? mediaList.filter((m) => m.type === 'video').length;
  const totalMediaCount = g.total_media_count ?? g.totalMediaCount ?? (photosCount + videosCount);
  const hasAnyMedia = totalMediaCount > 0 || mediaList.length > 0;

  const mediaUrls = new Set(mediaList.map((m) => m.url));
  const firstPhotoUrl = mediaList.find((m) => m.type !== 'video')?.url || mediaList[0]?.url;

  // Template banners directly from backend response
  const rawBanners: Record<string, string> = {
    ...(g.template_banners || g.templateBanners || {}),
  };
  const templateBanners: Record<string, string> = {};

  for (const [key, url] of Object.entries(rawBanners)) {
    if (!url || typeof url !== 'string' || !url.trim()) continue;
    const cleanUrl = url.trim();
    // If the gallery has loaded media, and url is a storage object that is NOT in mediaList, it was deleted!
    if (mediaList.length > 0 && cleanUrl.includes('/storage_objects/') && !mediaUrls.has(cleanUrl)) {
      continue;
    }
    // Only if the gallery has genuinely 0 media, discard dead storage preview paths
    if (!hasAnyMedia && cleanUrl.includes('/storage_objects/')) {
      continue;
    }
    templateBanners[key] = cleanUrl;
  }

  let serverCover = (g.cover_image || g.coverImage || '').trim();
  if (mediaList.length > 0 && serverCover.includes('/storage_objects/') && !mediaUrls.has(serverCover)) {
    serverCover = '';
  }

  const isValidServerCover =
    Boolean(serverCover) &&
    (hasAnyMedia || !serverCover.includes('/storage_objects/'));

  const rawMasonry = (Array.isArray(g.masonry_banner_images) && g.masonry_banner_images.length > 0)
    ? g.masonry_banner_images
    : (Array.isArray(g.masonryBannerImages) && g.masonryBannerImages.length > 0)
      ? g.masonryBannerImages
      : [];

  const validMasonry = rawMasonry.filter(
    (u: any) =>
      typeof u === 'string' &&
      Boolean(u.trim()) &&
      (hasAnyMedia || !u.includes('/storage_objects/')) &&
      (mediaList.length === 0 || !u.includes('/storage_objects/') || mediaUrls.has(u.trim()))
  );

  // 1. Determine general gallery fallback banner from cover or first photo
  const defaultGalleryBanner =
    (isValidServerCover ? serverCover : undefined) ||
    firstPhotoUrl ||
    Object.values(templateBanners)[0];

  // 2. Determine resolved masonry hero banner
  const resolvedMasonryBanner =
    templateBanners['masonry'] ||
    (validMasonry[0] && validMasonry[0] !== getInitialGalleryCover('masonry') ? validMasonry[0] : undefined) ||
    defaultGalleryBanner ||
    getInitialGalleryCover('masonry');

  const masonryBannerImages =
    validMasonry.length > 0
      ? [...validMasonry]
      : [resolvedMasonryBanner];

  // Keep masonry slot 0 and templateBanners['masonry'] strictly synchronized
  if (templateBanners['masonry']) {
    masonryBannerImages[0] = templateBanners['masonry'];
  } else if (resolvedMasonryBanner) {
    masonryBannerImages[0] = resolvedMasonryBanner;
    templateBanners['masonry'] = resolvedMasonryBanner;
  }

  // Selected banner of the user's current template:
  const currentTemplateBanner =
    templateBanners[templateId] ||
    (templateId === 'masonry' && masonryBannerImages[0] ? masonryBannerImages[0] : undefined) ||
    defaultGalleryBanner ||
    initialCover;

  // Ensure templateBanners has the banner for the current template populated
  if (!templateBanners[templateId]) {
    templateBanners[templateId] = currentTemplateBanner;
  }

  // The cover image MUST be the selected banner of the user's current template
  const resolvedCoverImage = currentTemplateBanner;

  return {
    id: galleryId,
    slug: g.slug || galleryId,
    title: g.title || 'Untitled Shoot',
    clientName: g.client_name || g.clientName || 'Valued Client',
    clientEmail: g.client_email || g.clientEmail || '',
    eventDate: g.event_date || g.eventDate || new Date().toISOString().split('T')[0],
    coverImage: resolvedCoverImage,
    templateId,
    templateBanners,
    masonryBannerImages,
    status: g.status || 'active',
    password: g.password || '',
    isPasswordProtected: Boolean(g.is_password_protected ?? g.isPasswordProtected),
    allowDownloads: Boolean(g.allow_downloads ?? g.allowDownloads ?? true),
    allowFavorites: Boolean(g.allow_favorites ?? g.allowFavorites ?? true),
    expiresAt: g.expires_at !== undefined ? g.expires_at : (g.expiresAt !== undefined ? g.expiresAt : null),
    isExpired: Boolean(g.is_expired ?? g.isExpired ?? false),
    viewsCount: g.views_count ?? g.viewsCount ?? 0,
    downloadsCount: g.downloads_count ?? g.downloadsCount ?? 0,
    favoritesCount: g.favorites_count ?? g.favoritesCount ?? 0,
    photosCount: g.photos_count ?? g.photosCount ?? mediaList.filter((m) => m.type !== 'video').length,
    videosCount: g.videos_count ?? g.videosCount ?? mediaList.filter((m) => m.type === 'video').length,
    sections,
    media: mediaList,
    createdAt: g.created_at || g.createdAt || new Date().toISOString(),
    nextCursor: g.next_cursor || g.nextCursor || g.pagination?.next_cursor || null,
    hasMore: Boolean(g.has_more ?? g.hasMore ?? g.pagination?.has_more ?? false),
    totalMediaCount: g.total_media_count ?? g.totalMediaCount ?? g.pagination?.total_count ?? mediaList.length,
    filteredMediaCount: g.filtered_media_count ?? g.filteredMediaCount ?? mediaList.length,
  };
};

/**
 * Normalizes raw Django REST Framework gallery analytics into GalleryAnalyticsData
 */
export const normalizeServerGalleryAnalytics = (data: any, galleryId: string): import('@/types/analytics').GalleryAnalyticsData => {
  if (!data) {
    throw new Error('Cannot normalize null analytics data');
  }

  const rawTimeline = Array.isArray(data.timeline) ? data.timeline : [];
  const timeline = rawTimeline.map((item: any) => ({
    date: item.date || '',
    shortDate: item.short_date || item.shortDate || item.date || '',
    views: Number(item.views || 0),
    downloads: Number(item.downloads || 0),
    favorites: Number(item.favorites || 0),
  }));

  const rawTopPhotos = Array.isArray(data.top_photos || data.topPhotos)
    ? (data.top_photos || data.topPhotos)
    : [];
  const topPhotos = rawTopPhotos.map((p: any) => ({
    id: String(p.id),
    url: p.url || '',
    title: p.title || 'Untitled',
    sectionTitle: p.section_title || p.sectionTitle,
    views: Number(p.views || 0),
    favorites: Number(p.favorites || 0),
    downloads: Number(p.downloads || 0),
  }));

  const rawActivity = Array.isArray(data.recent_activity || data.recentActivity)
    ? (data.recent_activity || data.recentActivity)
    : [];
  const recentActivity = rawActivity.map((a: any) => ({
    id: String(a.id || Math.random().toString(36).substring(2, 9)),
    type: a.type || a.event_type || 'view',
    title: a.title || 'Gallery Viewed',
    description: a.description || '',
    timestamp: a.timestamp || a.created_at || new Date().toISOString(),
    timeAgo: a.time_ago || a.timeAgo || 'Just now',
    device: a.device || 'desktop',
    location: a.location || 'Unknown',
    mediaTitle: a.media_title || a.mediaTitle,
  }));

  const rawDevices = data.devices || {};
  const rawSources = data.traffic_sources || data.trafficSources || {};

  return {
    galleryId: String(data.gallery_id || data.galleryId || galleryId),
    totalViews: Number(data.total_views ?? data.totalViews ?? 0),
    uniqueVisitors: Number(data.unique_visitors ?? data.uniqueVisitors ?? 0),
    photoImpressions: Number(data.photo_impressions ?? data.photoImpressions ?? 0),
    totalDownloads: Number(data.total_downloads ?? data.totalDownloads ?? 0),
    fullZipDownloads: Number(data.full_zip_downloads ?? data.fullZipDownloads ?? 0),
    favoritesCount: Number(data.favorites_count ?? data.favoritesCount ?? 0),
    sharesCount: Number(data.shares_count ?? data.sharesCount ?? 0),
    avgSessionDuration: data.avg_session_duration || data.avgSessionDuration || '0m 00s',
    bounceRate: data.bounce_rate || data.bounceRate || '0%',
    devices: {
      mobile: Number(rawDevices.mobile ?? 0),
      desktop: Number(rawDevices.desktop ?? 0),
      tablet: Number(rawDevices.tablet ?? 0),
    },
    trafficSources: {
      directLink: Number(rawSources.direct_link ?? rawSources.directLink ?? 0),
      email: Number(rawSources.email ?? 0),
      social: Number(rawSources.social ?? 0),
      qrCode: Number(rawSources.qr_code ?? rawSources.qrCode ?? 0),
    },
    timeline,
    topPhotos,
    recentActivity,
    lastUpdated: data.last_updated || data.lastUpdated || new Date().toISOString(),
  };
};
