/**
 * Direct-to-R2 Media Upload Service (Method B Unified & Enterprise Bulk Presign)
 *
 * Implements high-throughput direct binary uploading to Cloudflare R2:
 * 1. Enterprise Bulk Presign & Bulk Confirm: Batches metadata (e.g. 30-50 files per chunk),
 *    reducing 3,600 server hits down to just 72 for 1,800 photos!
 * 2. Parallel Concurrency Streams: Streams multiple binary files straight to Cloudflare R2 edge
 * 3. Graceful Fallback: Auto-falls back to single-item Method B or Method A if backend is unmigrated
 * 4. Accurate byte metrics, real-time speed (MB/s), ETA, and pause/resume support
 */

import { CommonApi } from '@/lib/CommonApi';
import { normalizeServerMediaItem } from '@/utils/galleryNormalizer';
import {
  executeBatchUpload,
  createAbortError,
  type BatchUploadPauseController,
} from '@/utils/batchUploadRunner';
import { getUploadConcurrency, getUploadBatchSize } from '@/utils/uploadConfig';
import type { MediaItem } from '@/types/atelier';
import type {
  BulkUploadGalleryMediaResponse,
  DirectR2InitPayload,
  DirectR2InitResponse,
  DirectR2ConfirmPayload,
  DirectR2ConfirmResponse,
  DirectR2BulkInitPayload,
  DirectR2BulkInitResponse,
  DirectR2BulkConfirmPayload,
  DirectR2BulkConfirmResponse,
} from './type';

/**
 * Resolves accurate MIME types for common photography, RAW, and video files.
 * If browser reports empty string or generic octet-stream, falls back to extension.
 */
export const getSafeMimeType = (file: File, explicitType?: 'photo' | 'video'): string => {
  if (file.type && file.type.trim().length > 0 && file.type !== 'application/octet-stream') {
    return file.type;
  }

  const name = file.name.toLowerCase();

  // Common Photography Formats
  if (/\.(jpe?g)$/i.test(name)) return 'image/jpeg';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  if (/\.(heic|heif)$/i.test(name)) return 'image/heic';
  if (/\.gif$/i.test(name)) return 'image/gif';
  if (/\.(tif|tiff)$/i.test(name)) return 'image/tiff';
  if (/\.bmp$/i.test(name)) return 'image/bmp';
  if (/\.avif$/i.test(name)) return 'image/avif';

  // Professional Camera RAW Formats
  if (/\.(cr2|cr3)$/i.test(name)) return 'image/x-canon-cr2';
  if (/\.nef$/i.test(name)) return 'image/x-nikon-nef';
  if (/\.arw$/i.test(name)) return 'image/x-sony-arw';
  if (/\.dng$/i.test(name)) return 'image/x-adobe-dng';
  if (/\.rw2$/i.test(name)) return 'image/x-panasonic-rw2';
  if (/\.orf$/i.test(name)) return 'image/x-olympus-orf';

  // Video Formats
  if (/\.mp4$/i.test(name)) return 'video/mp4';
  if (/\.mov$/i.test(name)) return 'video/quicktime';
  if (/\.webm$/i.test(name)) return 'video/webm';
  if (/\.mkv$/i.test(name)) return 'video/x-matroska';
  if (/\.avi$/i.test(name)) return 'video/x-msvideo';
  if (/\.m4v$/i.test(name)) return 'video/x-m4v';
  if (/\.3gp$/i.test(name)) return 'video/3gpp';

  if (explicitType === 'video') return 'video/mp4';
  if (explicitType === 'photo') return 'image/jpeg';

  return 'application/octet-stream';
};

/**
 * Detects whether a file is a video based on MIME or file extension.
 */
export const isVideoMedia = (file: File, explicitType?: 'photo' | 'video'): boolean => {
  if (explicitType === 'video') return true;
  if (explicitType === 'photo') return false;
  if (file.type && file.type.startsWith('video/')) return true;
  return /\.(mp4|mov|webm|mkv|avi|m4v|3gp|wmv|flv)$/i.test(file.name);
};

export interface DirectR2UploadItemParams {
  galleryId: string;
  file: File;
  sectionTitle?: string;
  mediaType?: 'photo' | 'video';
  onProgress?: (percent: number, loadedBytes?: number) => void;
  signal?: AbortSignal;
  pauseController?: BatchUploadPauseController;
}

/**
 * Streams raw binary File directly to Cloudflare R2 via presigned PUT URL.
 *
 * CRITICAL REQUIREMENTS FOR R2:
 * 1. Isolated client — NO Authorization header or session cookies sent to Cloudflare R2.
 * 2. Body must be the raw File or Blob (NEVER FormData).
 * 3. Content-Type must match the mime_type sent during init.
 */
