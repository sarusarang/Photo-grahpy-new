/**
 * Global Media Upload Configuration
 *
 * Reads batch sizes and concurrency dynamically from environment variables (.env / .env.local)
 * with robust, high-performance fallbacks:
 * - VITE_UPLOAD_BATCH_SIZE: Batch size for photos/images (default: 30)
 * - VITE_VIDEO_UPLOAD_BATCH_SIZE: Batch size for videos (default: 2)
 * - VITE_MAX_BATCH_BYTES: Max bytes per chunk (default: 25MB)
 * - VITE_UPLOAD_CONCURRENCY: Parallel batch upload streams (default: 3)
 */

export const getUploadBatchSize = (isVideo: boolean = false): number => {
  if (isVideo) {
    const rawVideo = import.meta.env.VITE_VIDEO_UPLOAD_BATCH_SIZE;
    const parsed = Number(rawVideo);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_VIDEO_BATCH_SIZE;
  }

  const rawPhoto = import.meta.env.VITE_UPLOAD_BATCH_SIZE;
  const parsed = Number(rawPhoto);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_UPLOAD_BATCH_SIZE;
};

export const getMaxBatchBytes = (): number => {
  const rawBytes = import.meta.env.VITE_MAX_BATCH_BYTES;
  const parsed = Number(rawBytes);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_BATCH_BYTES;
};

export const getUploadConcurrency = (): number => {
  const rawConcurrency = import.meta.env.VITE_UPLOAD_CONCURRENCY;
  const parsed = Number(rawConcurrency);
  // Allow 1 to 5 parallel streams for maximum network pipe utilization without overloading browser
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(Math.max(1, parsed), 5) : DEFAULT_UPLOAD_CONCURRENCY;
};

export const DEFAULT_UPLOAD_BATCH_SIZE = 30;
export const DEFAULT_VIDEO_BATCH_SIZE = 2;
export const DEFAULT_MAX_BATCH_BYTES = 25 * 1024 * 1024; // 25 MB
export const DEFAULT_UPLOAD_CONCURRENCY = 3;
