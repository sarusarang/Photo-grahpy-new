import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { LiveEvent } from '@/types/event';

export interface EventDeleteModalProps {
  isOpen: boolean;
  target: {
    event: LiveEvent;
    mode: 'trash' | 'permanent';
  } | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const EventDeleteModal: React.FC<EventDeleteModalProps> = ({
  isOpen,
  target,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !target) return null;

  const isPermanent = target.mode === 'permanent';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
        <div
          className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${
            isPermanent ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {isPermanent ? 'Delete Event Permanently?' : 'Move Event to Trash?'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            {isPermanent
              ? `Are you sure you want to permanently delete "${target.event.title}"? This action cannot be undone.`
              : `"${target.event.title}" will be moved to Event Trash. You can restore it anytime within 15 days.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting
              ? 'Processing...'
              : isPermanent
              ? 'Delete Forever'
              : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
};
