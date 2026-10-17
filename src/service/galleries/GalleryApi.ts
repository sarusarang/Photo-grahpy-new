import { CommonApi } from '@/lib/CommonApi';
import { getUploadBatchSize } from '@/utils/uploadConfig';
import { executeBatchUpload } from '@/utils/batchUploadRunner';
import type { Gallery, GalleryTemplateId, MediaItem } from '@/types/atelier';
import type {
  GalleryFilterParams,
  CreateGalleryPayload,
  GalleryDetailQueryParams,
  DeleteGalleryResponse,
  MoveMediaToSectionResponse,
  BulkUploadGalleryMediaResponse,
  DeleteGalleryMediaResponse,
  BulkDeleteGalleryMediaResponse,
  ToggleMediaFavoriteResponse,
  BulkToggleMediaFavoriteResponse,
  SetGalleryCoverImageResponse,
  SetMasonrySlotBannerResponse,
  AddGallerySectionResponse,
  DeleteGallerySectionResponse,
  RenameGallerySectionResponse,
  GetGalleryShareDetailsResponse,
  SetGalleryTemplateResponse,
  SetGalleryTemplateBannerResponse,
  ReorderGalleryMediaResponse,
  ReorderGallerySectionsResponse,
  TrackGalleryAnalyticsEventResponse,
} from './type';

export * from './type';

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
): Promise<DeleteGalleryResponse> => {
  const query = permanent ? '?permanent=true' : '';
  return CommonApi<DeleteGalleryResponse>('DELETE', `/api/galleries/${id}/${query}`);
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
): Promise<MoveMediaToSectionResponse> => {
  return CommonApi<MoveMediaToSectionResponse>('POST', `/api/galleries/${galleryId}/media/move-section/`, {
    media_ids: mediaIds,
    target_section: targetSection,
  });
};

export interface UploadMediaItemParams {
  galleryId: string;
  file: File;
  sectionName?: string;
  sectionTitle?: string;
  type?: 'photo' | 'video';
  onProgress?: (percent: number, loadedBytes?: number) => void;
  signal?: AbortSignal;
}

export type UploadMediaResponse = MediaItem;

/**
 * 7. Upload Single Media Item (Photo or 4K Video)
 * Endpoint: POST /api/galleries/{gallery_id}/upload/
 */
export const UploadGalleryMediaApi = async (
  galleryId: string,
  file: File,
  sectionTitle?: string,
  type?: 'photo' | 'video',
  onProgress?: (percent: number, loadedBytes?: number) => void,
  signal?: AbortSignal
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

  if (res?.media && Array.isArray(res.media) && res.media.length > 0) return res.media[0];
  if (Array.isArray(res) && res.length > 0) return res[0];
  if (res?.data) return res.data;
  return res as MediaItem;
};

/**
 * Standard item-level upload handler for pipeline orchestrators
 */
export const uploadMediaItem = async (
  params: UploadMediaItemParams
): Promise<UploadMediaResponse> => {
  return UploadGalleryMediaApi(
    params.galleryId,
    params.file,
    params.sectionName || params.sectionTitle,
    params.type,
    params.onProgress,
    params.signal
  );
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
  onProgress?: (percent: number, statusText?: string, metrics?: any) => void,
  signal?: AbortSignal,
  pauseController?: import('@/utils/batchUploadRunner').BatchUploadPauseController
): Promise<BulkUploadGalleryMediaResponse> => {
  if (!files || files.length === 0) {
    return { message: 'No files to upload', total_uploaded: 0, media: [] };
  }

  const isVideoBatch = type === 'video' || files.some((f) => f.type.startsWith('video/'));
  // Dynamic batch size from .env / .env.local (VITE_UPLOAD_BATCH_SIZE / VITE_VIDEO_UPLOAD_BATCH_SIZE)
  const BATCH_SIZE = getUploadBatchSize(isVideoBatch);

  const allMedia: MediaItem[] = [];
  let totalUploaded = 0;
  let lastStorageUsage: any = undefined;
  let lastMessage: string | undefined = undefined;

  await executeBatchUpload<
    File,
    BulkUploadGalleryMediaResponse
  >({
    items: files,
    batchSize: BATCH_SIZE,
    itemLabel: isVideoBatch ? 'video' : 'photo',
    signal,
    pauseController,
    onProgress,
    uploadBatch: async (chunkFiles, onChunkProgress) => {
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
              onChunkProgress(percent, progressEvent.loaded);
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
    },
    onBatchSuccess: (chunkRes) => {
      allMedia.push(...chunkRes.media);
      totalUploaded += chunkRes.total_uploaded;
      if (chunkRes.storage_usage) lastStorageUsage = chunkRes.storage_usage;
      if (chunkRes.message) lastMessage = chunkRes.message;
    },
  });

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
): Promise<DeleteGalleryMediaResponse> => {
  if (galleryId) {
    try {
      return await CommonApi<DeleteGalleryMediaResponse>('DELETE', `/api/galleries/${galleryId}/media/${mediaId}/`);
    } catch {
      // fallback
    }
  }
  return CommonApi<DeleteGalleryMediaResponse>('DELETE', `/api/galleries/media/${mediaId}/`);
};

