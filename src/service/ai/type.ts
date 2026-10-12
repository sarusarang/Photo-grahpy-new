import type { MediaItem } from '@/types/atelier';

// -------------------------------------------------------------
// AI Face Search & Recognition API Types
// -------------------------------------------------------------

export interface FaceSearchResult {
  matched_media_ids: string[];
  matched_media?: MediaItem[];
  total_matches: number;
  confidence?: number;
}

