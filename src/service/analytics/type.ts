// -------------------------------------------------------------
// Gallery Analytics & Telemetry API Types
// -------------------------------------------------------------

export interface TrackGalleryActivityPayload {
  type: 'view' | 'download' | 'favorite' | 'share';
  device?: string;
  details?: string;
}

export interface TrackGalleryActivityResponse {
  success: boolean;
}
