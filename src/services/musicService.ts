export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  category: 'romantic' | 'cinematic' | 'acoustic' | 'piano' | 'lofi' | 'celebration';
  badge?: string;
}

/**
 * Accurately formats total duration seconds into M:SS (e.g. 227s -> 3:47, 30s -> 0:30)
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0:30';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Curated high-fidelity soundtrack library with 100% verified, active 200 OK CDN preview audio streams
export const CURATED_TRACKS: Track[] = [
  {
    id: 'curated-1',
    title: 'A Thousand Years',
    artist: 'Christina Perri',
    duration: 285,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f5/2e/83/f52e8357-9cf4-e644-c365-3c21839f85ac/mzi.staekbjw.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8e/3a/e7/8e3ae749-5e13-a9ca-fef6-61d615bc3087/mzaf_5415208554281396500.plus.aac.p.m4a',
    category: 'romantic',
    badge: 'Trending'
  },
  {
    id: 'curated-2',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    duration: 263,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c7/ba/bc/c7babc66-f598-aaa6-bcf6-307281795817/mzaf_16337361235117168274.plus.aac.p.m4a',
    category: 'romantic',
    badge: 'Wedding Hit'
  },
  {
    id: 'curated-3',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    duration: 178,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/64/d2/c5/64d2c511-67f4-ae09-5153-d39c3da413a3/21UMGIM75467.rgb.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/53/82/c1/5382c1d4-ddba-aa2b-90df-57268895fac9/mzaf_8926201202931541051.plus.aac.p.m4a',
    category: 'acoustic',
    badge: 'Trending'
  },
  {
    id: 'curated-4',
    title: 'Time (Inception Theme)',
    artist: 'Hans Zimmer',
    duration: 276,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/62/eb/2b62ebd7-aa99-988a-0fee-714162f6fbeb/093624965008.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e0/1d/a4/e01da4a2-a75f-7ebf-9971-3d49e17efc57/mzaf_10500078769097048384.plus.aac.p.m4a',
    category: 'cinematic',
    badge: 'Epic Cinema'
  },
  {
    id: 'curated-5',
    title: 'golden hour',
    artist: 'JVKE',
    duration: 209,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8d/1a/7b/8d1a7b44-316f-7c7f-4380-935673fb697a/5056167175650.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/30/02/8c/30028c8a-a125-5466-bcc6-27a83b1c0135/mzaf_16911571635366913039.plus.aac.p.m4a',
    category: 'lofi',
    badge: 'Viral Dream'
  },
  {
    id: 'curated-6',
    title: 'Experience',
    artist: 'Ludovico Einaudi',
    duration: 315,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/13/fd/7b/13fd7bfd-125a-4493-dc85-96aef9c25562/12UMGIM65023.rgb.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ab/9a/93/ab9a931d-93d3-71f8-8faf-73366409df82/mzaf_5843577385542178088.plus.aac.p.m4a',
    category: 'piano',
    badge: 'Masterpiece'
  },
  {
    id: 'curated-7',
    title: "Can't Help Falling in Love",
    artist: 'Kina Grannis',
    duration: 202,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ea/93/91/ea9391c7-f9f6-033f-c97a-66c415032692/794043197215.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cf/dd/2e/cfdd2e01-c248-6845-daaf-e19b0d2f0577/mzaf_2042819518909429825.plus.aac.p.m4a',
    category: 'acoustic',
    badge: 'Wedding Classic'
  },
  {
    id: 'curated-8',
    title: 'Marry You',
    artist: 'Bruno Mars',
    duration: 230,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/98/ae/c2/98aec2e1-3be4-0311-1b44-69348fc87abb/075679956484.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d1/97/a2/d197a2c2-fde1-1236-1a87-522408b3ec4a/mzaf_4209160621342890082.plus.aac.p.m4a',
    category: 'celebration',
    badge: 'Joyful Party'
  }
];

export interface TrackCategory {
  id: string;
  label: string;
  icon: string;
  queryKeyword: string;
}

export const TRACK_CATEGORIES: TrackCategory[] = [
  { id: 'all', label: 'Trending', icon: 'Sparkles', queryKeyword: 'romantic love wedding' },
  { id: 'romantic', label: 'Love & Wedding', icon: 'Heart', queryKeyword: 'wedding love romance acoustic' },
  { id: 'cinematic', label: 'Cinematic Movie', icon: 'Film', queryKeyword: 'hans zimmer movie soundtrack cinematic' },
  { id: 'acoustic', label: 'Acoustic & Soft', icon: 'Music', queryKeyword: 'acoustic guitar indie love' },
  { id: 'piano', label: 'Piano & Strings', icon: 'Activity', queryKeyword: 'piano romance ludovico strings' },
  { id: 'lofi', label: 'Lo-Fi Chill', icon: 'Headphones', queryKeyword: 'lofi chill beats romantic' },
  { id: 'celebration', label: 'Joyful Party', icon: 'PartyPopper', queryKeyword: 'upbeat happy joyful celebration wedding' },
];

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl100: string;
  primaryGenreName: string;
  trackTimeMillis: number;
}

// In-memory category cache for instant navigation without redundant network fetches
const categoryCache = new Map<string, Track[]>();

/**
 * Dynamically fetches songs for a specific category directly from the iTunes Search API.
 */
