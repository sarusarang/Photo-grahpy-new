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
    <div className="w-full my-4 sm:my-6 transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Hidden file input for uploading face photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ─── 1. INITIAL PROMPT STATE: White BG + Nice Dotted Border ─── */}
      {mode === 'prompt' && (
        <div className="relative max-w-2xl mx-auto rounded-3xl border-2 border-dotted border-neutral-300 hover:border-neutral-400 p-8 sm:p-12 text-center bg-white shadow-xl shadow-neutral-900/5 transition-all">
          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              title="Close AI Search"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Center Avatar Icon with Camera Overlay Badge */}
          <div className="relative inline-block mx-auto mb-4 sm:mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shadow-inner">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-neutral-400 fill-current"
              >
                <circle cx="50" cy="38" r="18" />
                <path d="M 22 88 C 22 66, 34 58, 50 58 C 66 58, 78 66, 78 88 Z" />
              </svg>
            </div>
            {/* Small Camera Overlay Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center ring-2 ring-white shadow-md">
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </div>
          </div>

          {/* Heading & Explanatory Subtitle */}
          <h3 className="font-serif italic text-xl sm:text-2xl text-neutral-900 font-normal tracking-wide mb-2">
            Add a selfie to find all your images
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6 font-sans">
            Upload a photo or take a quick selfie to let our private AI instantly locate every photo you appear in.
          </p>

          {/* Action Buttons: Upload Face & Take Selfie */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-7 py-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Upload className="w-4 h-4 text-neutral-600" />
              Upload Face
            </button>

            <button
              type="button"
              onClick={startCamera}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Camera className="w-4 h-4 text-neutral-200" />
              Take Selfie
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. LIVE CAMERA STREAM (Take Selfie) ─── */}
      {mode === 'camera' && (
        <div className="max-w-md mx-auto rounded-3xl border-2 border-dotted border-neutral-300 p-6 bg-white text-neutral-900 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono tracking-widest uppercase text-neutral-700 font-semibold">
                Selfie Face Scanner
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode('prompt');
              }}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {cameraError ? (
            <div className="py-10 px-4 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-xs text-neutral-600">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
              >
                Upload Photo Instead
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Preview with Oval Face Guide */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                {/* Oval Face Alignment Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                </div>
                <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                  <span className="text-[11px] font-mono bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-neutral-200">
                    Position your face in the oval
                  </span>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-3 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer"
                  title="Flip camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={captureSelfie}
                  className="px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4 text-white" />
                  Snap Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer"
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
        <div className="max-w-md mx-auto rounded-3xl border-2 border-dotted border-neutral-300 p-8 text-center bg-white shadow-xl shadow-neutral-900/5 space-y-5">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <Sparkles className="w-8 h-8 text-amber-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif italic text-lg text-neutral-900 font-medium">
              Analyzing Facial Features...
            </h4>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Matching your selfie across {mediaItems.length} gallery photographs
            </p>
          </div>
        </div>
      )}

      {/* ─── 4. RECOGNIZED RESULT STATE ─── */}
      {mode === 'results' && matchResult && (
        <div className="max-w-xl mx-auto rounded-2xl border-2 border-dotted border-emerald-400 p-4 sm:p-5 bg-white shadow-xl shadow-neutral-900/5 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Face Recognized
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {Math.round(matchResult.confidence * 100)}% match
                </span>
              </div>
              <p className="font-serif italic text-sm sm:text-base text-neutral-900 mt-0.5 font-medium">
                Found {matchResult.matchedCount} photographs of you
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setMode('prompt')}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
            >
              Change Selfie
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
