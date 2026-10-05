import React from 'react';
import {
  Camera,
  FolderSync,
  Zap,
  XCircle,
  Sliders,
  Upload,
  Lock,
  AlertCircle,
} from 'lucide-react';
import type { useLiveIngestion } from '@/hooks/useLiveIngestion';

export interface EventIngestionHubProps {
  ingestion: ReturnType<typeof useLiveIngestion>;
  onOpenStation: (tab: 'camera' | 'folder' | 'manual') => void;
  onOpenUploadModal: () => void;
}

export const EventIngestionHub: React.FC<EventIngestionHubProps> = ({
  ingestion,
  onOpenStation,
  onOpenUploadModal,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors ${
              ingestion.activeMode === 'camera'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : ingestion.activeMode === 'folder'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}
          >
            {ingestion.activeMode === 'folder' ? (
              <FolderSync className="w-5 h-5 animate-spin-slow" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
              Photographer Camera & Live Ingestion Hub
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              Instant upload via direct camera shutter, tethered hot-folder, or batch files.
            </p>
          </div>
        </div>

        <div>
          {ingestion.activeMode === 'camera' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 flex items-center gap-1.5 animate-pulse shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              CAMERA SHUTTER ACTIVE
            </span>
          )}
          {ingestion.activeMode === 'folder' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              TETHERED HOT FOLDER ACTIVE
            </span>
          )}
          {ingestion.activeMode === 'none' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              STANDBY (READY)
            </span>
          )}
        </div>
      </div>

      {ingestion.activeMode === 'camera' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              <Camera className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Hardware Camera Shutter Streaming Live</span>
            </div>
            <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              Direct HDMI / USB Live Viewfinder Connected • {ingestion.capturedCount} photo(s) captured this session.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={ingestion.stopCamera}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/20"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel / Disconnect</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenStation('camera')}
              className="py-2.5 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Viewfinder</span>
            </button>
          </div>
        </div>
      )}

      {ingestion.activeMode === 'folder' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <FolderSync className="w-4 h-4 text-emerald-500 animate-spin-slow" />
              <span>Watching Folder: "{ingestion.watchedFolderName}"</span>
            </div>
            <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              Auto-syncing RAW/JPEG stills from Capture One / Lightroom • {ingestion.folderSyncedCount} photo(s) ingested.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={ingestion.stopFolderWatch}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/20"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel / Stop Watch</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenStation('folder')}
              className="py-2.5 px-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-500" />
              <span>Controls</span>
            </button>
          </div>
        </div>
      )}

      {ingestion.activeMode === 'none' && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-900 dark:text-white">
              <Camera className="w-4 h-4 text-amber-500" />
              <span>Hardware Camera & Tether Station</span>
            </div>
            <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Connect DSLR / Mirrorless via HDMI/USB, or monitor Capture One / Lightroom folder.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenStation('camera')}
            className="py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-400/20 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Camera Station</span>
          </button>
        </div>
      )}

      {ingestion.activeMode !== 'none' ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button
            type="button"
            disabled={true}
            className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border border-neutral-300/40 dark:border-neutral-800 text-xs font-mono font-bold flex items-center gap-2 cursor-not-allowed opacity-50 shrink-0"
          >
            <Lock className="w-4 h-4 text-amber-500/70" />
            <span>Quick Upload Files (Locked)</span>
          </button>
          <span className="text-[11px] font-mono text-amber-500/90 dark:text-amber-400/90 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Manual upload locked while {ingestion.activeMode === 'camera' ? 'Camera Shutter' : 'Tethered Hot Folder'} is active. Cancel stream to enable.
            </span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border border-neutral-300/60 dark:border-neutral-700/60"
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Quick Upload Files</span>
          </button>
          <span className="text-[11px] font-mono text-neutral-400">
            Multi-selection supported. High-res originals & 4K video auto-processed.
          </span>
        </div>
      )}
    </div>
  );
};
