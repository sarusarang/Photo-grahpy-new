/**
 * EX SHARE ATELIER — High-Performance Browser-Side Video Story & Reel Renderer
 *
 * Core Capabilities:
 * 1. HTML5 Canvas Frame Rendering with Real-Time Matrix Transformations (Ken Burns, Pan, Dissolve).
 * 2. Multi-Aspect Ratio Export: 9:16 (Story / Reel / WhatsApp Status), 1:1 (Square), 16:9 (Landscape).
 * 3. Audio Mixing: Integrates soundtrack stream via Web Audio API (AudioContext) into the media stream.
 * 4. In-Browser MediaRecorder Encoding: Generates high-definition video files (.mp4 / .webm) directly
 *    without costly server GPU queues.
 * 5. Native Social Sharing: Direct 1-tap distribution to Instagram Stories, WhatsApp Status, and TikTok
 *    via the native Web Share API (navigator.share).
 */

export type StoryAspectRatio = '9:16' | '1:1' | '16:9';

export type StoryTransitionStyle = 'ken-burns' | 'crossfade' | 'burst' | 'fade-black';

export interface RenderStoryOptions {
  photos: Array<{ url: string; title?: string }>;
  audioUrl?: string;
  aspectRatio: StoryAspectRatio;
  durationPerPhoto: number; // in seconds (e.g. 2.5, 3.0, 4.0)
  transitionStyle: StoryTransitionStyle;
  title?: string;
  subtitle?: string;
  watermarkText?: string;
  watermarkEnabled?: boolean;
  onProgress?: (percent: number, currentSlide: number, totalSlides: number) => void;
}

export interface RenderStoryResult {
  blob: Blob;
  videoUrl: string;
  filename: string;
  mimeType: string;
  durationSeconds: number;
}

/**
 * Returns canvas dimensions for a given aspect ratio
 */
export function getCanvasDimensions(aspectRatio: StoryAspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16':
      return { width: 720, height: 1280 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '16:9':
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Preloads image objects from image URLs with crossOrigin='anonymous'
 */
export async function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  const promises = urls.map(
    (url) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Fallback image if crossOrigin fails or remote URL is unreachable
          console.warn(`[VideoStory] Failed to load image: ${url}, using canvas fallback.`);
          const fallback = new Image();
          fallback.crossOrigin = 'anonymous';
          fallback.onload = () => resolve(fallback);
          fallback.onerror = () => resolve(img);
          fallback.src = url;
        };
        img.src = url;
      })
  );
  return Promise.all(promises);
}

/**
 * Determines the best supported MIME type for MediaRecorder
 */
function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'video/webm';

  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Main Video Story Generator
 * Renders all photos onto an offscreen canvas with smooth camera motion and crossfades,
 * mixes soundtrack audio, and records into a high-quality video blob.
 */
