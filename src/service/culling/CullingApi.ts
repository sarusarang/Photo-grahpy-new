import { CommonApi } from '@/lib/CommonApi';
import { resolveImageUrl } from '@/utils/downloadUtils';
import { getUploadBatchSize } from '@/utils/uploadConfig';
import { executeBatchUpload, createAbortError } from '@/utils/batchUploadRunner';
import type {
  CullingSession,
  MoveCullingToGalleryPayload,
  MoveCullingToGalleryResponse,
  ActiveCullingSessionResponse,
  SyncCullingSessionPayload,
  UploadCullingPhotosResponse,
  CullingUploadedPhoto,
  CullingActionResponse,
} from './type';

export * from './type';

// ─── 1. Upload Photos to Culling Session Staging Storage ─────────────────────
// POST /api/culling/sessions/{id}/upload-photos/ | POST /api/culling/upload/

export const UploadCullingPhotosApi = async (
  sessionId: string,
  files: File[],
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<UploadCullingPhotosResponse> => {
  if (!files || files.length === 0) {
    return { message: 'No files provided', photos: [] };
  }

  // Dynamic batch size from .env (VITE_UPLOAD_BATCH_SIZE) matching Gallery & Event uploads
  const BATCH_SIZE = getUploadBatchSize(false);

  let activeSessionId = sessionId;
  const allUploadedPhotos: CullingUploadedPhoto[] = [];
  let lastMessage: string | undefined = undefined;

  await executeBatchUpload<File, CullingUploadedPhoto[]>({
    items: files,
    batchSize: BATCH_SIZE,
    itemLabel: 'photo',
    signal,
    onProgress,
    uploadBatch: async (chunkFiles, onChunkProgress, batchIndex) => {
      const formData = new FormData();
      if (activeSessionId) {
        formData.append('session_id', activeSessionId);
      }
      chunkFiles.forEach((f) => {
        formData.append('photos', f);
      });

      const urlsToTry = [
        activeSessionId ? `/api/culling/sessions/${activeSessionId}/upload-photos/` : null,
        activeSessionId ? `/api/culling/sessions/${activeSessionId}/upload/` : null,
        '/api/culling/upload/',
        '/api/culling/upload-photos/',
      ].filter(Boolean) as string[];

      let res: any = null;
      let lastErr: any = null;

      for (const url of urlsToTry) {
        if (signal?.aborted) throw createAbortError();
        try {
          res = await CommonApi<any>('POST', url, formData, {
            timeout: 300000,
            signal,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onChunkProgress) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onChunkProgress(percent, progressEvent.loaded);
              }
            },
          });
          break;
        } catch (err: any) {
          lastErr = err;
          // Fall through on 404 to try alternative endpoint URL
          if (err?.response?.status && err.response.status !== 404) {
            throw err;
          }
        }
      }

      if (!res) {
        throw lastErr || new Error('Upload to backend culling staging storage failed.');
      }

      if (res?.session_id) {
        activeSessionId = res.session_id;
      }
      if (res?.message) {
        lastMessage = res.message;
      }

      const photoList = Array.isArray(res?.photos)
        ? res.photos
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.media)
        ? res.media
        : Array.isArray(res)
        ? res
        : [];

      const chunkPhotos: CullingUploadedPhoto[] = [];

      if (photoList.length > 0) {
        photoList.forEach((p: any, idx: number) => {
          const rawUrl = p.previewUrl || p.file_url || p.image || p.preview_url || p.file || p.url || '';
          const sizeBytes = Number(p.size_bytes || p.file_size_bytes || p.sizeBytes || chunkFiles[idx]?.size || 0);
          chunkPhotos.push({
            id: String(p.id || `photo_${Date.now()}_${batchIndex}_${idx}`),
            name: p.name || p.original_filename || chunkFiles[idx]?.name || `photo_${idx + 1}.jpg`,
            previewUrl: resolveImageUrl(rawUrl),
            sizeBytes,
            sizeMB: Number(p.size_mb || p.sizeMB || (sizeBytes > 0 ? +(sizeBytes / (1024 * 1024)).toFixed(1) : 0)),
          });
        });
      } else {
        // Fallback if backend returned session response without serialized photo list
        chunkFiles.forEach((file, idx) => {
          chunkPhotos.push({
            id: `photo_${Date.now()}_${batchIndex}_${idx}`,
            name: file.name,
            previewUrl: URL.createObjectURL(file),
            sizeBytes: file.size,
            sizeMB: +(file.size / (1024 * 1024)).toFixed(1),
          });
        });
      }

      return chunkPhotos;
    },
    onBatchSuccess: (chunkPhotos) => {
      allUploadedPhotos.push(...chunkPhotos);
    },
  });

  return {
    message: lastMessage || 'Photos uploaded successfully',
    session_id: activeSessionId,
    photos: allUploadedPhotos,
  };
};

