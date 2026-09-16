import { Howl, Howler } from 'howler';
import type { Track } from './musicService';

class AudioManager {
  private soundtrackHowl: Howl | null = null;
  private previewHowl: Howl | null = null;
  private nativePreviewAudio: HTMLAudioElement | null = null;
  private nativeSoundtrackAudio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private previewTrack: Track | null = null;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    Howler.autoUnlock = true;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ─────────────────────────────────────────
  // PREVIEW PLAYER (used inside Music Picker)
  // ─────────────────────────────────────────
  public playPreview(track: Track, onEnd?: () => void) {
    // If clicking the currently playing preview, toggle pause
    if (this.previewTrack?.id === track.id) {
      if (this.previewHowl) {
        if (this.previewHowl.playing()) {
          this.previewHowl.pause();
          this.notify();
          return;
        } else {
          this.previewHowl.play();
          this.notify();
          return;
        }
      } else if (this.nativePreviewAudio) {
        if (!this.nativePreviewAudio.paused) {
          this.nativePreviewAudio.pause();
          this.notify();
          return;
        } else {
          this.nativePreviewAudio.play().catch(console.warn);
          this.notify();
          return;
        }
      }
    }

    // Stop existing preview
    this.stopPreview();

    this.previewTrack = track;

    try {
      this.previewHowl = new Howl({
        src: [track.audioUrl],
        html5: true,
        format: ['m4a', 'aac', 'mp3'],
        volume: this.isMuted ? 0 : this.volume,
        onplay: () => {
          this.notify();
        },
        onpause: () => {
          this.notify();
        },
        onend: () => {
          this.previewTrack = null;
          if (onEnd) onEnd();
          this.notify();
        },
        onloaderror: (_id, err) => {
          console.warn('Howler preview load issue, falling back to native Audio:', err);
          this.playNativePreviewFallback(track, onEnd);
        },
        onplayerror: (_id, err) => {
          console.warn('Howler preview play issue, falling back to native Audio:', err);
          this.playNativePreviewFallback(track, onEnd);
        },
      });

      this.previewHowl.play();
      this.notify();
    } catch (e) {
      console.warn('Direct Howl instantiation failed, falling back to native Audio:', e);
      this.playNativePreviewFallback(track, onEnd);
    }
  }

  private playNativePreviewFallback(track: Track, onEnd?: () => void) {
    if (this.previewHowl) {
      this.previewHowl.unload();
      this.previewHowl = null;
    }

    try {
      this.nativePreviewAudio = new Audio(track.audioUrl);
      this.nativePreviewAudio.volume = this.isMuted ? 0 : this.volume;
      this.nativePreviewAudio.onended = () => {
        this.previewTrack = null;
        if (onEnd) onEnd();
        this.notify();
      };
      this.nativePreviewAudio.onerror = (e) => {
        console.error('Native preview audio error:', e);
        this.previewTrack = null;
        this.notify();
      };
      this.nativePreviewAudio.play().catch((err) => {
        console.warn('Native preview play prevented by browser policy:', err);
      });
      this.notify();
    } catch (e) {
      console.error('Failed to create native Audio fallback:', e);
      this.previewTrack = null;
      this.notify();
    }
  }

  public stopPreview() {
    if (this.previewHowl) {
      this.previewHowl.stop();
      this.previewHowl.unload();
      this.previewHowl = null;
    }
    if (this.nativePreviewAudio) {
      this.nativePreviewAudio.pause();
      this.nativePreviewAudio.src = '';
      this.nativePreviewAudio = null;
    }
    this.previewTrack = null;
    this.notify();
  }

  public isPreviewPlaying(trackId?: string): boolean {
    if (!this.previewTrack) return false;
    if (trackId && this.previewTrack.id !== trackId) return false;

    if (this.previewHowl) {
      return this.previewHowl.playing();
    }
    if (this.nativePreviewAudio) {
      return !this.nativePreviewAudio.paused;
    }
    return false;
  }

  public getActivePreviewTrack(): Track | null {
    return this.previewTrack;
  }