export const putFileToR2 = async (
  uploadUrl: string,
  file: File | Blob,
  headers?: Record<string, string>,
  onProgress?: (percent: number, loadedBytes?: number) => void,
  signal?: AbortSignal
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(createAbortError('Upload aborted before PUT request'));
    }

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);

    // Set headers specified in presigned init response (e.g. Content-Type)
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => {
        // Guard: NEVER send Authorization or Cookies to Cloudflare R2 presigned URLs
        if (k.toLowerCase() !== 'authorization' && k.toLowerCase() !== 'cookie') {
          xhr.setRequestHeader(k, v);
        }
      });
    }

    // Accurate real-time byte tracking
    if (onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && evt.total > 0) {
          const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
          onProgress(pct, evt.loaded);
        }
      };
    }

    const onAbort = () => {
      xhr.abort();
      reject(createAbortError('Upload aborted by user'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    xhr.onload = () => {
      if (signal) signal.removeEventListener('abort', onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const err: any = new Error(
          `Cloudflare R2 direct PUT failed with status ${xhr.status}: ${xhr.statusText || 'Upload Error'}`
        );
        err.status = xhr.status;
        err.response = { status: xhr.status, data: xhr.responseText };
        reject(err);
      }
    };

    xhr.onerror = () => {
      if (signal) signal.removeEventListener('abort', onAbort);
      reject(new Error('Network error while streaming file directly to Cloudflare R2 (Check CORS policy)'));
    };

    xhr.ontimeout = () => {
      if (signal) signal.removeEventListener('abort', onAbort);
      reject(new Error('Direct upload to Cloudflare R2 timed out after 10 minutes'));
    };

    // 10-minute timeout for large RAW photos or 4K videos
    xhr.timeout = 600000;

    // Send raw binary body directly to R2
    xhr.send(file);
  });
};

/**
 * Fallback to legacy FormData upload (Method A) if backend has not deployed Method B yet
 */
const legacyUploadFallback = async (
  galleryId: string,
  file: File,
  sectionTitle?: string,
  type?: 'photo' | 'video',
  onProgress?: (percent: number, loadedBytes?: number) => void,
  signal?: AbortSignal
): Promise<MediaItem> => {
  const isVideo = isVideoMedia(file, type);
  const formData = new FormData();
  if (isVideo) {
    formData.append('videos', file);
  } else {
    formData.append('photos', file);
  }
  if (sectionTitle) formData.append('section_title', sectionTitle);
  formData.append('type', isVideo ? 'video' : 'photo');

  const res = await CommonApi<any>(
    'POST',
    `/api/galleries/${galleryId}/upload/`,
    formData,
    {
      timeout: isVideo ? 600000 : 300000,
      signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent, progressEvent.loaded);
        }
      },
    }
  );

  let rawItem: any = null;
  if (res?.media && Array.isArray(res.media) && res.media.length > 0) rawItem = res.media[0];
  else if (Array.isArray(res) && res.length > 0) rawItem = res[0];
  else if (res?.data) rawItem = res.data;
  else rawItem = res;

  const normalized = normalizeServerMediaItem(rawItem, galleryId);
  return {
    ...normalized,
    file_url: (normalized as any).url || (normalized as any).file_url || '',
  } as MediaItem;
};

/**
 * Single File Direct-to-R2 Upload (Method B Unified Endpoint)
 *
 * 3-Step Lifecycle:
 * 1. Step 1: Request presigned PUT URL from backend (/api/galleries/{id}/upload/ with action="init")
 * 2. Step 2: PUT raw binary bytes directly to Cloudflare R2
 * 3. Step 3: Confirm upload with backend (/api/galleries/{id}/upload/ with action="confirm")
 */