export const BulkUploadCullingPhotosApi = UploadCullingPhotosApi;

// ─── 2. Get Active / Ongoing Culling Session ──────────────────────────────────
// GET /api/culling/sessions/active/

export const GetActiveCullingSessionApi = async (): Promise<ActiveCullingSessionResponse | null> => {
  const urlsToTry = [
    '/api/culling/sessions/active/',
    '/api/culling/sessions/latest/',
    '/api/culling/sessions/current/',
  ];

  for (const url of urlsToTry) {
    try {
      const res = await CommonApi<any>('GET', url);
      const data = res?.session || res?.data || res;

      if (data?.id && data.status !== 'moved_to_gallery' && data.status !== 'cancelled') {
        const rawPhotos: any[] = Array.isArray(data.photos)
          ? data.photos
          : Array.isArray(data.items)
          ? data.items
          : [];
        const rawClusters: any[] = Array.isArray(data.clusters) ? data.clusters : [];

        const photos = rawPhotos.map((p: any, idx: number) => {
          const rawUrl = p.previewUrl || p.file_url || p.image || p.preview_url || p.file || p.url || '';
          const sizeBytes = Number(p.sizeBytes || p.file_size_bytes || p.size_bytes || 0);
          const sizeMB = Number(
            p.sizeMB || p.size_mb || (sizeBytes > 0 ? +(sizeBytes / (1024 * 1024)).toFixed(1) : 0)
          );

          let name = p.name || p.original_filename || `photo_${idx + 1}.jpg`;
          if (name.startsWith('Photo_photo_') && p.original_filename) {
            name = p.original_filename;
          } else if (name.startsWith('Photo_photo_') && typeof p.file === 'string') {
            const parts = p.file.split('/');
            name = parts[parts.length - 1] || name;
          }

          return {
            id: String(p.id || `photo_${idx}`),
            name,
            previewUrl: resolveImageUrl(rawUrl),
            sizeBytes,
            sizeMB,
            sharpnessScore: Number(p.sharpnessScore ?? p.sharpness_score ?? 80),
            rawSharpnessVariance: Number(p.rawSharpnessVariance ?? p.sharpness_score ?? 100),
            clusterId: p.clusterId || p.cluster_id || undefined,
            isBestPick: Boolean(p.isBestPick ?? p.is_best_pick ?? false),
            status: (p.status === 'discard' ? 'discard' : 'keep') as 'keep' | 'discard',
            similarityWithBest: p.similarityWithBest ?? p.similarity_with_winner,
            hash: p.hash || p.perceptual_hash || '',
          };
        });

        const clusters = rawClusters.map((c: any, cIdx: number) => ({
          id: String(c.id || `cluster_${cIdx}`),
          title: c.title || `Burst Set #${cIdx + 1}`,
          averageSimilarity: Number(c.averageSimilarity ?? c.average_similarity ?? 90),
          bestPickId: String(
            c.bestPickId ||
              c.best_pick_item_id ||
              photos.find((p) => p.clusterId === c.id && p.isBestPick)?.id ||
              ''
          ),
          photoIds: Array.isArray(c.photoIds)
            ? c.photoIds
            : photos.filter((p) => p.clusterId === c.id).map((p) => p.id),
          totalPhotos: Number(
            c.totalPhotos || c.items?.length || photos.filter((p) => p.clusterId === c.id).length
          ),
          duplicatesCount: Number(c.duplicatesCount || (c.items?.length ? c.items.length - 1 : 1)),
          wastedBytes: Number(c.wastedBytes || 0),
        }));

        return {
          id: String(data.id),
          title: data.title || 'AI Smart Cull Session',
          status: data.status,
          photo_count: Number(data.photo_count || photos.length),
          photos,
          clusters,
        };
      }
    } catch {
      // Try next URL
    }
  }

  return null;
};

