import React from 'react';
import { Image as ImageIcon, MapPin } from 'lucide-react';
import type { LiveEvent } from '@/types/event';

export interface EventHeroBannerProps {
  event: LiveEvent;
  onOpenBannerModal: () => void;
}

export const EventHeroBanner: React.FC<EventHeroBannerProps> = ({
  event,
  onOpenBannerModal,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl group">
      <div className="relative h-64 sm:h-72 w-full bg-neutral-900">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

        <button
          type="button"
          onClick={onOpenBannerModal}
          className="absolute top-4 right-4 py-2 px-3.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer shadow-lg"
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>Change Editorial Banner</span>
        </button>

        <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-300 block font-semibold">
              {event.eventType} • {event.eventDate} {event.eventTime && `at ${event.eventTime}`}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-normal text-white/95 tracking-[0.03em] drop-shadow-xs leading-snug">
              {event.title}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {event.venue} {event.city && `• ${event.city}`}
              </span>
              <span className="opacity-50">|</span>
              <span>Client: {event.clientName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-200 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Live Event Engine Synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
};
