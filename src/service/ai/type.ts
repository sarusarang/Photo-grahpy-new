// -------------------------------------------------------------
// AI Face Search & Recognition API Types
// -------------------------------------------------------------

export interface FaceSearchResult {
  matched_media_ids: string[];
  matched_media?: any[];
  total_matches: number;
  confidence?: number;
}
