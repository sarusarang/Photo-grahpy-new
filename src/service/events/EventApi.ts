import { CommonApi } from '@/lib/CommonApi';
import { getUploadBatchSize } from '@/utils/uploadConfig';
import type { LiveEvent, Gallery, MediaItem } from '@/types/atelier';
import type {
  CreateEventPayload,
  MoveEventToGalleryPayload,
  GetEventsParams,
} from './type';

export * from './type';

const isVideoFile = (file: File): boolean =>
  file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(file.name);

/**
 * 1. List Photographer Live Events
 * Endpoint: GET /api/events/?status=...&search=...
 */
export const GetEventsApi = async (params?: GetEventsParams): Promise<LiveEvent[]> => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.search && params.search.trim()) query.append('search', params.search.trim());
  const qs = query.toString() ? `?${query.toString()}` : '';

  const res = await CommonApi<LiveEvent[] | { results?: LiveEvent[]; data?: LiveEvent[] }>('GET', `/api/events/${qs}`);
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as any).results)) return (res as any).results;
  if (res && Array.isArray((res as any).data)) return (res as any).data;
  return [];
};

/**
 * 2. Create Live Event with Automatic QR Expiry
 * Endpoint: POST /api/events/
 */
export const CreateEventApi = async (payload: CreateEventPayload): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('POST', '/api/events/', payload);
};

/**
 * Resilient slug & UUID resolver with 3-tier fallback (primary -> secondary -> search match)
 */
const resolveEventByIdOrSlug = async (
  idOrSlug: string,
  isPublic = false,
  params?: { all_media?: boolean; section?: string }
): Promise<LiveEvent> => {
  if (!idOrSlug) throw new Error('Event ID or slug is required');
  const encoded = encodeURIComponent(idOrSlug.trim());
  const query = new URLSearchParams();
  if (params?.all_media) query.set('all_media', 'true');
  if (params?.section && params.section.toLowerCase() !== 'all') {
    query.set('section', params.section);
  }
  const qs = query.toString() ? `?${query.toString()}` : '';
  const primaryUrl = isPublic ? `/api/public/events/${encoded}/${qs}` : `/api/events/${encoded}/${qs}`;
  const fallbackUrl = isPublic ? `/api/events/${encoded}/${qs}` : `/api/public/events/${encoded}/${qs}`;

  try {
    return await CommonApi<LiveEvent>('GET', primaryUrl);
  } catch (err: any) {
    try {
      return await CommonApi<LiveEvent>('GET', fallbackUrl);
    } catch {
      try {
        const events = await GetEventsApi({ search: idOrSlug });
        const matched = events.find(
          (e) =>
            e.id === idOrSlug ||
            e.slug === idOrSlug ||
            e.title?.toLowerCase() === idOrSlug.toLowerCase()
        );
        if (matched) {
          if (!isPublic && matched.id !== idOrSlug) {
            return await CommonApi<LiveEvent>('GET', `/api/events/${matched.id}/${qs}`);
          }
          return matched;
        }
      } catch {
        // Fall through to original error
      }
      throw err;
    }
  }
};

/**
 * 3. Retrieve Event Detail & Stats
 * Endpoint: GET /api/events/{id_or_slug}/
 */
export const GetEventDetailApi = (
  idOrSlug: string,
  params?: { all_media?: boolean; section?: string }
): Promise<LiveEvent> =>
  resolveEventByIdOrSlug(idOrSlug, false, params);

/**
 * 4. Update Event Info
 * Endpoint: PATCH /api/events/{id}/
 */
export const UpdateEventApi = async (
  id: string,
  updates: Partial<LiveEvent> & Record<string, any>
): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('PATCH', `/api/events/${id}/`, updates);
};

/**
 * 5. Delete Event (Soft delete to trash, or permanent purge)
 * Endpoint: DELETE /api/events/{id}/?permanent=true|false
 */
export const DeleteEventApi = async (
  id: string,
  permanent: boolean = false
): Promise<{ success: boolean; message?: string }> => {
  const qs = permanent ? '?permanent=true' : '';
  return CommonApi('DELETE', `/api/events/${id}/${qs}`);
};

/**
 * 6. Restore Event from Trash
 * Endpoint: POST /api/events/{id}/restore/
 */
export const RestoreEventApi = async (
  id: string,
  targetStatus: 'live' | 'upcoming' = 'upcoming'
): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('POST', `/api/events/${id}/restore/`, { target_status: targetStatus });
};

/**
 * 7. Delete Individual Media from Event
 * Endpoint: DELETE /api/events/{eventId}/media/{mediaId}/
 */
export const DeleteEventMediaApi = async (eventId: string, mediaId: string): Promise<{ success: boolean }> => {
  return CommonApi('DELETE', `/api/events/${eventId}/media/${mediaId}/`);
};

/**
 * 7b. Bulk Delete Multiple Media Items from Event
 * Primary Endpoint: POST /api/events/{eventId}/media/bulk-delete/
 * Fallback: Individual deletion for backward compatibility
 */
