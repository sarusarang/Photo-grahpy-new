import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MediaItem } from '../../types';
import { searchPhotosByFace, type FaceMatchResult } from '../../services/faceRecognitionService';

interface AIFaceSearchBoxProps {
  mediaItems: MediaItem[];
  onMatchesFound: (matchedIds: string[] | null) => void;
  onClose?: () => void;
  theme?: 'editorial' | 'cinematic' | 'minimal' | 'masonry';
}

export const AIFaceSearchBox: React.FC<AIFaceSearchBoxProps> = ({
  mediaItems,
  onMatchesFound,
  onClose,
  theme = 'editorial',
}) => {
  const [mode, setMode] = useState<'prompt' | 'camera' | 'scanning' | 'results'>('prompt');
  const [matchResult, setMatchResult] = useState<FaceMatchResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle local image file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setMode('scanning');
      const result = await searchPhotosByFace(file, mediaItems);
      setMatchResult(result);
      setMode('results');
      onMatchesFound(result.matchedMediaIds);
    } catch (err) {
      console.error('Face recognition error:', err);
      setMode('prompt');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Start live webcam for selfie
  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser.'
          : 'Could not access camera. Try uploading a photo instead.'
      );
    }
  };

  // Switch front/back camera
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera flip error:', err);
    }
  };

  // Capture frame from video canvas
  const captureSelfie = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if user-facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    setMode('scanning');

    try {
      const result = await searchPhotosByFace(dataUrl, mediaItems);
      setMatchResult(result);
      setMode('results');
      onMatchesFound(result.matchedMediaIds);
    } catch (err) {
      console.error('Face match error:', err);
      setMode('prompt');
    }
  };

  // Reset search
  const handleClear = () => {
    stopCamera();
    setMatchResult(null);
    setMode('prompt');
    onMatchesFound(null);
  };

  return (
    <div className="w-full my-6 transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Hidden file input for uploading face photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ─── 1. INITIAL PROMPT STATE (Matching Reference Screenshot) ─── */}
      {mode === 'prompt' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 sm:p-12 text-center bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm">
          {/* Avatar Icon with Camera Badge matching Screenshot */}
          <div className="relative inline-block mx-auto mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-neutral-400 dark:text-neutral-500 fill-current"
              >
                {/* Stylized Avatar Head & Shoulders */}
                <circle cx="50" cy="38" r="18" />
                <path d="M 22 88 C 22 66, 34 58, 50 58 C 66 58, 78 66, 78 88 Z" />
              </svg>
            </div>
            {/* Small Camera Overlay Badge at Bottom-Right */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-700 dark:bg-neutral-600 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-md">
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </div>
          </div>

          {/* Heading */}
          <h3 className="font-serif italic text-lg sm:text-2xl text-neutral-800 dark:text-neutral-200 font-normal tracking-wide mb-6">
            Add a selfie to find all your images
          </h3>

          {/* Two Action Buttons: Upload Face & Take Selfie */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-7 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 font-medium text-xs sm:text-sm tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-neutral-500" />
              Upload Face
            </button>

            <button
              type="button"
              onClick={startCamera}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#1E252B] hover:bg-neutral-950 text-white font-medium text-xs sm:text-sm tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-neutral-300" />
              Take Selfie
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. LIVE CAMERA STREAM (Take Selfie) ─── */}
      {mode === 'camera' && (
        <div className="max-w-md mx-auto rounded-3xl border border-neutral-300 dark:border-neutral-800 p-6 bg-neutral-950 text-white shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono tracking-widest uppercase text-neutral-300">
                Selfie Face Scanner
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode('prompt');
              }}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {cameraError ? (
            <div className="py-12 px-4 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-xs text-neutral-300">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200"
              >
                Upload Photo Instead
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Preview with Oval Face Guide */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                {/* Oval Face Alignment Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                </div>
                <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                  <span className="text-[11px] font-mono bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-neutral-200">
                    Position your face in the oval
                  </span>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Flip camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={captureSelfie}
                  className="px-8 py-3 rounded-full bg-white text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-lg flex items-center gap-2 cursor-pointer scale-100 hover:scale-105"
                >
                  <Camera className="w-4 h-4 text-neutral-950" />
                  Snap Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Upload image instead"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 3. SCANNING ANIMATION STATE ─── */}
      {mode === 'scanning' && (
        <div className="max-w-md mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 text-center bg-white dark:bg-neutral-900 shadow-xl space-y-5">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <Sparkles className="w-8 h-8 text-amber-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif italic text-lg text-neutral-900 dark:text-neutral-100">
              Analyzing Facial Features...
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              Matching your selfie across {mediaItems.length} gallery photographs
            </p>
          </div>
        </div>
      )}

      {/* ─── 4. RECOGNIZED RESULT STATE ─── */}
      {mode === 'results' && matchResult && (
        <div className="max-w-xl mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* User Selfie Thumbnail with Checkmark */}
            <div className="relative shrink-0">
              <img
                src={matchResult.faceThumbnailUrl}
                alt="Your Selfie"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Face Recognized
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {Math.round(matchResult.confidence * 100)}% match
                </span>
              </div>
              <p className="font-serif italic text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mt-0.5">
                Found {matchResult.matchedCount} photographs of you
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setMode('prompt')}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Change Selfie
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
