// ─── Culling Photo Types ──────────────────────────────────────────────────────

export interface CullingPhotoItem {
  id: string;
  original_filename: string;
  file_url: string;
  file_size_bytes: number;
  width?: number;
  height?: number;
  hash?: string;
  sharpness_score?: number;
  is_best_pick?: boolean;
  is_duplicate?: boolean;
  status: 'keep' | 'discard';
  similarity_with_winner?: number;
  cluster_id?: string;
  created_at?: string;
}

export interface CullingClusterGroup {
  id: string;
  title: string;
  best_pick_item_id: string;
  average_similarity: number;
  items: CullingPhotoItem[];
}

// ─── Session Types ────────────────────────────────────────────────────────────

export interface CullingSession {
  id: string;
  title: string;
  /** draft | analyzing | completed | archived */
  status: string;
  total_photos: number;
  duplicate_count: number;
  keeper_count: number;
  saved_mb: number;
  percent_saved: number;
  created_at: string;
  updated_at: string;
  clusters: CullingClusterGroup[];
  all_items: CullingPhotoItem[];
}

// ─── Active Session Response ──────────────────────────────────────────────────

export interface ActiveCullingSessionResponse {
  id: string;
  title?: string;
  /** pending | analyzing | completed | moved_to_gallery | cancelled */
  status: string;
  photo_count: number;
  photos: Array<{
    id: string;
    name: string;
    previewUrl: string;
    sizeBytes: number;
    sizeMB: number;
    sharpnessScore: number;
    rawSharpnessVariance?: number;
    clusterId?: string;
    isBestPick?: boolean;
    status: 'keep' | 'discard';
    similarityWithBest?: number;
    hash: string;
  }>;
  clusters: Array<{
    id: string;
    title: string;
    averageSimilarity: number;
    bestPickId: string;
    photoIds: string[];
    totalPhotos: number;
    duplicatesCount: number;
    wastedBytes: number;
  }>;
}

// ─── Sync Payload ─────────────────────────────────────────────────────────────

export interface SyncCullingSessionPayload {
  session_id: string;
  photos: Array<{
    id: string;
    name: string;
    previewUrl?: string;
    sizeBytes: number;
    sizeMB?: number;
    sharpnessScore: number;
    clusterId?: string;
    isBestPick?: boolean;
    status: 'keep' | 'discard';
    similarityWithBest?: number;
    hash?: string;
  }>;
  clusters: Array<{
    id: string;
    title: string;
    averageSimilarity: number;
    bestPickId: string;
    photoIds: string[];
    totalPhotos: number;
    duplicatesCount: number;
    wastedBytes: number;
  }>;
}

// ─── Move to Gallery Types ────────────────────────────────────────────────────

export interface MoveCullingToGalleryPayload {
  session_id?: string;
  target_mode: 'existing' | 'new';
  target_gallery_id?: string | null;
  new_gallery_title?: string;
  target_section_title?: string;
  category_assignments?: Record<string, string>;
  include_duplicates?: boolean;
  duplicate_section_title?: string;
  items: Array<{
    id: string;
    url: string;
    name: string;
    sizeBytes: number;
    status: 'keep' | 'discard';
    sectionTitle?: string;
  }>;
}

export interface MoveCullingToGalleryResponse {
  success: boolean;
  gallery_id: string;
  gallery_title: string;
  transferred_count: number;
  sections_created: string[];
  message: string;
}

// ─── Upload & Action Response Types ──────────────────────────────────────────

export interface CullingUploadedPhoto {
  id: string;
  name: string;
  previewUrl: string;
  sizeBytes: number;
  sizeMB: number;
}

export interface UploadCullingPhotosResponse {
  message: string;
  session_id?: string;
  photos: CullingUploadedPhoto[];
}

export interface CullingActionResponse {
  success: boolean;
  message: string;
}