export const uploadSingleMediaDirectToR2 = async (
  params: DirectR2UploadItemParams
): Promise<MediaItem> => {
  const { galleryId, file, sectionTitle, mediaType, onProgress, signal, pauseController } = params;

  if (signal?.aborted) throw createAbortError();
  if (pauseController) await pauseController.waitIfPaused();

  const isVideo = isVideoMedia(file, mediaType);
  const detectedMediaType: 'photo' | 'video' = isVideo ? 'video' : 'photo';
  const mimeType = getSafeMimeType(file, detectedMediaType);
  const effectiveSection = sectionTitle || 'HIGHLIGHTS';

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Request Presigned URL from Backend
  // ─────────────────────────────────────────────────────────────
  const initPayload: DirectR2InitPayload = {
    action: 'init',
    filename: file.name,
    file_size: file.size,
    mime_type: mimeType,
    media_type: detectedMediaType,
    section_title: effectiveSection,
  };

  let initData: DirectR2InitResponse;
  try {
    initData = await CommonApi<DirectR2InitResponse>(
      'POST',
      `/api/galleries/${galleryId}/upload/`,
      initPayload,
      { signal }
    );
  } catch (initErr: any) {
    const errCode = initErr?.response?.data?.code || initErr?.response?.data?.error_code;
    const isLegacyBackend =
      errCode === 'NO_FILES_PROVIDED' ||
      initErr?.response?.status === 405 ||
      initErr?.response?.data?.error === 'NO_FILES_PROVIDED';

    if (isLegacyBackend) {
      return legacyUploadFallback(galleryId, file, effectiveSection, detectedMediaType, onProgress, signal);
    }
    throw initErr;
  }

  if (!initData || !initData.upload_url || !initData.storage_key) {
    throw new Error('Backend failed to return a valid Cloudflare R2 upload URL and storage key.');
  }

  if (signal?.aborted) throw createAbortError();
  if (pauseController) await pauseController.waitIfPaused();

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Stream Raw File Directly to Cloudflare R2
  // ─────────────────────────────────────────────────────────────
  const putHeaders: Record<string, string> = {
    'Content-Type': mimeType,
    ...(initData.headers || {}),
  };

  await putFileToR2(initData.upload_url, file, putHeaders, onProgress, signal);

  if (signal?.aborted) throw createAbortError();
  if (pauseController) await pauseController.waitIfPaused();

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Confirm Upload with Backend & Register in DB
  // ─────────────────────────────────────────────────────────────
  const confirmPayload: DirectR2ConfirmPayload = {
    action: 'confirm',
    storage_key: initData.storage_key,
    reservation_id: initData.reservation_id,
    original_filename: file.name,
    mime_type: mimeType,
    media_type: initData.media_type || detectedMediaType,
    section_title: initData.section_title || effectiveSection,
    file_size: file.size,
  };

  const confirmRes = await CommonApi<DirectR2ConfirmResponse>(
    'POST',
    `/api/galleries/${galleryId}/upload/`,
    confirmPayload,
    { signal }
  );

  let rawItem: any = null;
  if (confirmRes && Array.isArray(confirmRes.media) && confirmRes.media.length > 0) {
    rawItem = confirmRes.media[0];
  } else if (confirmRes && confirmRes.media && typeof confirmRes.media === 'object') {
    rawItem = confirmRes.media;
  } else if (confirmRes && Array.isArray((confirmRes as any).data)) {
    rawItem = (confirmRes as any).data[0];
  } else if (confirmRes && (confirmRes as any).id) {
    rawItem = confirmRes;
  } else {
    rawItem = {
      id: initData.reservation_id,
      original_filename: file.name,
      file_size: file.size,
      media_type: detectedMediaType,
      storage_key: initData.storage_key,
      section_title: effectiveSection,
    };
  }

  const normalized = normalizeServerMediaItem(rawItem, galleryId);
  return {
    ...normalized,
    file_url: (normalized as any).url || (normalized as any).file_url || '',
  } as MediaItem;
};

export interface DirectR2ChunkUploadParams {
  galleryId: string;
  files: File[];
  sectionTitle?: string;
  mediaType?: 'photo' | 'video';
  concurrency?: number;
  onProgress?: (percent: number, loadedBytes?: number) => void;
  signal?: AbortSignal;
  pauseController?: BatchUploadPauseController;
}

/**
 * Uploads a chunk of files (up to 30-50 files) using Bulk Presign & Bulk Confirm (Enterprise Pattern).
 *
 * Flow:
 * 1. Bulk Init: 1 request to backend for all files in this chunk.
 *    -> If backend returns 400 (not supported yet), automatically falls back to item-by-item uploadSingleMediaDirectToR2!
 * 2. Parallel R2 Streaming: Streams all files directly to Cloudflare R2 using concurrency pool.
 * 3. Bulk Confirm: 1 request to backend confirming all uploaded storage keys.
 *    -> Backend executes a single bulk_create() DB insert!
 */