// ─── 3. Trigger Backend Server-Side AI Analysis Pipeline ───────────────────
// POST /api/culling/sessions/{id}/analyze/

export const TriggerAICullingAnalysisApi = async (
  sessionId: string,
  similarityThreshold: number = 88
): Promise<ActiveCullingSessionResponse | null> => {
  const urlsToTry = [
    `/api/culling/sessions/${sessionId}/analyze/`,
    '/api/culling/analyze/',
  ];

  for (const url of urlsToTry) {
    try {
      const res = await CommonApi<any>('POST', url, {
        session_id: sessionId,
        similarity_threshold: similarityThreshold,
      });
      const data = res?.session || res?.data || res;
      if (data?.id) {
        return await GetActiveCullingSessionApi();
      }
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) throw err;
    }
  }

  return null;
};

// ─── 4. Create a New Culling Session ─────────────────────────────────────────
// POST /api/culling/sessions/

export const CreateCullingSessionApi = async (title: string): Promise<CullingSession> => {
  return CommonApi<CullingSession>('POST', '/api/culling/sessions/', { title });
};

// ─── 5. Sync Culling Analysis & Decisions to Backend ─────────────────────────
// POST /api/culling/sessions/{id}/sync/

export const SyncCullingSessionApi = async (
  payload: SyncCullingSessionPayload
): Promise<CullingActionResponse> => {
  const urlsToTry = [
    `/api/culling/sessions/${payload.session_id}/sync/`,
    '/api/culling/sessions/sync/',
    '/api/culling/sync/',
    `/api/culling/sessions/${payload.session_id}/`,
  ];

  let _lastErr: any = null;
  for (const url of urlsToTry) {
    try {
      return await CommonApi<CullingActionResponse>('POST', url, payload);
    } catch (err: any) {
      _lastErr = err;
      if (err?.response?.status && err.response.status !== 404) break;
    }
  }

  // If 404, log explicit warning with exact URL and return false/message so UI can report
  console.warn(
    `[SmartCull Backend Sync] Endpoints ${urlsToTry.join(', ')} returned 404 Not Found. Backend route missing.`
  );
  return { success: false, message: 'Backend sync endpoint returned 404. Check backend routes.' };
};

// ─── 5. Move Curated Photos into Studio Gallery ───────────────────────────────
// POST /api/culling/sessions/{id}/move-to-gallery/

export const MoveCullingToGalleryApi = async (
  payload: MoveCullingToGalleryPayload
): Promise<MoveCullingToGalleryResponse> => {
  const urlsToTry = [
    payload.session_id ? `/api/culling/sessions/${payload.session_id}/move-to-gallery/` : null,
    '/api/culling/move-to-gallery/',
  ].filter(Boolean) as string[];

  let lastError: any = null;
  for (const url of urlsToTry) {
    try {
      return await CommonApi<MoveCullingToGalleryResponse>('POST', url, payload);
    } catch (err: any) {
      lastError = err;
      if (err?.response?.status && err.response.status !== 404) throw err;
    }
  }

  throw lastError || new Error('Failed to move photos to gallery on backend.');
};

// ─── 6. Discard & Purge Culling Session from Storage ─────────────────────────
// DELETE /api/culling/sessions/{id}/  |  POST /api/culling/sessions/{id}/discard/

export const DiscardCullingSessionApi = async (
  sessionId: string
): Promise<CullingActionResponse> => {
  const urlsToTry = [
    { method: 'DELETE' as const, url: `/api/culling/sessions/${sessionId}/` },
    { method: 'POST' as const, url: `/api/culling/sessions/${sessionId}/discard/` },
    { method: 'DELETE' as const, url: `/api/culling/sessions/active/` },
  ];

  for (const { method, url } of urlsToTry) {
    try {
      return await CommonApi<CullingActionResponse>(method, url);
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) break;
    }
  }

  return { success: true, message: 'Session discarded' };
};
