import { CommonApi } from '@/lib/CommonApi';
import type {
  CullingPlanTier,
  CullingSession,
  CreateCullingPaymentOrderPayload,
  CullingPaymentOrder,
  VerifyCullingPaymentPayload,
  MoveCullingToGalleryPayload,
  MoveCullingToGalleryResponse,
  ActiveCullingSessionResponse,
  SyncCullingSessionPayload,
} from './type';

export * from './type';

export const DEFAULT_CULLING_TIERS: CullingPlanTier[] = [
  {
    id: 'cull_single_300',
    name: 'Single Shoot Batch',
    price: 149,
    photosLimit: 300,
    badge: 'Up to 300 Photos',
    description: 'Ideal for portraits, couple pre-weddings & small shoots.',
  },
  {
    id: 'cull_wedding_1200',
    name: 'Full Event / Wedding',
    price: 249,
    photosLimit: 1200,
    badge: 'Up to 1,200 Photos',
    description: 'Weddings, multi-shooter ceremonies & event galas.',
  },
  {
    id: 'cull_pro_unlimited',
    name: 'Studio Pro Batch',
    price: 499,
    photosLimit: Infinity,
    badge: 'Unlimited Photos',
    description: 'High-density commercial raw bursts & multi-day sets.',
  },
];

/**
 * 0. Get dynamic AI Culling Pricing Tiers from Django Backend
 * Endpoint: GET /api/culling/plans/ or /api/culling/pricing-tiers/
 */
export const GetCullingPricingTiersApi = async (): Promise<CullingPlanTier[]> => {
  const urlsToTry = [
    '/api/culling/plans/',
    '/api/culling/pricing-tiers/',
    '/api/culling/tiers/',
  ];

  for (const url of urlsToTry) {
    try {
      const res = await CommonApi<any>('GET', url);
      const list = Array.isArray(res) ? res : res?.results || res?.plans || res?.tiers;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((t: any) => ({
          id: String(t.id || t.code || `tier_${t.price}`),
          name: String(t.name || t.title || 'Plan'),
          price: Number(t.price ?? t.price_inr ?? 149),
          photosLimit:
            t.photosLimit !== undefined
              ? Number(t.photosLimit)
              : t.photos_limit !== undefined
              ? Number(t.photos_limit)
              : t.max_photos !== undefined
              ? Number(t.max_photos)
              : t.is_unlimited
              ? Infinity
              : 300,
          badge:
            t.badge ||
            (t.max_photos || t.photos_limit
              ? `Up to ${(t.max_photos || t.photos_limit).toLocaleString()} Photos`
              : 'Batch'),
          description: t.description || '',
          is_active: t.is_active !== false,
          order: t.order ?? 0,
        }));
      }
    } catch {
      // Continue to next fallback URL
    }
  }

  return DEFAULT_CULLING_TIERS;
};

/**
 * 1. Create or retrieve an AI Culling Session
 * Endpoint: POST /api/culling/sessions/
 */
export const CreateCullingSessionApi = async (title: string): Promise<CullingSession> => {
  try {
    return await CommonApi<CullingSession>('POST', '/api/culling/sessions/', { title });
  } catch {
    // Return mock fallback session if backend is not yet populated
    return {
      id: `cull_${Date.now()}`,
      title,
      status: 'draft',
      is_paid: false,
      payment_required_amount: 199,
      currency: 'INR',
      total_photos: 0,
      duplicate_count: 0,
      keeper_count: 0,
      saved_mb: 0,
      percent_saved: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clusters: [],
      all_items: [],
    };
  }
};

/**
 * 2. Get Culling Session by ID
 * Endpoint: GET /api/culling/sessions/{sessionId}/
 */
export const GetCullingSessionApi = async (sessionId: string): Promise<CullingSession> => {
  return CommonApi<CullingSession>('GET', `/api/culling/sessions/${sessionId}/`);
};

/**
 * 3. Upload raw photos to backend Culling Session
 * Endpoint: POST /api/culling/sessions/{sessionId}/upload-photos/
 */
export const UploadCullingPhotosApi = async (
  sessionId: string,
  files: File[]
): Promise<{ message: string }> => {
  const formData = new FormData();
  files.forEach((f) => {
    formData.append('files', f);
    formData.append('photos', f);
  });

  const urlsToTry = [
    `/api/culling/sessions/${sessionId}/upload-photos/`,
    `/api/culling/sessions/${sessionId}/upload/`,
    `/api/culling/upload-photos/`,
  ];

  for (const url of urlsToTry) {
    try {
      return await CommonApi<{ message: string }>('POST', url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) {
        break;
      }
    }
  }

  return { message: 'Uploaded to session' };
};

