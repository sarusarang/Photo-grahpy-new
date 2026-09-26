import { CommonApi } from '@/lib/CommonApi';
import type { Gallery, MediaItem, GalleryTemplateId } from '@/types/atelier';

export interface GalleryFilterParams {
  search?: string;
  status?: string;
  date_filter?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
}

export interface CreateGalleryPayload {
  title: string;
  client_name?: string;
  client_email?: string;
  event_date?: string;
  description?: string;
  template_id?: GalleryTemplateId;
  visibility?: 'public' | 'private' | 'password_protected';
  password?: string;
  allow_downloads?: boolean;
  allow_favorites?: boolean;
  face_search_enabled?: boolean;
  cover_image?: string;
}

/**
 * 1. List Photographer Galleries (with optional filtering)
 * Endpoint: GET /api/galleries/
 */
export const GetGalleriesApi = async (params?: GalleryFilterParams): Promise<Gallery[]> => {
  const res = await CommonApi<Gallery[] | { results?: Gallery[]; data?: Gallery[] }>('GET', '/api/galleries/', params);
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as any).results)) return (res as any).results;
  if (res && Array.isArray((res as any).data)) return (res as any).data;
  return [];
};

/**
 * 2. Create New Client Proofing Gallery
 * Endpoint: POST /api/galleries/
 */
export const CreateGalleryApi = async (payload: CreateGalleryPayload): Promise<Gallery> => {
  return CommonApi<Gallery>('POST', '/api/galleries/', payload);
};

export interface GalleryDetailQueryParams {
  cursor?: string | null;
  limit?: number;
  section?: string;
  is_favorite?: boolean;
  type?: 'photo' | 'video';
  all_media?: boolean;
}

/**
 * 3. Retrieve Gallery Detail with Media & Sections
 * Endpoint: GET /api/galleries/{id_or_slug}/
 * Supports cursor pagination, section filtering, and favorites filtering directly on the endpoint.
 */
export const GetGalleryDetailApi = async (
  idOrSlug: string,
  params?: GalleryDetailQueryParams
): Promise<Gallery> => {
  const query = new URLSearchParams();
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.section && params.section.toLowerCase() !== 'all') {
    query.set('section', params.section);
  }
  if (params?.is_favorite) query.set('is_favorite', 'true');
  if (params?.type) query.set('type', params.type);
  if (params?.all_media) query.set('all_media', 'true');

  const queryString = query.toString();
  const endpoint = `/api/galleries/${idOrSlug}/${queryString ? `?${queryString}` : ''}`;
  return CommonApi<Gallery>('GET', endpoint);
};

/**
 * 4. Update Gallery Configuration
 * Endpoint: PATCH /api/galleries/{id}/
 */
export const UpdateGalleryApi = async (id: string, updates: Partial<Gallery>): Promise<Gallery> => {
  return CommonApi<Gallery>('PATCH', `/api/galleries/${id}/`, updates);
};

/**
 * 5. Delete Gallery & Cascade Media
 * Endpoint: DELETE /api/galleries/{id}/
 * Optional ?permanent=true query parameter allows backend to distinguish between soft-archive vs permanent wipe.
 */
export const DeleteGalleryApi = async (
  id: string,
  permanent: boolean = false
): Promise<{ success: boolean; message: string; status?: string }> => {
  const query = permanent ? '?permanent=true' : '';
  return CommonApi('DELETE', `/api/galleries/${id}/${query}`);
};

/**
 * 5a. Move Gallery to Archive / Trash
 * Endpoint: DELETE /api/galleries/{id}/ (soft delete) or PATCH /api/galleries/{id}/ with { status: 'archived' }
 */
export const ArchiveGalleryApi = async (id: string): Promise<any> => {
  try {
    return await CommonApi('DELETE', `/api/galleries/${id}/`);
  } catch {
    return await CommonApi('PATCH', `/api/galleries/${id}/`, { status: 'archived' });
  }
};

/**
 * 5b. Restore Gallery from Archive
 * Endpoint: POST /api/galleries/{id}/restore/ with { status: targetStatus }
 */
export const RestoreGalleryApi = async (
  id: string,
  targetStatus: 'active' | 'delivered' = 'active'
): Promise<any> => {
  try {
    return await CommonApi('POST', `/api/galleries/${id}/restore/`, { status: targetStatus });
  } catch {
    return await CommonApi('PATCH', `/api/galleries/${id}/`, { status: targetStatus });
  }
};

/**
 * 6. Move Selected Photos into Another Section / Title
 * Endpoint: POST /api/galleries/{id}/media/move-section/
 */
export const MoveMediaToSectionApi = async (
  galleryId: string,
  mediaIds: string[],
  targetSection: string
): Promise<{ status: string; updated_count: number; section: string }> => {
  return CommonApi('POST', `/api/galleries/${galleryId}/media/move-section/`, {
    media_ids: mediaIds,
    target_section: targetSection,
  });
};

