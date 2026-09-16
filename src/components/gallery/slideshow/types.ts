import type { MediaItem } from '../../../types';
import type { Track } from '../../../services/musicService';

export type CinemaFitMode = 'cover' | 'contain';
export type CinemaColorGrade = 'gold' | 'noir' | 'romance' | 'natural';
export type CinemaAspectRatio = 'full' | '2.39' | '16:9';

export interface SlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  initialIndex?: number;
  galleryTitle?: string;
  clientName?: string;
  selectedTrack?: Track | null;
  onChangeTrack?: () => void;
}
