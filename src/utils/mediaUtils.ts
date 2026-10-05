/**
 * Media detection and format utilities.
 */

export type MediaLike = { type?: string; url?: string } | string | null | undefined;

export const isVideoMedia = (item?: MediaLike): boolean => {
  if (!item) return false;
  if (typeof item === 'string') {
    const url = item.toLowerCase();
    return (
      url.endsWith('.mp4') ||
      url.endsWith('.mov') ||
      url.endsWith('.webm') ||
      url.includes('mixkit.co/videos') ||
      url.includes('video')
    );
  }
  if (item.type === 'video') return true;
  const url = (item.url || '').toLowerCase();
  return (
    url.endsWith('.mp4') ||
    url.endsWith('.mov') ||
    url.endsWith('.webm') ||
    url.includes('mixkit.co/videos') ||
    url.includes('video')
  );
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
};