/**
 * 7. Upload Single Media Item (Photo or 4K Video)
 * Endpoint: POST /api/galleries/{gallery_id}/upload/
 */
export const UploadGalleryMediaApi = async (
  galleryId: string,
  file: File,
  sectionTitle?: string,
  type?: 'photo' | 'video',
  onProgress?: (percent: number) => void
): Promise<MediaItem> => {
  const formData = new FormData();
  const isVideo =
    type === 'video' ||
    file.type.startsWith('video/') ||
    /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(file.name);
  const mediaType: 'photo' | 'video' = isVideo ? 'video' : 'photo';

  if (isVideo) {
    formData.append('videos', file);
  } else {
    formData.append('photos', file);
  }
  if (sectionTitle) formData.append('section_title', sectionTitle);
  formData.append('type', mediaType);

  const res = await CommonApi<any>(
    'POST',
    `/api/galleries/${galleryId}/upload/`,
    formData,
    {
      timeout: 300000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }
  );

  if (res?.media && Array.isArray(res.media) && res.media.length > 0) return res.media[0];
  if (Array.isArray(res) && res.length > 0) return res[0];
  if (res?.data) return res.data;
  return res as MediaItem;
};

/**
 * 8. Batch Upload Multiple High-Res Photos or 4K Videos
 * Automatically batches large file sets into manageable chunks (e.g. 20 photos per batch)
 * with automatic retry for rock-solid stability and zero HTTP payload size/timeout failures.
 * Endpoint: POST /api/galleries/{gallery_id}/upload/
 */
export const BulkUploadGalleryMediaApi = async (
  galleryId: string,
  files: File[],
  sectionTitle?: string,
  type?: 'photo' | 'video',
  onProgress?: (percent: number, statusText?: string) => void,
  signal?: AbortSignal
): Promise<{ message?: string; total_uploaded: number; media: MediaItem[]; storage_usage?: any }> => {
  if (!files || files.length === 0) {
    return { message: 'No files to upload', total_uploaded: 0, media: [] };
  }

  const isVideoBatch = type === 'video' || files.some((f) => f.type.startsWith('video/'));
  // Videos are large so upload 1 at a time; photos upload in safe batches of 20
  const BATCH_SIZE = isVideoBatch ? 1 : 20;

  const uploadChunk = async (
    chunkFiles: File[],
    onChunkProgress?: (percent: number) => void
  ): Promise<{ message?: string; total_uploaded: number; media: MediaItem[]; storage_usage?: any }> => {
    const formData = new FormData();
    let hasVideo = false;
    let hasPhoto = false;

    chunkFiles.forEach((f) => {
      const isVideo =
        type === 'video' ||
        f.type.startsWith('video/') ||
        /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(f.name);

      if (isVideo) {
        formData.append('videos', f);
        hasVideo = true;
      } else {
        formData.append('photos', f);
        hasPhoto = true;
      }
    });

    if (sectionTitle) formData.append('section_title', sectionTitle);
    if (type) {
      formData.append('type', type);
    } else if (hasVideo && !hasPhoto) {
      formData.append('type', 'video');
    } else if (hasPhoto && !hasVideo) {
      formData.append('type', 'photo');
    }

    const res = await CommonApi<any>(
      'POST',
      `/api/galleries/${galleryId}/upload/`,
      formData,
      {
        timeout: 300000,
        signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onChunkProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onChunkProgress(percent);
          }
        },
      }
    );

    let mediaList: any[] = [];
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
      storage_usage: res?.storage_usage,
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
  let lastStorageUsage: any = undefined;
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
    let lastError: any = null;

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
        if (chunkRes.storage_usage) lastStorageUsage = chunkRes.storage_usage;
        if (chunkRes.message) lastMessage = chunkRes.message;
        success = true;
      } catch (err: any) {
        lastError = err;
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
      if (allMedia.length > 0) {
        lastError.uploadedMedia = allMedia;
      }
      throw lastError;
    }
  }

  onProgress?.(100, `Uploaded all ${files.length} items successfully!`);

  return {
    message: lastMessage || 'All media uploaded successfully',
    total_uploaded: totalUploaded,
    media: allMedia,
    storage_usage: lastStorageUsage,
  };
};

/**
 * 9. Delete Single Media Item
 * Endpoint: DELETE /api/galleries/{galleryId}/media/{media_id}/ or /api/galleries/media/{media_id}/
 */
export const DeleteGalleryMediaApi = async (
  mediaId: string,
  galleryId?: string
): Promise<{ success: boolean }> => {
  if (galleryId) {
    try {
      return await CommonApi('DELETE', `/api/galleries/${galleryId}/media/${mediaId}/`);
    } catch {
      // fallback
    }
  }
  return CommonApi('DELETE', `/api/galleries/media/${mediaId}/`);
};