export async function renderStoryVideo(options: RenderStoryOptions): Promise<RenderStoryResult> {
  const {
    photos,
    audioUrl,
    aspectRatio,
    durationPerPhoto = 3.0,
    transitionStyle = 'ken-burns',
    title,
    subtitle,
    watermarkText,
    watermarkEnabled = false,
    onProgress,
  } = options;

  if (!photos || photos.length === 0) {
    throw new Error('Please select at least 1 photograph to create a story video.');
  }

  const { width, height } = getCanvasDimensions(aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Could not initialize canvas context.');
  }

  // Preload all images
  onProgress?.(5, 0, photos.length);
  const loadedImages = await preloadImages(photos.map((p) => p.url));

  const totalPhotos = loadedImages.length;
  const totalDuration = totalPhotos * durationPerPhoto;
  const fps = 30;
  const totalFrames = Math.round(totalDuration * fps);
  const framesPerPhoto = Math.round(durationPerPhoto * fps);
  const transitionFrames = Math.round(0.7 * fps); // 0.7 second transition

  // Setup Web Audio mixing if audioUrl is provided
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  let audioElement: HTMLAudioElement | null = null;

  if (audioUrl) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        audioDestination = audioContext.createMediaStreamDestination();
        audioElement = new Audio();
        audioElement.crossOrigin = 'anonymous';
        audioElement.src = audioUrl;
        audioElement.loop = true;

        const sourceNode = audioContext.createMediaElementSource(audioElement);
        sourceNode.connect(audioDestination);
      }
    } catch (err) {
      console.warn('[VideoStory] Web Audio setup notice:', err);
    }
  }

  // Combine Canvas Video Stream with Audio Destination Stream
  const canvasStream = canvas.captureStream(fps);
  const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

  if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
    combinedTracks.push(...audioDestination.stream.getAudioTracks());
  }

  const combinedStream = new MediaStream(combinedTracks);
  const mimeType = getSupportedMimeType();
  const chunks: Blob[] = [];

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6000000, // 6 Mbps for crisp, social-media-ready 1080p/720p
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Helper: Draws an image with cover scaling and optional Ken Burns zoom/pan
  const drawImageCover = (
    img: HTMLImageElement,
    zoomFactor: number,
    panX: number,
    panY: number,
    alpha: number = 1.0
  ) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;

    let renderW = width;
    let renderH = height;

    if (imgRatio > canvasRatio) {
      renderH = height;
      renderW = height * imgRatio;
    } else {
      renderW = width;
      renderH = width / imgRatio;
    }

    renderW *= zoomFactor;
    renderH *= zoomFactor;

    const offsetX = (width - renderW) / 2 + panX;
    const offsetY = (height - renderH) / 2 + panY;

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  };

  // Helper: Overlays elegant typography & watermark
  const drawOverlays = (frameProgress: number, currentSlide: number) => {
    // Elegant Vignette / Shadow Gradient at bottom
    const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    // Title & Subtitle
    if (title || subtitle) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;

      if (title) {
        ctx.font = `bold ${Math.round(width * 0.048)}px "Playfair Display", Georgia, serif`;
        ctx.fillText(title, width / 2, height - (subtitle ? 80 : 50));
      }
      if (subtitle) {
        ctx.font = `500 ${Math.round(width * 0.028)}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(subtitle.toUpperCase(), width / 2, height - 42);
      }
      ctx.restore();
    }

    // Watermark
    if (watermarkEnabled && watermarkText) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = `600 ${Math.round(width * 0.024)}px monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(watermarkText, width - 24, height - 20);
      ctx.restore();
    }

    // Top Story Progress Bars (Instagram Stories style)
    const barHeight = 3;
    const gap = 4;
    const totalBars = totalPhotos;
    const totalAvailableWidth = width - 32 - gap * (totalBars - 1);
    const barWidth = totalAvailableWidth / totalBars;

    ctx.save();
    for (let i = 0; i < totalBars; i++) {
      const bx = 16 + i * (barWidth + gap);
      const by = 16;

      // Inactive track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(bx, by, barWidth, barHeight);

      // Active fill
      if (i < currentSlide) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, barWidth, barHeight);
      } else if (i === currentSlide) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, barWidth * frameProgress, barHeight);
      }
    }
    ctx.restore();
  };

  // Start recording
  recorder.start();

  if (audioElement && audioContext) {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    audioElement.play().catch(console.warn);
  }

  // Render loop frame-by-frame
  await new Promise<void>((resolve) => {
    let currentFrame = 0;

    const renderNextFrame = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        if (audioElement) {
          audioElement.pause();
        }
        resolve();
        return;
      }

      const currentSlide = Math.floor(currentFrame / framesPerPhoto);
      const slideLocalFrame = currentFrame % framesPerPhoto;
      const slideProgress = slideLocalFrame / framesPerPhoto;

      const nextSlide = (currentSlide + 1) % totalPhotos;
      const isTransitioning =
        slideLocalFrame >= framesPerPhoto - transitionFrames && currentSlide < totalPhotos - 1;

      const imgA = loadedImages[currentSlide];
      const imgB = loadedImages[nextSlide];

      // Calculate Ken Burns Zoom & Pan
      let zoomA = 1.0;
      let panXA = 0;
      let panYA = 0;

      if (transitionStyle === 'ken-burns') {
        zoomA = 1.0 + slideProgress * 0.12; // slow drift 1.0 -> 1.12
        panXA = (currentSlide % 2 === 0 ? 1 : -1) * (slideProgress * 15);
      } else if (transitionStyle === 'burst') {
        zoomA = 1.0 + Math.pow(slideProgress, 2) * 0.15;
      }

      // Clear Canvas Background
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, width, height);

      // Draw Main Slide A
      drawImageCover(imgA, zoomA, panXA, panYA, 1.0);

      // Transition to Slide B
      if (isTransitioning && imgB) {
        const tProgress = (slideLocalFrame - (framesPerPhoto - transitionFrames)) / transitionFrames;

        if (transitionStyle === 'crossfade' || transitionStyle === 'ken-burns') {
          const zoomB = 1.0 + tProgress * 0.05;
          drawImageCover(imgB, zoomB, 0, 0, tProgress);
        } else if (transitionStyle === 'fade-black') {
          // Dip to black then fade in
          if (tProgress < 0.5) {
            ctx.fillStyle = `rgba(0,0,0,${tProgress * 2})`;
            ctx.fillRect(0, 0, width, height);
          } else {
            drawImageCover(imgB, 1.0, 0, 0, 1.0);
            ctx.fillStyle = `rgba(0,0,0,${(1 - tProgress) * 2})`;
            ctx.fillRect(0, 0, width, height);
          }
        } else if (transitionStyle === 'burst') {
          drawImageCover(imgB, 1.0, 0, 0, tProgress);
        }
      }

      // Draw Overlays (Title, Watermark, Progress bar)
      drawOverlays(slideProgress, currentSlide);

      // Progress reporting
      const overallPercent = Math.min(99, Math.round((currentFrame / totalFrames) * 95) + 5);
      onProgress?.(overallPercent, currentSlide + 1, totalPhotos);

      currentFrame++;
      // Schedule next frame with requestAnimationFrame for smooth execution
      requestAnimationFrame(renderNextFrame);
    };

    renderNextFrame();
  });

  // Await recorder stop and blob generation
  const blob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const fullBlob = new Blob(chunks, { type: mimeType });
      resolve(fullBlob);
    };
  });

  onProgress?.(100, totalPhotos, totalPhotos);

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const cleanTitle = (title || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${cleanTitle}-reel-${aspectRatio.replace(':', 'x')}.${ext}`;
  const videoUrl = URL.createObjectURL(blob);

  return {
    blob,
    videoUrl,
    filename,
    mimeType,
    durationSeconds: totalDuration,
  };
}

/**
 * Downloads a rendered video blob to the user's computer or mobile device.
 */
export function downloadRenderedVideo(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Native Web Share API helper for sharing directly to Instagram Stories, WhatsApp Status, etc.
 */
export async function shareStoryVideo(
  blob: Blob,
  filename: string,
  title: string = 'Our Photo Story',
  text: string = 'Created with EX SHARE Atelier'
): Promise<boolean> {
  const ext = filename.endsWith('.mp4') ? 'mp4' : 'webm';
  const file = new File([blob], filename, {
    type: ext === 'mp4' ? 'video/mp4' : 'video/webm',
  });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[VideoStory] Native share notice:', err);
      }
      return false;
    }
  }

  // Fallback: download the file directly so user can post to Instagram/WhatsApp
  downloadRenderedVideo(blob, filename);
  return true;
}