export const uploadChunkDirectToR2 = async (
  params: DirectR2ChunkUploadParams
): Promise<MediaItem[]> => {
  const {
    galleryId,
    files,
    sectionTitle,
    mediaType,
    concurrency: customConcurrency,
    onProgress,
    signal,
    pauseController,
  } = params;

  if (!files || files.length === 0) return [];

  // Single file shortcut
  if (files.length === 1) {
    const single = await uploadSingleMediaDirectToR2({
      galleryId,
      file: files[0],
      sectionTitle,
      mediaType,
      onProgress,
      signal,
      pauseController,
    });
    return [single];
  }

  if (signal?.aborted) throw createAbortError();
  if (pauseController) await pauseController.waitIfPaused();

  const isVideo = files.some((f) => isVideoMedia(f, mediaType));
  const detectedMediaType: 'photo' | 'video' = isVideo ? 'video' : 'photo';
  const effectiveSection = sectionTitle || 'HIGHLIGHTS';
  const totalChunkBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Attempt Bulk Init (1 lightweight JSON call for all files in chunk)
  // ─────────────────────────────────────────────────────────────
  let bulkInitItems: DirectR2BulkInitResponse['items'] | null = null;

  try {
    const bulkInitPayload: DirectR2BulkInitPayload = {
      action: 'bulk-init',
      files: files.map((f) => ({
        filename: f.name,
        file_size: f.size,
        mime_type: getSafeMimeType(f, detectedMediaType),
        media_type: detectedMediaType,
        section_title: effectiveSection,
      })),
    };

    const initRes = await CommonApi<DirectR2BulkInitResponse | any>(
      'POST',
      `/api/galleries/${galleryId}/upload/`,
      bulkInitPayload,
      { signal }
    );

    if (initRes && Array.isArray(initRes.items) && initRes.items.length === files.length) {
      bulkInitItems = initRes.items;
    }
  } catch (err: any) {
    // If backend doesn't support bulk-init yet, bulkInitItems will remain null and fallback executes
    bulkInitItems = null;
  }

  // ── Fallback: If backend does NOT support bulk-init yet, execute single-item Direct-to-R2
  if (!bulkInitItems) {
    const fallbackResults: MediaItem[] = [];
    const fileLoadedBytes = new Map<number, number>();

    const activeConcurrency = Math.min(files.length, customConcurrency || getUploadConcurrency());
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < files.length) {
        if (signal?.aborted) break;
        if (pauseController) await pauseController.waitIfPaused();
        const currentIndex = nextIndex++;
        const file = files[currentIndex];

        const itemResult = await uploadSingleMediaDirectToR2({
          galleryId,
          file,
          sectionTitle: effectiveSection,
          mediaType: detectedMediaType,
          signal,
          pauseController,
          onProgress: (_itemPct, itemLoaded) => {
            fileLoadedBytes.set(currentIndex, itemLoaded || 0);
            if (onProgress && totalChunkBytes > 0) {
              let totalLoaded = 0;
              fileLoadedBytes.forEach((v) => {
                totalLoaded += v;
              });
              const pct = Math.min(100, Math.round((totalLoaded / totalChunkBytes) * 100));
              onProgress(pct, totalLoaded);
            }
          },
        });

        fallbackResults.push(itemResult);
      }
    };

    const workers = Array.from({ length: activeConcurrency }, () => worker());
    await Promise.all(workers);

    return fallbackResults;
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Parallel PUT directly to Cloudflare R2 Edge
  // ─────────────────────────────────────────────────────────────
  const activeConcurrency = Math.min(files.length, customConcurrency || getUploadConcurrency());
  const fileLoadedBytes = new Map<number, number>();
  const uploadedFiles: Array<{
    file: File;
    initItem: DirectR2BulkInitResponse['items'][0];
  }> = [];

  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < files.length) {
      if (signal?.aborted) break;
      if (pauseController) await pauseController.waitIfPaused();
      const currentIndex = nextIndex++;
      const file = files[currentIndex];
      const initItem = bulkInitItems![currentIndex];

      const putHeaders: Record<string, string> = {
        'Content-Type': getSafeMimeType(file, detectedMediaType),
        ...(initItem.headers || {}),
      };

      await putFileToR2(
        initItem.upload_url,
        file,
        putHeaders,
        (_filePct, loadedBytes) => {
          fileLoadedBytes.set(currentIndex, loadedBytes || 0);
          if (onProgress && totalChunkBytes > 0) {
            let totalLoaded = 0;
            fileLoadedBytes.forEach((v) => {
              totalLoaded += v;
            });
            const pct = Math.min(100, Math.round((totalLoaded / totalChunkBytes) * 100));
            onProgress(pct, totalLoaded);
          }
        },
        signal
      );

      fileLoadedBytes.set(currentIndex, file.size);
      uploadedFiles.push({ file, initItem });
    }
  };

  const workers = Array.from({ length: activeConcurrency }, () => worker());
  await Promise.all(workers);

  if (signal?.aborted) throw createAbortError();
  if (pauseController) await pauseController.waitIfPaused();

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Bulk Confirm with Backend (1 single DB bulk_create call)
  // ─────────────────────────────────────────────────────────────
  const bulkConfirmPayload: DirectR2BulkConfirmPayload = {
    action: 'bulk-confirm',
    items: uploadedFiles.map(({ file, initItem }) => ({
      reservation_id: initItem.reservation_id,
      storage_key: initItem.storage_key,
      original_filename: file.name,
      mime_type: getSafeMimeType(file, detectedMediaType),
      file_size: file.size,
      media_type: initItem.media_type || detectedMediaType,
      section_title: initItem.section_title || effectiveSection,
    })),
  };

  const confirmRes = await CommonApi<DirectR2BulkConfirmResponse | any>(
    'POST',
    `/api/galleries/${galleryId}/upload/`,
    bulkConfirmPayload,
    { signal }
  );

  let rawList: any[] = [];
  if (confirmRes && Array.isArray(confirmRes.media)) {
    rawList = confirmRes.media;
  } else if (confirmRes && Array.isArray(confirmRes.data)) {
    rawList = confirmRes.data;
  } else if (Array.isArray(confirmRes)) {
    rawList = confirmRes;
  } else {
    rawList = uploadedFiles.map(({ file, initItem }) => ({
      id: initItem.reservation_id,
      original_filename: file.name,
      file_size: file.size,
      storage_key: initItem.storage_key,
      media_type: detectedMediaType,
      section_title: effectiveSection,
    }));
  }

  return rawList.map((m) => {
    const item = normalizeServerMediaItem(m, galleryId);
    return {
      ...item,
      file_url: (item as any).url || (item as any).file_url || '',
    } as MediaItem;
  });
};

