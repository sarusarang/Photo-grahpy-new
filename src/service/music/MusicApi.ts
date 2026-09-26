import { CommonApi } from '@/lib/CommonApi';
import type { MusicTrack } from '@/types/atelier';

/**
 * 1. Retrieve Curated Ambient Soundtrack Library
 * Endpoint: GET /api/music/tracks/ or /api/music/
 */
export const GetMusicTracksApi = async (): Promise<MusicTrack[]> => {
  try {
    const res = await CommonApi<MusicTrack[] | { results?: MusicTrack[]; data?: MusicTrack[] }>('GET', '/api/music/tracks/');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).results)) return (res as any).results;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  } catch {
    const res = await CommonApi<MusicTrack[] | { results?: MusicTrack[]; data?: MusicTrack[] }>('GET', '/api/music/');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).results)) return (res as any).results;
    return [];
  }
};

/**
 * 2. Upload Custom Ambient Track
 * Endpoint: POST /api/music/custom/
 */
export const UploadCustomTrackApi = async (
  file: File,
  title: string,
  artist: string = 'Custom Studio Track'
): Promise<MusicTrack> => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('title', title);
  formData.append('artist', artist);
  return CommonApi<MusicTrack>('POST', '/api/music/custom/', formData);
};
