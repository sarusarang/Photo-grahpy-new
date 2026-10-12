import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  X,
  UploadCloud,
  Camera,
  FolderSync,
  Layers,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export interface ActiveUploadItem {
  id: string;
  source: 'gallery' | 'event' | 'camera' | 'folder';
  title: string;
  details?: string;
  count?: number;
  progress?: number;
}

export interface UploadReloadWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReload: () => void;
  activeTasks: ActiveUploadItem[];
}

export const UploadReloadWarningModal: React.FC<UploadReloadWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirmReload,
  activeTasks,
}) => {
  // Lock body scroll & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSourceIcon = (source: ActiveUploadItem['source']) => {
    switch (source) {
      case 'camera':
        return <Camera className="w-4 h-4 text-emerald-400" />;
      case 'folder':
        return <FolderSync className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'event':
        return <UploadCloud className="w-4 h-4 text-amber-400" />;
      case 'gallery':
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const getSourceBadge = (source: ActiveUploadItem['source']) => {
    switch (source) {
      case 'camera':
        return 'Live Camera Tethering';
      case 'folder':
        return 'Hot-Folder Auto-Sync';
      case 'event':
        return 'Event Media Upload';
      case 'gallery':
      default:
        return 'Gallery Cloud Upload';
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-warning-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overlay-animate select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e1017] border border-neutral-800 text-white shadow-2xl rounded-3xl p-6 sm:p-7 modal-animate my-auto overflow-hidden ring-1 ring-amber-500/20"
      >
        {/* Soft Ambient Warning Glow in background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-6 h-6 stroke-[2.2] animate-bounce duration-1000" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-[#0e1017] animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Upload In Progress
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Transfer Active
                </span>
              </div>
              <h3
                id="upload-warning-title"
                className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight mt-0.5"
              >
                Reloading Will Stop Uploads
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
            title="Keep uploading and close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Explanatory Text */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light mb-4">
          You have active media uploads or camera sessions in progress. Reloading or leaving this
          page will <strong className="text-rose-400 font-semibold">abort in-flight transfers</strong> and any
          partially ingested files will not be saved.
        </p>

        {/* Active Tasks Snapshot Card */}
        <div className="mb-5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-neutral-800/80 pb-2">
            <span>ACTIVE OPERATIONS ({activeTasks.length || 1})</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Ingesting...
            </span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/70 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                      {getSourceIcon(task.source)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {task.details || getSourceBadge(task.source)}
                      </p>
                    </div>
                  </div>

                  {typeof task.count === 'number' && task.count > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] font-mono text-amber-300 font-bold shrink-0">
                      {task.count} {task.count === 1 ? 'file' : 'files'}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/70 text-xs font-mono">
                <UploadCloud className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-neutral-300">Active background media upload in progress...</span>
              </div>
            )}
          </div>
        </div>

        {/* Protection Note */}
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Stay on this page until uploads reach 100% to ensure all assets are safely saved.</span>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onConfirmReload}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-neutral-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 text-xs font-mono font-bold transition-all cursor-pointer text-center"
          >
            Reload Anyway (Cancel Uploads)
          </button>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-95 cursor-pointer font-bold"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Stay & Continue Uploading</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