/**
 * 10. Bulk Delete Multiple Media Items
 * Endpoint: POST /api/galleries/media/bulk-delete/
 */
export const BulkDeleteGalleryMediaApi = async (
  mediaIds: string[]
): Promise<{ deleted_count: number; freed_bytes: number }> => {
  return CommonApi('POST', '/api/galleries/media/bulk-delete/', { media_ids: mediaIds });
};

/**
 * 11. Toggle Media Favorite Heart Selection
 * Endpoint: POST /api/galleries/{galleryId}/media/{id}/favorite/ or /api/galleries/media/{id}/favorite/
 */
export const ToggleMediaFavoriteApi = async (
  mediaId: string,
  galleryId?: string,
  isFavorite?: boolean
): Promise<{ id?: string; is_favorite: boolean; favorites_count?: number }> => {
  if (galleryId) {
    try {
      return await CommonApi('POST', `/api/galleries/${galleryId}/media/${mediaId}/favorite/`, {
        is_favorite: isFavorite,
      });
    } catch {
      try {
        return await CommonApi('POST', `/api/galleries/${galleryId}/favorite/`, {
          media_id: mediaId,
          is_favorite: isFavorite,
        });
      } catch {
        try {
          return await CommonApi('POST', `/api/public/galleries/${galleryId}/favorite/`, {
            media_id: mediaId,
            is_favorite: isFavorite,
          });
        } catch {
          // Fallback to media-only endpoint below
        }
      }
    }
  }
  return CommonApi('POST', `/api/galleries/media/${mediaId}/favorite/`, {
    is_favorite: isFavorite,
  });
};

/**
 * 12. Set Cover Image
 * Endpoint: POST /api/galleries/{id}/cover/ (fallback: /api/galleries/{id}/set-cover/)
 */
export const SetGalleryCoverImageApi = async (
  galleryId: string,
  mediaIdOrUrl: string,
  mediaId?: string
): Promise<{ cover_image: string }> => {
  const isUrl = typeof mediaIdOrUrl === 'string' && (mediaIdOrUrl.startsWith('http') || mediaIdOrUrl.startsWith('/'));
  const isUUID = (val?: string): boolean =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  const finalMediaUrl = isUrl ? mediaIdOrUrl : '';
  const finalMediaId = isUUID(mediaId) ? mediaId : (isUUID(mediaIdOrUrl) ? mediaIdOrUrl : undefined);

  const payload: Record<string, any> = {
    media_url: finalMediaUrl,
    cover_image: finalMediaUrl,
  };
  if (finalMediaId) {
    payload.media_id = finalMediaId;
  }

  try {
    return await CommonApi('POST', `/api/galleries/${galleryId}/cover/`, payload);
  } catch {
    try {
      return await CommonApi('POST', `/api/galleries/${galleryId}/set-cover/`, payload);
    } catch {
      return await CommonApi('PATCH', `/api/galleries/${galleryId}/`, { cover_image: finalMediaUrl });
    }
  }
};

/**
 * 13. Update Top Hero Banner Slot for Masonry Template
 * Endpoint: POST /api/galleries/{id}/masonry-slots/ (fallback: /api/galleries/{id}/banners/masonry-slot/)
 */
export const SetMasonrySlotBannerApi = async (
  galleryId: string,
  slotIndex: number,
  mediaUrl: string
): Promise<{ masonry_banner_images: string[] }> => {
  try {
    return await CommonApi('POST', `/api/galleries/${galleryId}/masonry-slots/`, {
      slot_index: slotIndex,
      media_url: mediaUrl,
    });
  } catch {
    try {
      return await CommonApi('POST', `/api/galleries/${galleryId}/banners/masonry-slot/`, {
        slot_index: slotIndex,
        media_url: mediaUrl,
      });
    } catch {
      return await CommonApi('PATCH', `/api/galleries/${galleryId}/`, {
        masonry_banner_images: [mediaUrl],
        template_banners: { masonry: mediaUrl },
      });
    }
  }
};

/**
 * 14. Create Section in Gallery
 * Endpoint: POST /api/galleries/{id}/sections/
 */
export const AddGallerySectionApi = async (
  galleryId: string,
  title: string
): Promise<{ id?: number | string; title: string; order?: number }> => {
  return CommonApi('POST', `/api/galleries/${galleryId}/sections/`, { title });
};

/**
 * 15. Delete Section from Gallery
 * Endpoint: DELETE /api/galleries/{id}/sections/{title}/
 */
export const DeleteGallerySectionApi = async (
  galleryId: string,
  sectionTitle: string
): Promise<{ success: boolean; message?: string }> => {
  return CommonApi('DELETE', `/api/galleries/${galleryId}/sections/${encodeURIComponent(sectionTitle)}/`);
};

