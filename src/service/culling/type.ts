export interface CullingPlanTier {
  id: string;
  name: string;
  price: number;
  photosLimit: number;
  badge: string;
  description: string;
  is_active?: boolean;
  order?: number;
}

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

export interface CullingSession {
  id: string;
  title: string;
  status: 'draft' | 'analyzing' | 'completed' | 'archived';
  is_paid: boolean;
  payment_required_amount: number;
  currency: string;
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

export interface CreateCullingPaymentOrderPayload {
  session_id: string;
  tier_id?: string; // e.g. 'cull_single_300' | 'cull_wedding_1200' | 'cull_pro_unlimited'
  amount_inr?: number;
  photo_count?: number;
}

export interface CullingPaymentOrder {
  order_id: string;
  key_id: string;
  amount: number; // in smallest unit (paisa, e.g. 19900 = ₹199)
  currency: string;
  session_id: string;
  tier_name: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface VerifyCullingPaymentPayload {
  session_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

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

export interface ActiveCullingSessionResponse {
  id: string;
  title?: string;
  status: 'pending_payment' | 'paid' | 'analyzing' | 'completed' | 'moved_to_gallery' | 'cancelled';
  is_paid: boolean;
  tier?: {
    id: string;
    name: string;
    price: number;
    photosLimit: number;
  } | null;
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

export interface SyncCullingSessionPayload {
  session_id: string;
  tier_id?: string;
  is_paid?: boolean;
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