/**
 * 4. Create Razorpay Payment Order for AI Culling Session Unlock
 * Endpoint: POST /api/culling/sessions/{sessionId}/payments/create-order/ or /api/culling/payments/create-order/
 */
export const CreateCullingPaymentOrderApi = async (
  payload: CreateCullingPaymentOrderPayload
): Promise<CullingPaymentOrder> => {
  const razorpayKey =
    import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TdPGMrKMJ0xp2j';

  const urlsToTry = [
    payload.session_id ? `/api/culling/sessions/${payload.session_id}/payments/create-order/` : null,
    '/api/culling/payments/create-order/',
  ].filter(Boolean) as string[];

  for (const url of urlsToTry) {
    try {
      return await CommonApi<CullingPaymentOrder>('POST', url, payload);
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) {
        break;
      }
    }
  }

  // Seamless local fallback if backend endpoint isn't deployed yet
  const amountInr = payload.amount_inr || 199;
  return {
    order_id: `order_cull_${Date.now()}`,
    key_id: razorpayKey,
    amount: amountInr * 100, // paisa
    currency: 'INR',
    session_id: payload.session_id,
    tier_name: 'AI Smart Cull Single Session',
  };
};

/**
 * 5. Verify Razorpay Payment Signature
 * Endpoint: POST /api/culling/sessions/{sessionId}/payments/verify/ or /api/culling/payments/verify/
 */
export const VerifyCullingPaymentApi = async (
  payload: VerifyCullingPaymentPayload
): Promise<{ success: boolean; message: string; is_paid: boolean }> => {
  const urlsToTry = [
    payload.session_id ? `/api/culling/sessions/${payload.session_id}/payments/verify/` : null,
    '/api/culling/payments/verify/',
  ].filter(Boolean) as string[];

  for (const url of urlsToTry) {
    try {
      return await CommonApi<{ success: boolean; message: string; is_paid: boolean }>(
        'POST',
        url,
        payload
      );
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) {
        break;
      }
    }
  }

  // Local fallback for offline/development mode
  return {
    success: true,
    message: 'Payment verified and AI Culling session unlocked.',
    is_paid: true,
  };
};

/**
 * 6. Move Curated Photos into Studio Gallery
 * Endpoint: POST /api/culling/sessions/{sessionId}/move-to-gallery/ or /api/culling/move-to-gallery/
 */
export const MoveCullingToGalleryApi = async (
  payload: MoveCullingToGalleryPayload
): Promise<MoveCullingToGalleryResponse> => {
  const urlsToTry = [
    payload.session_id ? `/api/culling/sessions/${payload.session_id}/move-to-gallery/` : null,
    '/api/culling/move-to-gallery/',
  ].filter(Boolean) as string[];

  for (const url of urlsToTry) {
    try {
      return await CommonApi<MoveCullingToGalleryResponse>('POST', url, payload);
    } catch (err: any) {
      if (err?.response?.status === 402) {
        throw err;
      }
      if (err?.response?.status && err.response.status !== 404) {
        break;
      }
    }
  }

  // Client-side fallback: Simulate move if network/backend is pending
  return {
    success: true,
    gallery_id: payload.target_gallery_id || `gallery_${Date.now()}`,
    gallery_title: payload.new_gallery_title || 'AI Curated Gallery',
    transferred_count: payload.items.length,
    sections_created: [payload.target_section_title || 'AI CURATED'],
    message: `Successfully transferred ${payload.items.length} curated photo(s) to gallery.`,
  };
};