export interface DirectR2BatchUploadParams {
  galleryId: string;
  files: File[];
  sectionTitle?: string;
  type?: 'photo' | 'video';
  concurrency?: number;
  batchSize?: number;
  onProgress?: (percent: number, statusText?: string, metrics?: any) => void;
  onItemSuccess?: (item: MediaItem, file: File, index: number) => void;
  signal?: AbortSignal;
  pauseController?: BatchUploadPauseController;
}

/**
 * Batch Upload Multiple Photos/Videos Directly to Cloudflare R2
 *
 * Utilizes enterprise chunking (default 30-40 files per metadata chunk) with
 * parallel binary streams to R2:
 * - Real-time metrics: Speed (MB/s), Uploaded MB vs Total MB, Elapsed Time & ETA
 * - Resilient chunk-level retries & safe AbortSignal cancellation
 * - Smooth UI updates and granular completion
 */
export const uploadBatchDirectToR2 = async (
  params: DirectR2BatchUploadParams
): Promise<BulkUploadGalleryMediaResponse> => {
  const {
    galleryId,
    files,
    sectionTitle,
    type,
    concurrency: customConcurrency,
    batchSize: customBatchSize,
    onProgress,
    onItemSuccess,
    signal,
    pauseController,
  } = params;

  if (!files || files.length === 0) {
    return { message: 'No files to upload', total_uploaded: 0, media: [] };
  }

  const isVideoBatch = type === 'video' || files.some((f) => isVideoMedia(f, type));
  const activeConcurrency = customConcurrency || getUploadConcurrency();
  const activeBatchSize = customBatchSize || getUploadBatchSize(isVideoBatch);

  const allMedia: MediaItem[] = [];
  let totalUploaded = 0;
  let lastStorageUsage: any = undefined;

  await executeBatchUpload<File, MediaItem[]>({
    items: files,
    batchSize: activeBatchSize,
    concurrency: activeConcurrency,
    itemLabel: isVideoBatch ? 'video' : 'photo',
    signal,
    pauseController,
    onProgress,
    uploadBatch: async (chunkFiles, onChunkProgress) => {
      return uploadChunkDirectToR2({
        galleryId,
        files: chunkFiles,
        sectionTitle,
        mediaType: type,
        concurrency: activeConcurrency,
        onProgress: onChunkProgress,
        signal,
        pauseController,
      });
    },
    onBatchSuccess: (chunkMedia, chunkFiles) => {
      allMedia.push(...chunkMedia);
      totalUploaded += chunkMedia.length;
      chunkMedia.forEach((item, idx) => {
        onItemSuccess?.(item, chunkFiles[idx] || chunkFiles[0], totalUploaded);
      });
    },
  });

  return {
    message: `Successfully uploaded ${totalUploaded} ${isVideoBatch ? 'video' : 'photo'}(s) directly to Cloudflare R2.`,
    total_uploaded: totalUploaded,
    media: allMedia,
    storage_usage: lastStorageUsage,
  };
};
