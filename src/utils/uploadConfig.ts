/**
 * Global Media Upload Configuration
 *
 * Reads batch sizes dynamically from environment variables (.env) with safe fallbacks:
 * - VITE_UPLOAD_BATCH_SIZE: Batch size for photos/images (default: 20)
 * - VITE_VIDEO_UPLOAD_BATCH_SIZE: Batch size for videos (default: 1)
 */

export const getUploadBatchSize = (isVideo: boolean = false): number => {
  if (isVideo) {
    const rawVideo = import.meta.env.VITE_VIDEO_UPLOAD_BATCH_SIZE;
    const parsed = Number(rawVideo);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  const rawPhoto = import.meta.env.VITE_UPLOAD_BATCH_SIZE;
  const parsed = Number(rawPhoto);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 20;
};

export const DEFAULT_UPLOAD_BATCH_SIZE = 20;
export const DEFAULT_VIDEO_BATCH_SIZE = 1;