export const BulkDeleteEventMediaApi = async (
  eventId: string,
  mediaIds: string[],
  options?: { section?: string; deleteAll?: boolean }
): Promise<{ deleted_count: number; freed_bytes?: number }> => {
  const payload: any = { media_ids: mediaIds };
  if (options?.deleteAll) payload.delete_all = true;
  if (options?.section && options.section.toLowerCase() !== 'all') {
    payload.section = options.section;
  }
  if (!mediaIds?.length && !options?.deleteAll) return { deleted_count: 0 };

  try {
    return await CommonApi('POST', `/api/events/${eventId}/media/bulk-delete/`, payload);
  } catch {
    try {
      return await CommonApi('POST', `/api/events/${eventId}/bulk-delete/`, payload);
    } catch {
      const results = await Promise.allSettled(
        mediaIds.map((id) => DeleteEventMediaApi(eventId, id))
      );
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      return { deleted_count: successful };
    }
  }
};

/**
 * 8. Update QR Security & Expiration Settings
 * Endpoint: POST /api/events/{eventId}/qr-settings/
 */
export const UpdateEventQRExpiryApi = async (
  eventId: string,
  durationHours: number | 'custom',
  expiresAt: string,
  pinCode?: string,
  allowGuestUploads?: boolean
): Promise<{ status: string; qr_settings: any }> => {
  const payload: Record<string, any> = {
    duration_hours: durationHours,
    expires_at: expiresAt,
    ...(pinCode !== undefined && { pin_code: pinCode }),
    ...(allowGuestUploads !== undefined && { allow_guest_uploads: allowGuestUploads }),
  };

  try {
    return await CommonApi('POST', `/api/events/${eventId}/qr-settings/`, payload);
  } catch (err: any) {
    try {
      const patchPayload: Record<string, any> = {
        qr_expires_at: expiresAt,
        ...(typeof durationHours === 'number' && { qr_duration_hours: durationHours }),
        ...(pinCode !== undefined && { qr_pin_code: pinCode }),
        ...(allowGuestUploads !== undefined && { allow_guest_uploads: allowGuestUploads }),
      };

      const res = await CommonApi<any>('PATCH', `/api/events/${eventId}/`, patchPayload);
      return {
        status: 'success',
        qr_settings: res?.qrSettings || {
          expires_at: expiresAt,
          duration_hours: durationHours,
          is_active: true,
          pin_code: pinCode,
          allow_guest_uploads: allowGuestUploads,
        },
      };
    } catch (patchErr: any) {
      const serverMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        patchErr?.response?.data?.detail ||
        patchErr?.response?.data?.error ||
        err?.message ||
        'Server failed to update QR settings';
      throw new Error(serverMsg, { cause: patchErr });
    }
  }
};

/**
 * 9. Move Event Media to Gallery Drive with Categorized Sections
 * Endpoint: POST /api/events/{eventId}/move-to-gallery/
 */
export const MoveEventToGalleryApi = async (
  eventId: string,
  payload: MoveEventToGalleryPayload
): Promise<Gallery> => {
  return CommonApi<Gallery>('POST', `/api/events/${eventId}/move-to-gallery/`, payload);
};

/**
 * 10. Camera Tethering / Single Ingestion (Photos & Videos)
 * Endpoint: POST /api/events/{eventId}/tether/
 */
export const TetherPhotoUploadApi = async (
  eventId: string,
  file: File,
  sectionTitle?: string,
  signal?: AbortSignal
): Promise<MediaItem> => {
  const formData = new FormData();
  const isVideo = isVideoFile(file);

  formData.append(isVideo ? 'video' : 'photo', file);
  formData.append('file', file);
  formData.append('type', isVideo ? 'video' : 'photo');
  formData.append('event', eventId);
  formData.append('event_id', eventId);
  if (sectionTitle) formData.append('section_title', sectionTitle);

  return CommonApi<MediaItem>('POST', `/api/events/${eventId}/tether/`, formData, {
    signal,
    timeout: 300000,
  });
};

/**
 * 11. Batch Event Media Upload (Photos & Videos with progress & abort cancellation)
 * Automatically batches large file sets into manageable chunks based on .env config (e.g. 20 photos per batch)
 * with automatic retry for rock-solid stability and zero HTTP payload size/timeout failures.
 * Endpoint: POST /api/events/{eventId}/upload/
 */