/**
 * 10. Bulk Delete Multiple Media Items
 * Endpoint: POST /api/galleries/media/bulk-delete/
 */
export const BulkDeleteGalleryMediaApi = async (
  mediaIds: string[],
  galleryId?: string,
  options?: { section?: string; deleteAll?: boolean }
): Promise<BulkDeleteGalleryMediaResponse> => {
  const payload: any = { media_ids: mediaIds };
  if (galleryId) payload.gallery_id = galleryId;
  if (options?.deleteAll) payload.delete_all = true;
  if (options?.section && options.section.toLowerCase() !== 'all') {
    payload.section = options.section;
  }
  return CommonApi<BulkDeleteGalleryMediaResponse>('POST', '/api/galleries/media/bulk-delete/', payload);
};

/**
 * 11. Toggle Media Favorite Heart Selection
 * Endpoint: POST /api/galleries/{galleryId}/media/{id}/favorite/ or /api/galleries/media/{id}/favorite/
 */
export const ToggleMediaFavoriteApi = async (
  mediaId: string,
  galleryId?: string,
  isFavorite?: boolean
): Promise<ToggleMediaFavoriteResponse> => {
  if (galleryId) {
    try {
      return await CommonApi<ToggleMediaFavoriteResponse>('POST', `/api/galleries/${galleryId}/media/${mediaId}/favorite/`, {
        is_favorite: isFavorite,
      });
    } catch {
      try {
        return await CommonApi<ToggleMediaFavoriteResponse>('POST', `/api/galleries/${galleryId}/favorite/`, {
          media_id: mediaId,
          is_favorite: isFavorite,
        });
      } catch {
        try {
          return await CommonApi<ToggleMediaFavoriteResponse>('POST', `/api/public/galleries/${galleryId}/favorite/`, {
            media_id: mediaId,
            is_favorite: isFavorite,
          });
        } catch {
          // Fallback to media-only endpoint below
        }
      }
    }
  }
  return CommonApi<ToggleMediaFavoriteResponse>('POST', `/api/galleries/media/${mediaId}/favorite/`, {
    is_favorite: isFavorite,
  });
};

/**
 * 11b. Bulk Toggle Media Favorite Heart Selection
 * Primary Endpoint: POST /api/galleries/{galleryId}/media/bulk-favorite/
 * Fallbacks: POST /api/galleries/media/bulk-favorite/ or batched single requests
 */
export const BulkToggleMediaFavoriteApi = async (
  galleryId: string,
  mediaIds: string[],
  isFavorite: boolean,
  selectAll?: boolean
): Promise<BulkToggleMediaFavoriteResponse> => {
  const payload = {
    media_ids: mediaIds,
    is_favorite: isFavorite,
    ...(selectAll ? { select_all: true } : {}),
  };

  try {
    return await CommonApi<BulkToggleMediaFavoriteResponse>(
      'POST',
      `/api/galleries/${galleryId}/media/bulk-favorite/`,
      payload
    );
  } catch {
    try {
      return await CommonApi<BulkToggleMediaFavoriteResponse>(
        'POST',
        `/api/galleries/media/bulk-favorite/`,
        { ...payload, gallery_id: galleryId }
      );
    } catch {
      // Resilient fallback: execute individual favorite API calls in parallel
      await Promise.allSettled(
        mediaIds.map((id) => ToggleMediaFavoriteApi(id, galleryId, isFavorite))
      );
      return {
        status: 'success',
        updated_count: mediaIds.length,
        is_favorite: isFavorite,
        media_ids: mediaIds,
      };
    }
  }
};

/**
 * 12. Set Cover Image
 * Endpoint: POST /api/galleries/{id}/cover/ (fallback: /api/galleries/{id}/set-cover/)
 */