  // ─────────────────────────────────────────
  // SOUNDTRACK PLAYER (Movie Slideshow)
  // ─────────────────────────────────────────
  public playSoundtrack(track: Track, fadeInMs: number = 1200) {
    this.stopPreview();

    // If already playing this track, resume if paused
    if (this.currentTrack?.id === track.id) {
      if (this.soundtrackHowl) {
        if (!this.soundtrackHowl.playing()) {
          this.soundtrackHowl.play();
          if (fadeInMs > 0 && !this.isMuted) {
            this.soundtrackHowl.fade(0, this.volume, fadeInMs);
          }
        }
        this.notify();
        return;
      } else if (this.nativeSoundtrackAudio) {
        if (this.nativeSoundtrackAudio.paused) {
          this.nativeSoundtrackAudio.play().catch(console.warn);
        }
        this.notify();
        return;
      }
    }

    // Stop existing soundtrack with smooth fade
    if (this.soundtrackHowl) {
      const oldHowl = this.soundtrackHowl;
      oldHowl.fade(oldHowl.volume(), 0, 350);
      setTimeout(() => {
        oldHowl.stop();
        oldHowl.unload();
      }, 400);
      this.soundtrackHowl = null;
    }
    if (this.nativeSoundtrackAudio) {
      this.nativeSoundtrackAudio.pause();
      this.nativeSoundtrackAudio.src = '';
      this.nativeSoundtrackAudio = null;
    }

    this.currentTrack = track;

    try {
      this.soundtrackHowl = new Howl({
        src: [track.audioUrl],
        html5: true,
        format: ['m4a', 'aac', 'mp3'],
        loop: true,
        volume: 0,
        onplay: () => {
          if (!this.isMuted && fadeInMs > 0 && this.soundtrackHowl) {
            this.soundtrackHowl.fade(0, this.volume, fadeInMs);
          } else if (!this.isMuted && this.soundtrackHowl) {
            this.soundtrackHowl.volume(this.volume);
          }
          this.notify();
        },
        onloaderror: (_id, err) => {
          console.warn('Howler soundtrack load issue, falling back to native Audio:', err);
          this.playNativeSoundtrackFallback(track);
        },
        onplayerror: (_id, err) => {
          console.warn('Howler soundtrack play issue, falling back to native Audio:', err);
          this.playNativeSoundtrackFallback(track);
        },
      });

      this.soundtrackHowl.play();
      this.notify();
    } catch (e) {
      console.warn('Direct soundtrack Howl creation failed, falling back to native Audio:', e);
      this.playNativeSoundtrackFallback(track);
    }
  }

  private playNativeSoundtrackFallback(track: Track) {
    if (this.soundtrackHowl) {
      this.soundtrackHowl.unload();
      this.soundtrackHowl = null;
    }

    try {
      this.nativeSoundtrackAudio = new Audio(track.audioUrl);
      this.nativeSoundtrackAudio.loop = true;
      this.nativeSoundtrackAudio.volume = this.isMuted ? 0 : this.volume;
      this.nativeSoundtrackAudio.play().catch((err) => {
        console.warn('Native soundtrack play blocked:', err);
      });
      this.notify();
    } catch (e) {
      console.error('Failed to create native soundtrack audio:', e);
    }
  }

  public pauseSoundtrack() {
    if (this.soundtrackHowl && this.soundtrackHowl.playing()) {
      this.soundtrackHowl.pause();
      this.notify();
    }
    if (this.nativeSoundtrackAudio && !this.nativeSoundtrackAudio.paused) {
      this.nativeSoundtrackAudio.pause();
      this.notify();
    }
  }

  public resumeSoundtrack() {
    if (this.soundtrackHowl && !this.soundtrackHowl.playing()) {
      this.soundtrackHowl.play();
      this.notify();
    }
    if (this.nativeSoundtrackAudio && this.nativeSoundtrackAudio.paused) {
      this.nativeSoundtrackAudio.play().catch(console.warn);
      this.notify();
    }
  }

  public stopSoundtrack(fadeOutMs: number = 800) {
    if (this.soundtrackHowl) {
      const h = this.soundtrackHowl;
      if (fadeOutMs > 0 && h.playing()) {
        h.fade(h.volume(), 0, fadeOutMs);
        setTimeout(() => {
          h.stop();
          h.unload();
        }, fadeOutMs + 50);
      } else {
        h.stop();
        h.unload();
      }
      this.soundtrackHowl = null;
    }
    if (this.nativeSoundtrackAudio) {
      this.nativeSoundtrackAudio.pause();
      this.nativeSoundtrackAudio.src = '';
      this.nativeSoundtrackAudio = null;
    }
    this.currentTrack = null;
    this.notify();
  }

  public isSoundtrackPlaying(): boolean {
    if (this.soundtrackHowl) {
      return this.soundtrackHowl.playing();
    }
    if (this.nativeSoundtrackAudio) {
      return !this.nativeSoundtrackAudio.paused;
    }
    return false;
  }

  public getCurrentSoundtrack(): Track | null {
    return this.currentTrack;
  }

  // ─────────────────────────────────────────
  // VOLUME & GLOBAL CONTROLS
  // ─────────────────────────────────────────
  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted) {
      if (this.soundtrackHowl) this.soundtrackHowl.volume(this.volume);
      if (this.previewHowl) this.previewHowl.volume(this.volume);
      if (this.nativeSoundtrackAudio) this.nativeSoundtrackAudio.volume = this.volume;
      if (this.nativePreviewAudio) this.nativePreviewAudio.volume = this.volume;
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    const targetVol = this.isMuted ? 0 : this.volume;
    if (this.soundtrackHowl) this.soundtrackHowl.volume(targetVol);
    if (this.previewHowl) this.previewHowl.volume(targetVol);
    if (this.nativeSoundtrackAudio) this.nativeSoundtrackAudio.volume = targetVol;
    if (this.nativePreviewAudio) this.nativePreviewAudio.volume = targetVol;
    this.notify();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const audioManager = new AudioManager();
