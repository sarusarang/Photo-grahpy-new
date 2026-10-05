import type { MusicTrack } from '@/types/atelier';

// -------------------------------------------------------------
// Ambient Music & Soundtrack Library API Types
// -------------------------------------------------------------

export type { MusicTrack };

export interface UploadCustomTrackPayload {
  file: File;
  title: string;
  artist?: string;
}