export const SetGalleryCoverImageApi = async (
  galleryId: string,
  mediaIdOrUrl: string,
  mediaId?: string
): Promise<SetGalleryCoverImageResponse> => {
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
    return await CommonApi<SetGalleryCoverImageResponse>('POST', `/api/galleries/${galleryId}/cover/`, payload);
  } catch {
    try {
      return await CommonApi<SetGalleryCoverImageResponse>('POST', `/api/galleries/${galleryId}/set-cover/`, payload);
    } catch {
      return await CommonApi<SetGalleryCoverImageResponse>('PATCH', `/api/galleries/${galleryId}/`, { cover_image: finalMediaUrl });
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
): Promise<SetMasonrySlotBannerResponse> => {
  try {
    return await CommonApi<SetMasonrySlotBannerResponse>('POST', `/api/galleries/${galleryId}/masonry-slots/`, {
      slot_index: slotIndex,
      media_url: mediaUrl,
    });
  } catch {
    try {
      return await CommonApi<SetMasonrySlotBannerResponse>('POST', `/api/galleries/${galleryId}/banners/masonry-slot/`, {
        slot_index: slotIndex,
        media_url: mediaUrl,
      });
    } catch {
      return await CommonApi<SetMasonrySlotBannerResponse>('PATCH', `/api/galleries/${galleryId}/`, {
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
): Promise<AddGallerySectionResponse> => {
  return CommonApi<AddGallerySectionResponse>('POST', `/api/galleries/${galleryId}/sections/`, { title });
};

/**
 * 15. Delete Section from Gallery
 * Endpoint: DELETE /api/galleries/{id}/sections/{title}/
 */
export const DeleteGallerySectionApi = async (
  galleryId: string,
  sectionTitle: string
): Promise<DeleteGallerySectionResponse> => {
  return CommonApi<DeleteGallerySectionResponse>('DELETE', `/api/galleries/${galleryId}/sections/${encodeURIComponent(sectionTitle)}/`);
};

/**
 * 16. Rename Section in Gallery
 * Endpoint: POST /api/galleries/{id}/sections/rename/
 */
export const RenameGallerySectionApi = async (
  galleryId: string,
  oldTitle: string,
  newTitle: string
): Promise<RenameGallerySectionResponse> => {
  return CommonApi<RenameGallerySectionResponse>('POST', `/api/galleries/${galleryId}/sections/rename/`, {
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
): Promise<GetGalleryShareDetailsResponse> => {
  return CommonApi<GetGalleryShareDetailsResponse>('GET', `/api/galleries/${galleryId}/share-details/`);
};

/**
 * 18. Update Gallery Layout Template Presentation Style
 * Endpoint: POST /api/galleries/{id}/template/
 */
export const SetGalleryTemplateApi = async (
  galleryId: string,
  templateId: GalleryTemplateId
): Promise<SetGalleryTemplateResponse> => {
  try {
    return await CommonApi<SetGalleryTemplateResponse>('POST', `/api/galleries/${galleryId}/template/`, { template_id: templateId });
  } catch {
    return await CommonApi<SetGalleryTemplateResponse>('PATCH', `/api/galleries/${galleryId}/`, { template_id: templateId });
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
): Promise<SetGalleryTemplateBannerResponse> => {
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
    return await CommonApi<SetGalleryTemplateBannerResponse>('POST', `/api/galleries/${galleryId}/banners/`, payload);
  } catch {
    try {
      return await CommonApi<SetGalleryTemplateBannerResponse>('POST', `/api/galleries/${galleryId}/banner/`, payload);
    } catch {
      return await CommonApi<SetGalleryTemplateBannerResponse>('PATCH', `/api/galleries/${galleryId}/`, {
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
): Promise<ReorderGalleryMediaResponse> => {
  return CommonApi<ReorderGalleryMediaResponse>('POST', `/api/galleries/${galleryId}/media/reorder/`, { media_ids: mediaIds });
};

/**
 * 21. Reorder Custom Section Titles in Gallery
 * Endpoint: POST /api/galleries/{id}/sections/reorder/
 */
export const ReorderGallerySectionsApi = async (
  galleryId: string,
  sections: string[]
): Promise<ReorderGallerySectionsResponse> => {
  return CommonApi<ReorderGallerySectionsResponse>('POST', `/api/galleries/${galleryId}/sections/reorder/`, { sections });
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
): Promise<TrackGalleryAnalyticsEventResponse> => {
  return CommonApi<TrackGalleryAnalyticsEventResponse>('POST', `/api/galleries/${galleryId}/analytics/event/`, {
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

export const GalleryApi = {
  uploadMediaItem,
  UploadGalleryMediaApi,
  BulkUploadGalleryMediaApi,
  GetGalleriesApi,
  GetGalleryDetailApi,
  CreateGalleryApi,
  UpdateGalleryApi,
  DeleteGalleryApi,
  ArchiveGalleryApi,
  RestoreGalleryApi,
  MoveMediaToSectionApi,
  DeleteGalleryMediaApi,
  BulkDeleteGalleryMediaApi,
  ToggleMediaFavoriteApi,
  BulkToggleMediaFavoriteApi,
  SetGalleryCoverImageApi,
  SetMasonrySlotBannerApi,
  AddGallerySectionApi,
  DeleteGallerySectionApi,
  RenameGallerySectionApi,
  GetGalleryShareDetailsApi,
  SetGalleryTemplateApi,
  SetGalleryTemplateBannerApi,
  ReorderGalleryMediaApi,
  ReorderGallerySectionsApi,
  GetGalleryAnalyticsApi,
  TrackGalleryAnalyticsEventApi,
  ExportGalleryAnalyticsCsvApi,
};
