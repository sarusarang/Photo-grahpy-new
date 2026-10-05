import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  FolderSync,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sliders,
  Play,
  Pause,
  Clock,
  HardDrive,
  Lock,
  XCircle,
} from 'lucide-react';
import type { LiveEvent } from '@/types/event';
import { EventBatchUploadPanel } from './EventUploadMediaModal';
import type { useLiveIngestion } from '@/hooks/useLiveIngestion';

interface LiveCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
  onPhotoUploaded?: () => void;
  ingestion: ReturnType<typeof useLiveIngestion>;
  defaultTab?: 'camera' | 'folder' | 'manual';
}

export const LiveCameraCaptureModal: React.FC<LiveCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  event,
  onPhotoUploaded,
  ingestion,
  defaultTab = 'camera',
}) => {
  // Active Tab: 'camera' | 'folder' | 'manual'
  const [activeTab, setActiveTab] = useState<'camera' | 'folder' | 'manual'>(() => {
    if (ingestion.activeMode === 'folder') return 'folder';
    if (ingestion.activeMode === 'camera') return 'camera';
    return defaultTab;
  });

  // Keep active tab aligned if an ingestion mode is active
  useEffect(() => {
    if (ingestion.activeMode === 'folder') {
      setActiveTab('folder');
    } else if (ingestion.activeMode === 'camera') {
      setActiveTab('camera');
    }
  }, [ingestion.activeMode]);

  // Synchronize video stream attachment when modal opens and camera is active
  useEffect(() => {
    if (isOpen && ingestion.isCameraActive && ingestion.videoRef.current && ingestion.streamRef.current) {
      ingestion.videoRef.current.srcObject = ingestion.streamRef.current;
      ingestion.videoRef.current.play().catch((err) => console.warn('Video play resume:', err));
    }
  }, [isOpen, ingestion.isCameraActive, ingestion.videoRef, ingestion.streamRef]);

  // Spacebar capture trigger when camera tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || !ingestion.isCameraActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          ingestion.takeSnapshot();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, ingestion.isCameraActive, ingestion.takeSnapshot]);

  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCameraModeActive = ingestion.activeMode === 'camera';
  const isFolderModeActive = ingestion.activeMode === 'folder';
  const isAnyLiveStreamActive = ingestion.activeMode !== 'none';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 dark:bg-black/90 backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !ingestion.isUploadingSingle) {
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white dark:bg-[#0f1016] border border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-900 dark:text-white shadow-2xl my-auto modal-animate flex flex-col overflow-hidden max-h-[min(94vh,880px)]"
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-[#0f1016]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                  Photographer Ingestion Station
                </span>
                {isCameraModeActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Camera Shutter Active
                  </span>
                )}
                {isFolderModeActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Tethered Hot Folder Active
                  </span>
                )}
                {!isAnyLiveStreamActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                    Standby / Ready
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white truncate max-w-md">
                {event.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Mode Switcher Bar ─── */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/40 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-200/60 dark:bg-neutral-900 border border-neutral-300/40 dark:border-neutral-800 text-xs font-mono">
            {/* Tab 1: Camera Shutter */}
            <button
              type="button"
              disabled={isFolderModeActive}
              onClick={() => setActiveTab('camera')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'camera'
                  ? isCameraModeActive
                    ? 'bg-amber-400 text-neutral-950 shadow-sm ring-2 ring-amber-500/50'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                  : isFolderModeActive
                  ? 'opacity-40 cursor-not-allowed text-neutral-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white cursor-pointer'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. Direct Camera Shutter</span>
              {isCameraModeActive && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse ml-0.5" />
              )}
              {isFolderModeActive && <Lock className="w-3 h-3 text-neutral-400 ml-0.5" />}
            </button>

            {/* Tab 2: Hot-Folder Watcher */}
            <button
              type="button"
              disabled={isCameraModeActive}
              onClick={() => setActiveTab('folder')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'folder'
                  ? isFolderModeActive
                    ? 'bg-emerald-400 text-neutral-950 shadow-sm ring-2 ring-emerald-500/50'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                  : isCameraModeActive
                  ? 'opacity-40 cursor-not-allowed text-neutral-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white cursor-pointer'
              }`}
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>2. Tethered Hot-Folder Watcher</span>
              {isFolderModeActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse ml-0.5" />
              )}
              {isCameraModeActive && <Lock className="w-3 h-3 text-neutral-400 ml-0.5" />}
            </button>

            {/* Tab 3: Batch Upload */}
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'manual'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                  : isAnyLiveStreamActive
                  ? 'text-neutral-500 opacity-60 cursor-pointer'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white cursor-pointer'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>3. Batch Manual Upload</span>
              {isAnyLiveStreamActive && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            Total Ingested:{' '}
            <span className="font-bold text-amber-500">
              {event.media.length + ingestion.capturedCount + ingestion.folderSyncedCount}
            </span>
          </div>
        </div>

        {/* ─── Body Content ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: DIRECT CAMERA SHUTTER */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {/* Active / Status Ribbon */}
              {isCameraModeActive ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <span>Active Mode: Camera Shutter Live Stream</span>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400">
                        {ingestion.capturedCount} photos captured this session. Other ingestion modes & manual uploads are locked.
                      </p>
                    </div>
                  </div>

                  {/* ONLY CANCEL OPTION AVAILABLE */}
                  <button
                    type="button"
                    onClick={ingestion.stopCamera}
                    className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel / Disconnect Camera</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Camera shutter is currently offline. Connect camera to start live ingestion.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => ingestion.startCamera(ingestion.selectedDeviceId)}
                    className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Connect & Start Camera</span>
                  </button>
                </div>
              )}

              {/* Camera device selector & interval controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Camera Device:</span>
                  <select
                    value={ingestion.selectedDeviceId}
                    onChange={(e) => {
                      ingestion.setSelectedDeviceId(e.target.value);
                      if (ingestion.isCameraActive) {
                        ingestion.startCamera(e.target.value);
                      }
                    }}
                    className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white px-2.5 py-1.5 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-500"
                  >
                    {ingestion.cameraDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Connected Camera ${i + 1}`}
                      </option>
                    ))}
                    {ingestion.cameraDevices.length === 0 && <option value="">Default Live Camera</option>}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Auto-Shutter Timer:</span>
                  <select
                    value={ingestion.autoCaptureInterval}
                    onChange={(e) => ingestion.setAutoCaptureInterval(Number(e.target.value))}
                    className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white px-2.5 py-1.5 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value={0}>Manual Shutter Only</option>
                    <option value={3}>Every 3 Seconds</option>
                    <option value={5}>Every 5 Seconds</option>
                    <option value={10}>Every 10 Seconds</option>
                    <option value={30}>Every 30 Seconds</option>
                  </select>
                </div>
              </div>

              {/* Viewfinder Screen */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center group">
                <video
                  ref={ingestion.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Shutter Flash Animation */}
                {ingestion.isShutterFlashing && (
                  <div className="absolute inset-0 bg-white z-30 animate-in fade-in duration-75" />
                )}

                {/* Camera Viewfinder Rule-of-Thirds Grid */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div />
                </div>

                {/* Status Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                  {ingestion.isCameraActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      CAM READY
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-neutral-400 font-mono text-[10px] font-bold flex items-center gap-1.5">
                      STANDBY
                    </span>
                  )}
                  {ingestion.autoCaptureInterval > 0 && ingestion.isCameraActive && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-neutral-950 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      AUTO {ingestion.autoCaptureInterval}S
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 font-mono text-[10px] font-bold">
                    Captured: {ingestion.capturedCount}
                  </span>
                </div>

                {/* Shutter Button Overlay at Bottom Center */}
                {ingestion.isCameraActive && (
                  <div className="absolute bottom-5 inset-x-0 flex flex-col items-center justify-center gap-2 z-20">
                    <button
                      type="button"
                      onClick={ingestion.takeSnapshot}
                      disabled={ingestion.isUploadingSingle || !ingestion.isCameraActive}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md p-1.5 flex items-center justify-center border-2 border-white hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xl"
                      title="Press Spacebar or Click to Capture & Auto-Upload"
                    >
                      <div className="w-full h-full rounded-full bg-white group-hover:bg-amber-400 transition-colors flex items-center justify-center text-neutral-950">
                        {ingestion.isUploadingSingle ? (
                          <Loader2 className="w-6 h-6 animate-spin text-neutral-950" />
                        ) : (
                          <Camera className="w-6 h-6 stroke-[2.2]" />
                        )}
                      </div>
                    </button>
                    <span className="text-[11px] font-mono text-white/80 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      Press <kbd className="font-bold underline text-amber-300">Spacebar</kbd> or click to shoot
                    </span>
                  </div>
                )}

                {/* Error Banner */}
                {ingestion.cameraError && (
                  <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <p className="text-sm text-neutral-200 max-w-md font-mono">{ingestion.cameraError}</p>
                    <button
                      type="button"
                      onClick={() => ingestion.startCamera(ingestion.selectedDeviceId)}
                      className="py-2 px-4 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-amber-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera Connection</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TETHERED HOT-FOLDER WATCHER */}
          {activeTab === 'folder' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                      Capture One / Lightroom / Camera Hot-Folder Watcher
                    </h3>
                    <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      Connect the directory where your tethered camera drops photos on this machine.
                    </p>
                  </div>
                </div>

                {/* Active / Status Ribbon for Folder */}
                {isFolderModeActive ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          Active Mode: Tethered Hot-Folder Watching "{ingestion.watchedFolderName}"
                        </div>
                        <p className="text-[11px] font-mono text-neutral-400">
                          {ingestion.folderSyncedCount} photos ingested this session. Polling every 2.5s for incoming RAW/JPEG stills.
                        </p>
                      </div>
                    </div>

                    {/* ONLY CANCEL OPTION AVAILABLE */}
                    <button
                      type="button"
                      onClick={ingestion.stopFolderWatch}
                      className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Stop & Cancel Folder Watch</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-400 space-y-2">
                    <p className="font-bold text-neutral-900 dark:text-white">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Launch your camera's tethering tool (Capture One, Lightroom, Sony Imaging Edge, or EOS Utility).</li>
                      <li>Set the session capture destination to a local folder on your computer.</li>
                      <li>Click <strong>Connect Tether Folder</strong> below and pick that folder.</li>
                      <li>Every shot you fire on your camera automatically syncs directly to this event stream in seconds!</li>
                    </ol>

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={ingestion.startFolderWatch}
                        className="py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-400/20"
                      >
                        <FolderSync className="w-4 h-4" />
                        <span>Connect Tether Folder</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BATCH PHOTO & VIDEO UPLOAD */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {isAnyLiveStreamActive ? (
                /* LOCKOUT NOTICE WHEN LIVE STREAM IS ACTIVE */
                <div className="p-8 rounded-3xl bg-neutral-900 border border-amber-500/30 text-center max-w-xl mx-auto space-y-5 animate-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                    <Lock className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-serif font-bold text-white">
                      Manual Upload Locked During Live Ingestion
                    </h3>
                    <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                      An active ingestion stream (
                      <span className="text-amber-400 font-bold">
                        {isCameraModeActive ? 'Direct Camera Shutter' : 'Tethered Hot Folder'}
                      </span>
                      ) is currently active. To avoid stream conflicts and duplicate assets, manual multi-uploads are disabled while live sync is running.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={ingestion.stopActiveSession}
                      className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel Active Stream & Unlock Upload</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* UNLOCKED: BATCH UPLOAD PANEL */
                <EventBatchUploadPanel
                  event={event}
                  onUploadComplete={() => {
                    onPhotoUploaded?.();
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-50 dark:bg-[#0f1016] flex items-center justify-between">
          <div className="text-xs font-mono text-neutral-500">
            Event Stream:{' '}
            <span className="font-bold text-neutral-900 dark:text-white">{event.title}</span>
          </div>

          <div className="flex items-center gap-3">
            {isAnyLiveStreamActive && (
              <button
                type="button"
                onClick={ingestion.stopActiveSession}
                className="py-2 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Active Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-mono font-bold text-xs transition-all cursor-pointer"
            >
              Done & View Stream
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
