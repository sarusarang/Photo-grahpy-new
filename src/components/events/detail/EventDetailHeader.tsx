import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, ExternalLink, Edit3, Layers } from 'lucide-react';
import type { LiveEvent } from '@/types/event';

export interface EventDetailHeaderProps {
  event: LiveEvent;
  onStartLiveShoot: () => void;
  onOpenEditModal: () => void;
  onOpenMoveToGallery: () => void;
}

export const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  event,
  onStartLiveShoot,
  onOpenEditModal,
  onOpenMoveToGallery,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/events"
          className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              Event Command Center
            </span>
            {event.status === 'live' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SHOOTING
              </span>
            )}
            {event.status === 'upcoming' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                UPCOMING SCHEDULED
              </span>
            )}
            {event.status === 'completed' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 font-bold">
                COMPLETED
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-sans font-normal text-neutral-900 dark:text-white/95 tracking-[0.02em]">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {event.status === 'upcoming' && (
          <button
            onClick={onStartLiveShoot}
            className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Live Shoot Now</span>
          </button>
        )}

        <Link
          to={`/events/${event.slug || event.id}`}
          target="_blank"
          className="py-2 px-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-800 flex items-center gap-2 transition-colors"
        >
          <span>Guest QR Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={onOpenEditModal}
          className="py-2 px-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-800 flex items-center gap-2 transition-colors cursor-pointer"
          title="Edit event details, schedule & venue"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Edit Details</span>
        </button>

        <button
          onClick={onOpenMoveToGallery}
          className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-md shadow-amber-400/20 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>Move to Gallery</span>
        </button>
      </div>
    </div>
  );
};
