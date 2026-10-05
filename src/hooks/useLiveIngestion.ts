import { useState, useEffect, useRef, useCallback } from 'react';
import { useTetherPhotoUpload } from '@/hooks/useAtelierQueries';
import { useToast } from '@/components/ui/Toast';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { useUploadGuard } from '@/hooks/useUploadGuard';

export type IngestionMode = 'none' | 'camera' | 'folder';

export interface UseLiveIngestionOptions {
  eventId: string;
  eventSlug?: string;
  onPhotoUploaded?: () => void;
}

export const useLiveIngestion = ({
  eventId,
  eventSlug = '',
  onPhotoUploaded,
}: UseLiveIngestionOptions) => {
  const { showToast } = useToast();
  const planQuota = usePlanQuota();
  const { mutateAsync: uploadPhoto, isPending: isUploadingSingle } = useTetherPhotoUpload(eventId);

  // Active Mode: 'none' | 'camera' | 'folder'
  const [activeMode, setActiveMode] = useState<IngestionMode>('none');

  // -------------------------------------------------------------
  // 1. Direct Camera Streaming & Shutter State
  // -------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  // Auto-capture interval (in seconds: 0 = manual only, 3, 5, 10, 30)
  const [autoCaptureInterval, setAutoCaptureInterval] = useState<number>(0);
  const autoCaptureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synthetic shutter sound via Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // AudioContext gestures restricted
    }
  }, []);

  // Enumerate video devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          const preferred =
            videoInputs.find((d) =>
              /cam|link|sony|canon|nikon|elgato|usb|back/i.test(d.label)
            ) || videoInputs[0];
          setSelectedDeviceId(preferred.deviceId);
        }
      } catch (err) {
        console.warn('Device enumeration error:', err);
      }
    };
    fetchDevices();
  }, [selectedDeviceId]);

  // Start video stream
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
            facingMode: deviceId ? undefined : { ideal: 'environment' },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraActive(true);
        setActiveMode('camera');
        showToast(
          'Camera Shutter Live',
          'Camera streaming active. Press spacebar or shutter button to shoot.',
          'success'
        );
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          err?.message || 'Unable to access camera device. Check browser permissions.'
        );
        setIsCameraActive(false);
      }
    },
    [showToast]
  );

  // Stop video stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (activeMode === 'camera') {
      setActiveMode('none');
      showToast('Camera Disconnected', 'Live camera stream stopped.', 'info');
    }
  }, [activeMode, showToast]);

  // Capture single photo from live video stream and upload
  const takeSnapshot = useCallback(async () => {
    if (!videoRef.current || !isCameraActive) return;

    setIsShutterFlashing(true);
    playShutterSound();
    setTimeout(() => setIsShutterFlashing(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        // Check plan storage quota before upload
        const validation = planQuota.validateStorageQuota([{ size: blob.size }]);
        if (!validation.valid) {
          showToast(
            validation.errorTitle || 'Storage Limit Reached',
            validation.errorMessage || 'Cannot upload snapshot because studio cloud storage is full.',
            'error'
          );
          return;
        }

        const filename = `Tether_${eventSlug || 'event'}_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });

        try {
          await uploadPhoto(file);
          setCapturedCount((prev) => prev + 1);
          onPhotoUploaded?.();
          showToast(
            'Photo Synced Live',
            `Shot #${capturedCount + 1} captured and added to the live stream.`,
            'success'
          );
        } catch (err: any) {
          showToast('Upload Error', err?.message || 'Failed to sync camera shot.', 'error');
        }
      },
      'image/jpeg',
      0.95
    );
  }, [isCameraActive, playShutterSound, eventSlug, uploadPhoto, capturedCount, onPhotoUploaded, showToast, planQuota]);

  // Handle auto-capture interval
  useEffect(() => {
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }

    if (isCameraActive && autoCaptureInterval > 0) {
      autoCaptureTimerRef.current = setInterval(() => {
        takeSnapshot();
      }, autoCaptureInterval * 1000);
    }

    return () => {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, [isCameraActive, autoCaptureInterval, takeSnapshot]);

  // -------------------------------------------------------------
  // 2. Tethered Hot-Folder Watcher State (File System Access API)
  // -------------------------------------------------------------
  const [isFolderWatching, setIsFolderWatching] = useState(false);
  const [watchedFolderName, setWatchedFolderName] = useState<string>('');
  const [folderSyncedCount, setFolderSyncedCount] = useState(0);
  const knownFileNamesRef = useRef<Set<string>>(new Set());
  const directoryHandleRef = useRef<any>(null);
  const folderWatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard active hot-folder auto-sync against accidental page reload
  useUploadGuard({
    id: `tether-folder-${eventId}`,
    source: 'folder',
    title: `Hot-Folder Auto-Sync (${watchedFolderName || 'Camera Folder'})`,
    details: `${folderSyncedCount} photos synced to live stream`,
    count: folderSyncedCount,
    isActive: isFolderWatching,
  });

  // Guard live camera streaming session against accidental page reload
  useUploadGuard({
    id: `tether-camera-${eventId}`,
    source: 'camera',
    title: 'Live Camera Streaming & Tethering',
    details: `${capturedCount} photos captured in session`,
    count: capturedCount,
    isActive: isCameraActive,
  });

  // Guard active single photo ingestion
  useUploadGuard({
    id: `tether-single-${eventId}`,
    source: 'camera',
    title: 'Camera Snapshot Ingestion',
    details: 'Uploading raw photo to live stream...',
    isActive: isUploadingSingle,
  });

  const stopFolderWatch = useCallback(() => {
    if (folderWatchIntervalRef.current) {
      clearInterval(folderWatchIntervalRef.current);
      folderWatchIntervalRef.current = null;
    }
    setIsFolderWatching(false);
    directoryHandleRef.current = null;
    if (activeMode === 'folder') {
      setActiveMode('none');
    }
    showToast('Folder Disconnected', 'Hot-folder auto-sync stopped.', 'info');
  }, [activeMode, showToast]);

  const startFolderWatch = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      showToast(
        'Browser Not Supported',
        'Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge.',
        'error'
      );
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });
      directoryHandleRef.current = dirHandle;
      setWatchedFolderName(dirHandle.name);
      setIsFolderWatching(true);
      setActiveMode('folder');

      // Populate initial known files so we only upload incoming new shots
      const initialFiles = new Set<string>();
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          initialFiles.add(entry.name);
        }
      }
      knownFileNamesRef.current = initialFiles;

      showToast(
        'Hot-Folder Connected',
        `Watching "${dirHandle.name}". New camera shots will auto-sync instantly.`,
        'success'
      );

      // Check directory every 2.5 seconds
      folderWatchIntervalRef.current = setInterval(async () => {
        try {
          if (!directoryHandleRef.current) return;
          for await (const entry of directoryHandleRef.current.values()) {
            if (entry.kind === 'file') {
              const filename = entry.name;
              const isImage = /\.(jpe?g|png|webp|avif|cr2|cr3|arw|nef|dng)$/i.test(filename);
              if (isImage && !knownFileNamesRef.current.has(filename)) {
                const file = await entry.getFile();

                // Validate storage quota before uploading tethered file
                const validation = planQuota.validateStorageQuota([{ size: file.size }]);
                if (!validation.valid) {
                  showToast(
                    validation.errorTitle || 'Storage Limit Reached',
                    `Cannot sync "${filename}": ${validation.errorMessage || 'Plan storage quota reached.'}`,
                    'error'
                  );
                  stopFolderWatch();
                  return;
                }

                knownFileNamesRef.current.add(filename);
                await uploadPhoto(file);
                setFolderSyncedCount((prev) => prev + 1);
                onPhotoUploaded?.();
                showToast(
                  'Auto-Synced from Folder',
                  `Imported "${filename}" straight from your tether folder.`,
                  'success'
                );
              }
            }
          }
        } catch (pollErr) {
          console.warn('Folder watch polling error:', pollErr);
        }
      }, 2500);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast('Folder Access Denied', err.message || 'Could not watch directory.', 'error');
      }
    }
  }, [showToast, uploadPhoto, onPhotoUploaded, planQuota, stopFolderWatch]);

  // Global cancel/stop for whichever mode is active
  const stopActiveSession = useCallback(() => {
    if (activeMode === 'camera') {
      stopCamera();
    } else if (activeMode === 'folder') {
      stopFolderWatch();
    }
    setActiveMode('none');
  }, [activeMode, stopCamera, stopFolderWatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (folderWatchIntervalRef.current) {
        clearInterval(folderWatchIntervalRef.current);
      }
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, []);

  return {
    activeMode,
    setActiveMode,
    stopActiveSession,
    // Camera state & actions
    videoRef,
    streamRef,
    cameraDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    isCameraActive,
    cameraError,
    autoCaptureInterval,
    setAutoCaptureInterval,
    capturedCount,
    isShutterFlashing,
    isUploadingSingle,
    startCamera,
    stopCamera,
    takeSnapshot,
    // Folder watcher state & actions
    isFolderWatching,
    watchedFolderName,
    folderSyncedCount,
    startFolderWatch,
    stopFolderWatch,
  };
};