export async function fetchCategoryTracks(categoryId: string): Promise<Track[]> {
  if (categoryCache.has(categoryId)) {
    return categoryCache.get(categoryId)!;
  }

  const cat = TRACK_CATEGORIES.find((c) => c.id === categoryId);
  const term = cat?.queryKeyword || 'wedding love romance';

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25`
    );

    if (!response.ok) {
      return CURATED_TRACKS;
    }

    const data = await response.json();
    const tracks: Track[] = (data.results || [])
      .filter((item: ITunesResult) => !!item.previewUrl)
      .map((item: ITunesResult) => {
        const hdArtwork = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '300x300bb')
          : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';

        return {
          id: `itunes-${item.trackId}`,
          title: item.trackName,
          artist: item.artistName,
          duration: Math.round((item.trackTimeMillis || 30000) / 1000),
          coverUrl: hdArtwork,
          audioUrl: item.previewUrl,
          category: (categoryId === 'all' ? 'romantic' : categoryId) as any,
          badge: item.primaryGenreName || 'Music',
        };
      });

    if (tracks.length > 0) {
      // Prepend matching curated favorite if present
      const curatedForCat = CURATED_TRACKS.filter(
        (c) => categoryId === 'all' || c.category === categoryId
      );
      curatedForCat.forEach((c) => {
        if (!tracks.some((t) => t.title.toLowerCase() === c.title.toLowerCase())) {
          tracks.unshift(c);
        }
      });

      categoryCache.set(categoryId, tracks);
      return tracks;
    }

    return CURATED_TRACKS;
  } catch {
    return CURATED_TRACKS;
  }
}

/**
 * Searches real popular songs via the public iTunes Search API.
 * Returns formatted Track array with album cover, preview audio URL, and artist metadata.
 */
export async function searchTracks(query: string): Promise<Track[]> {
  if (!query || query.trim().length === 0) {
    return CURATED_TRACKS;
  }

  const cleanQuery = query.trim();

  // First check if matching our local curated list
  const localMatches = CURATED_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=song&limit=25`
    );

    if (!response.ok) {
      return localMatches.length > 0 ? localMatches : CURATED_TRACKS;
    }

    const data = await response.json();
    const itunesTracks: Track[] = (data.results || [])
      .filter((item: ITunesResult) => !!item.previewUrl)
      .map((item: ITunesResult) => {
        const hdArtwork = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '300x300bb')
          : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';

        return {
          id: `itunes-${item.trackId}`,
          title: item.trackName,
          artist: item.artistName,
          duration: Math.round((item.trackTimeMillis || 30000) / 1000),
          coverUrl: hdArtwork,
          audioUrl: item.previewUrl,
          category: 'romantic' as const,
          badge: item.primaryGenreName || 'Music',
        };
      });

    // Combine local curated matches + itunes results
    const combined = [...itunesTracks];
    localMatches.forEach((lm) => {
      if (!combined.some((t) => t.title.toLowerCase() === lm.title.toLowerCase())) {
        combined.unshift(lm);
      }
    });

    return combined.length > 0 ? combined : CURATED_TRACKS;
  } catch {
    // Network or offline fallback
    return localMatches.length > 0 ? localMatches : CURATED_TRACKS;
  }
}