export const BulkUploadEventMediaApi = async (
  eventId: string,
  files: File[],
  sectionTitle?: string,
  type?: 'photo' | 'video',
  onProgress?: (percent: number, statusText?: string) => void,
  signal?: AbortSignal
): Promise<{ message?: string; total_uploaded: number; media: MediaItem[] }> => {
  if (!files?.length) {
    return { message: 'No files to upload', total_uploaded: 0, media: [] };
  }

  const isVideoBatch = type === 'video' || files.some((f) => isVideoFile(f));
  // Global configurable batch size from .env (VITE_UPLOAD_BATCH_SIZE / VITE_VIDEO_UPLOAD_BATCH_SIZE)
  const BATCH_SIZE = getUploadBatchSize(isVideoBatch);

  const uploadChunk = async (
    chunkFiles: File[],
    onChunkProgress?: (percent: number) => void
  ): Promise<{ message?: string; total_uploaded: number; media: MediaItem[] }> => {
    const formData = new FormData();
    chunkFiles.forEach((f) => {
      const isVid = type === 'video' || isVideoFile(f);
      formData.append(isVid ? 'videos' : 'photos', f);
    });

    if (sectionTitle) formData.append('section_title', sectionTitle);
    if (type) formData.append('type', type);
    formData.append('event', eventId);
    formData.append('event_id', eventId);

    const res = await CommonApi<any>(
      'POST',
      `/api/events/${eventId}/upload/`,
      formData,
      {
        signal,
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onChunkProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onChunkProgress(percent);
          }
        },
      }
    );

    let mediaList: MediaItem[] = [];
    if (Array.isArray(res)) {
      mediaList = res;
    } else if (res && Array.isArray(res.media)) {
      mediaList = res.media;
    } else if (res && Array.isArray(res.data)) {
      mediaList = res.data;
    } else if (res && res.id) {
      mediaList = [res];
    } else if (res && res.data && res.data.id) {
      mediaList = [res.data];
    }

    return {
      message: res?.message,
      total_uploaded: res?.total_uploaded ?? mediaList.length,
      media: mediaList,
    };
  };

  // If the total files fit within a single batch, execute directly
  if (files.length <= BATCH_SIZE) {
    return await uploadChunk(files, (percent) => {
      onProgress?.(percent, `Uploading ${files.length} item(s): ${percent}%`);
    });
  }

  // Multi-batch pipeline for large uploads (e.g. 50, 100, 500+ items)
  const chunks: File[][] = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    chunks.push(files.slice(i, i + BATCH_SIZE));
  }
  const totalChunks = chunks.length;

  const allMedia: MediaItem[] = [];
  let totalUploaded = 0;
  let lastMessage: string | undefined = undefined;

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) {
      const cancelErr: any = new Error('Upload cancelled by user');
      cancelErr.name = 'AbortError';
      if (allMedia.length > 0) cancelErr.uploadedMedia = allMedia;
      throw cancelErr;
    }

    const chunkFiles = chunks[i];
    const chunkStart = i * BATCH_SIZE + 1;
    const chunkEnd = Math.min(files.length, (i + 1) * BATCH_SIZE);

    onProgress?.(
      Math.round((i / totalChunks) * 100),
      `Uploading batch ${i + 1} of ${totalChunks} (${chunkStart}–${chunkEnd} of ${files.length})...`
    );

    let attempt = 0;
    let success = false;

    while (attempt < 2 && !success) {
      if (signal?.aborted) {
        const cancelErr: any = new Error('Upload cancelled by user');
        cancelErr.name = 'AbortError';
        if (allMedia.length > 0) cancelErr.uploadedMedia = allMedia;
        throw cancelErr;
      }

      attempt++;
      try {
        const chunkRes = await uploadChunk(chunkFiles, (chunkPercent) => {
          const overall = Math.min(
            99,
            Math.round(((i + chunkPercent / 100) / totalChunks) * 100)
          );
          onProgress?.(
            overall,
            `Uploading batch ${i + 1} of ${totalChunks} (${chunkStart}–${chunkEnd} of ${files.length})... ${chunkPercent}%`
          );
        });

        allMedia.push(...chunkRes.media);
        totalUploaded += chunkRes.total_uploaded;
        if (chunkRes.message) lastMessage = chunkRes.message;
        success = true;
      } catch (err: any) {
        if (
          signal?.aborted ||
          err?.name === 'AbortError' ||
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED'
        ) {
          if (allMedia.length > 0) err.uploadedMedia = allMedia;
          throw err;
        }
        if (
          err?.response?.status === 401 ||
          err?.response?.status === 403 ||
          err?.response?.status === 413 ||
          err?.response?.data?.error_code === 'STORAGE_LIMIT_EXCEEDED'
        ) {
          throw err;
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }

    if (!success) {
      // Chunk-level fallback: attempt tether upload for each item in this failed chunk
      try {
        for (let j = 0; j < chunkFiles.length; j++) {
          if (signal?.aborted) throw new Error('Upload cancelled by user');
          const file = chunkFiles[j];
          const item = await TetherPhotoUploadApi(eventId, file, sectionTitle, signal);
          allMedia.push(item);
          totalUploaded += 1;
        }
      } catch (fallbackErr: any) {
        if (allMedia.length > 0) (fallbackErr as any).uploadedMedia = allMedia;
        throw fallbackErr;
      }
    }
  }

  onProgress?.(100, `Upload complete: ${allMedia.length} file(s) saved`);
  return {
    message: lastMessage || 'Upload complete',
    total_uploaded: totalUploaded || allMedia.length,
    media: allMedia,
  };
};

/**
 * 12. Guest Public Mobile Portal
 * Endpoint: GET /api/public/events/{id_or_slug}/
 */
export const GetPublicEventDetailApi = (idOrSlug: string): Promise<LiveEvent> =>
  resolveEventByIdOrSlug(idOrSlug, true);