/**
 * 16. Rename Section in Gallery
 * Endpoint: POST /api/galleries/{id}/sections/rename/
 */
export const RenameGallerySectionApi = async (
  galleryId: string,
  oldTitle: string,
  newTitle: string
): Promise<{ old_title: string; new_title: string; updated_count: number }> => {
  return CommonApi('POST', `/api/galleries/${galleryId}/sections/rename/`, {
    old_title: oldTitle,
    new_title: newTitle,
  });
};

/**
 * 17. Retrieve Share Details & QR Code Metadata
 * Endpoint: GET /api/galleries/{id}/share-details/
 */
export const GetGalleryShareDetailsApi = async (
  galleryId: string
): Promise<{
  share_url: string;
  qr_code_svg?: string;
  qr_code_png?: string;
  pin_code?: string;
  expires_at: string | null;
  is_password_protected: boolean;
}> => {
  return CommonApi('GET', `/api/galleries/${galleryId}/share-details/`);
};

/**
 * 18. Update Gallery Layout Template Presentation Style
 * Endpoint: POST /api/galleries/{id}/template/
 */
export const SetGalleryTemplateApi = async (
  galleryId: string,
  templateId: GalleryTemplateId
): Promise<{ template_id: GalleryTemplateId }> => {
  try {
    return await CommonApi('POST', `/api/galleries/${galleryId}/template/`, { template_id: templateId });
  } catch {
    return await CommonApi('PATCH', `/api/galleries/${galleryId}/`, { template_id: templateId });
  }
};

/**
 * 19. Set Hero Banner Image/Video for Specific Layout Template
 * Endpoint: POST /api/galleries/{id}/banners/
 */
export const SetGalleryTemplateBannerApi = async (
  galleryId: string,
  templateId: GalleryTemplateId,
  mediaUrl: string,
  mediaId?: string
): Promise<{ template_banners: Record<string, string> }> => {
  const isUUID = (val?: string): boolean =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  const payload: Record<string, any> = {
    template_id: templateId,
    media_url: mediaUrl,
  };
  if (isUUID(mediaId)) {
    payload.media_id = mediaId;
  }

  try {
    return await CommonApi('POST', `/api/galleries/${galleryId}/banners/`, payload);
  } catch {
    try {
      return await CommonApi('POST', `/api/galleries/${galleryId}/banner/`, payload);
    } catch {
      return await CommonApi('PATCH', `/api/galleries/${galleryId}/`, {
        template_banners: { [templateId]: mediaUrl },
      });
    }
  }
};

/**
 * 20. Reorder Media Sequence Inside Gallery
 * Endpoint: POST /api/galleries/{id}/media/reorder/
 */
export const ReorderGalleryMediaApi = async (
  galleryId: string,
  mediaIds: string[]
): Promise<{ status: string; updated_count: number }> => {
  return CommonApi('POST', `/api/galleries/${galleryId}/media/reorder/`, { media_ids: mediaIds });
};

/**
 * 21. Reorder Custom Section Titles in Gallery
 * Endpoint: POST /api/galleries/{id}/sections/reorder/
 */
export const ReorderGallerySectionsApi = async (
  galleryId: string,
  sections: string[]
): Promise<{ status: string; sections: string[] }> => {
  return CommonApi('POST', `/api/galleries/${galleryId}/sections/reorder/`, { sections });
};

/**
 * 22. Retrieve Real-Time Gallery Analytics & Visitor Intelligence
 * Endpoint: GET /api/galleries/{id}/analytics/?time_range={7d|30d|all}
 */
export const GetGalleryAnalyticsApi = async (
  galleryId: string,
  timeRange: string = '30d'
): Promise<any> => {
  return CommonApi('GET', `/api/galleries/${galleryId}/analytics/`, { time_range: timeRange });
};

/**
 * 23. Record Live Client Interaction Event for Analytics
 * Endpoint: POST /api/galleries/{id}/analytics/event/
 */
export const TrackGalleryAnalyticsEventApi = async (
  galleryId: string,
  eventType: string,
  mediaId?: string
): Promise<{ success: boolean }> => {
  return CommonApi('POST', `/api/galleries/${galleryId}/analytics/event/`, {
    event_type: eventType,
    media_id: mediaId,
  });
};

/**
 * 24. Export Gallery Analytics CSV
 * Endpoint: GET /api/galleries/{id}/analytics/export-csv/
 */
export const ExportGalleryAnalyticsCsvApi = async (
  galleryId: string,
  timeRange: string = '30d'
): Promise<Blob> => {
  return CommonApi<Blob>(
    'GET',
    `/api/galleries/${galleryId}/analytics/export-csv/`,
    { time_range: timeRange },
    { responseType: 'blob' }
  );
};