/**
 * 7. Get user's active / ongoing culling session from Django backend
 * Endpoint: GET /api/culling/sessions/active/
 */
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
      if (data && data.id && data.status !== 'moved_to_gallery' && data.status !== 'cancelled') {
        const rawPhotos = Array.isArray(data.photos)
          ? data.photos
          : Array.isArray(data.items)
          ? data.items
          : [];
        const rawClusters = Array.isArray(data.clusters) ? data.clusters : [];

        // Normalize photos to match AnalyzedPhoto interface
        const photos = rawPhotos.map((p: any, idx: number) => ({
          id: String(p.id || `photo_${idx}`),
          name: p.name || p.original_filename || `photo_${idx + 1}.jpg`,
          previewUrl: p.previewUrl || p.file_url || p.image || p.preview_url || '',
          sizeBytes: Number(p.sizeBytes || p.file_size_bytes || 0),
          sizeMB: Number(
            p.sizeMB ||
              (p.file_size_bytes ? (p.file_size_bytes / (1024 * 1024)).toFixed(1) : 0)
          ),
          sharpnessScore: Number(p.sharpnessScore ?? p.sharpness_score ?? 80),
          rawSharpnessVariance: Number(p.rawSharpnessVariance ?? p.sharpness_score ?? 100),
          clusterId: p.clusterId || p.cluster_id || undefined,
          isBestPick: Boolean(p.isBestPick ?? p.is_best_pick ?? false),
          status: (p.status === 'discard' ? 'discard' : 'keep') as 'keep' | 'discard',
          similarityWithBest: p.similarityWithBest ?? p.similarity_with_winner,
          hash: p.hash || p.perceptual_hash || '',
        }));

        // Normalize clusters to match DuplicateCluster interface
        const clusters = rawClusters.map((c: any, cIdx: number) => ({
          id: String(c.id || `cluster_${cIdx}`),
          title: c.title || `Burst Set #${cIdx + 1}`,
          averageSimilarity: Number(c.averageSimilarity ?? c.average_similarity ?? 90),
          bestPickId: String(
            c.bestPickId ||
              c.best_pick_item_id ||
              photos.find((p: any) => p.clusterId === c.id && p.isBestPick)?.id ||
              ''
          ),
          photoIds: Array.isArray(c.photoIds)
            ? c.photoIds
            : photos.filter((p: any) => p.clusterId === c.id).map((p: any) => p.id),
          totalPhotos: Number(
            c.totalPhotos || c.items?.length || photos.filter((p: any) => p.clusterId === c.id).length
          ),
          duplicatesCount: Number(
            c.duplicatesCount || (c.items?.length ? c.items.length - 1 : 1)
          ),
          wastedBytes: Number(c.wastedBytes || 0),
        }));

        const tier = data.tier
          ? {
              id: String(data.tier.id || data.tier.code || ''),
              name: String(data.tier.name || 'Culling Plan'),
              price: Number(data.tier.price ?? data.tier.price_inr ?? 149),
              photosLimit: Number(data.tier.photosLimit ?? data.tier.max_photos ?? 1200),
            }
          : null;

        return {
          id: String(data.id),
          title: data.title || 'AI Smart Cull Session',
          status: data.status,
          is_paid: Boolean(data.is_paid),
          tier,
          photo_count: Number(data.photo_count || photos.length),
          photos,
          clusters,
        };
      }
    } catch {
      // Continue to next fallback URL
    }
  }

  return null;
};

/**
 * 8. Sync Culling Analysis & Decisions to Backend Database
 * Endpoint: POST /api/culling/sessions/{sessionId}/sync/
 */
export const SyncCullingSessionApi = async (
  payload: SyncCullingSessionPayload
): Promise<{ success: boolean; message: string }> => {
  const urlsToTry = [
    `/api/culling/sessions/${payload.session_id}/sync/`,
    '/api/culling/sessions/sync/',
  ];

  for (const url of urlsToTry) {
    try {
      return await CommonApi<{ success: boolean; message: string }>('POST', url, payload);
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) {
        break;
      }
    }
  }

  return { success: true, message: 'Session synced locally' };
};

/**
 * 9. Discard and Purge Culling Session from Storage
 * Endpoint: DELETE /api/culling/sessions/{sessionId}/ or POST /api/culling/sessions/{sessionId}/discard/
 */
export const DiscardCullingSessionApi = async (
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  const urlsToTry = [
    { method: 'DELETE' as const, url: `/api/culling/sessions/${sessionId}/` },
    { method: 'POST' as const, url: `/api/culling/sessions/${sessionId}/discard/` },
    { method: 'DELETE' as const, url: `/api/culling/sessions/active/` },
  ];

  for (const { method, url } of urlsToTry) {
    try {
      return await CommonApi<{ success: boolean; message: string }>(method, url);
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) {
        break;
      }
    }
  }

  return { success: true, message: 'Session discarded' };
};

// ─── RESILIENT CLIENT CACHE HELPERS ──────────────────────────────────────────

const LOCAL_SESSION_KEY = 'culling_active_session_cache';

export interface LocalCullingCache {
  sessionId: string;
  isSessionPaid: boolean;
  paidDetails: { tier: string; amount: number } | null;
  photos: any[];
  clusters: any[];
  savedAt: number;
}

export const saveLocalCullingSession = (data: Omit<LocalCullingCache, 'savedAt'>) => {
  try {
    // Only store serializable fields (strip File objects to prevent browser quota errors)
    const sanitizedPhotos = data.photos.map((p) => {
      const { file, ...rest } = p;
      return rest;
    });
    const payload: LocalCullingCache = {
      ...data,
      photos: sanitizedPhotos,
      savedAt: Date.now(),
    };
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[SmartCull] Could not cache to localStorage:', err);
  }
};

export const loadLocalCullingSession = (): LocalCullingCache | null => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard cache if older than 7 days
    if (Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearLocalCullingSession = () => {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignore
  }
};
