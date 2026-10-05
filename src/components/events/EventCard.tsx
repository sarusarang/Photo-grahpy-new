import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Image as ImageIcon,
  MapPin,
  RotateCcw,
  Play,
  Camera,
  Printer,
  QrCode,
  Layers,
  ExternalLink,
} from 'lucide-react';
import type { LiveEvent } from '@/types/event';

import { LockedCardOverlay } from '@/components/common/ExpiredPlanLock';

export interface EventCardProps {
  event: LiveEvent;
  onNavigate: (id: string) => void;
  onEdit: (event: LiveEvent) => void;
  onChangeBanner: (event: LiveEvent) => void;
  onSoftDelete: (event: LiveEvent) => void;
  onPermanentDelete: (event: LiveEvent) => void;
  onRestore: (event: LiveEvent) => void;
  isRestoring?: boolean;
  onStartLiveShoot: (event: LiveEvent) => void;
  onPrintStand: (event: LiveEvent) => void;
  onOpenQR: (event: LiveEvent) => void;
  onMoveToGallery: (event: LiveEvent) => void;
  isPlanExpired?: boolean;
  onRenewPlan?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onNavigate,
  onEdit,
  onChangeBanner,
  onSoftDelete,
  onPermanentDelete,
  onRestore,
  isRestoring = false,
  onStartLiveShoot,
  onPrintStand,
  onOpenQR,
  onMoveToGallery,
  isPlanExpired = false,
  onRenewPlan,
}) => {
  const isLive = event.status === 'live';
  const isUpcoming = event.status === 'upcoming';
  const isMoved = event.status === 'moved_to_gallery';
  const isTrash = event.status === 'trash' || event.status === 'archived';

  return (
    <div
      onClick={() => {
        if (isPlanExpired) {
          onRenewPlan?.();
          return;
        }
        if (!isTrash) {
          onNavigate(event.id);
        }
      }}
      className={`group relative rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${
        !isTrash ? 'cursor-pointer hover:border-amber-400/50 dark:hover:border-amber-400/40 hover:-translate-y-1' : ''
      } ${isPlanExpired ? 'ring-1 ring-rose-500/30' : ''}`}
    >
      {/* Locked Card Overlay when plan is expired */}
      {isPlanExpired && (
        <LockedCardOverlay
          title="Event Access Locked"
          subtitle="Renew membership to enter & manage this live event"
          onRenew={() => onRenewPlan?.()}
        />
      )}
      {/* Banner Thumbnail with Overlays */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

        {/* Status Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isLive && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-neutral-950 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-pulse" />
              LIVE STREAMING
            </span>
          )}
          {isUpcoming && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-neutral-950 flex items-center gap-1.5 shadow-md">
              <Clock className="w-3 h-3" />
              UPCOMING
            </span>
          )}
          {isMoved && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              IN GALLERY
            </span>
          )}
          {isTrash && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1.5 shadow-md">
              <Trash2 className="w-3 h-3" />
              IN TRASH (15d)
            </span>
          )}
        </div>

        {/* Top-Right Quick Actions */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {!isTrash && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer"
                title="Edit Event Details"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeBanner(event);
                }}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer"
                title="Change Editorial Banner"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </>
          )}

          {isTrash ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPermanentDelete(event);
              }}
              className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white backdrop-blur-md transition-all cursor-pointer"
              title="Permanently Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSoftDelete(event);
              }}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-rose-950/80 text-white hover:text-rose-300 backdrop-blur-md transition-all cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Title & Date on Banner */}
        <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 block">
            {event.eventType} • {event.eventDate}
          </span>
          <h3 className="text-base sm:text-lg font-sans font-normal text-white/95 line-clamp-1 leading-snug tracking-[0.02em]">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 line-clamp-1 font-mono">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{event.venue}</span>
          </div>
        </div>
      </div>

      {/* Card Content & Stats */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 text-center">
          <div>
            <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium truncate">
              Photos
            </span>
            <span className="text-sm font-sans font-bold tabular-nums text-neutral-900 dark:text-white">
              {event.photosCount ?? event.media.length}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium truncate">
              Size
            </span>
            <span className="text-sm font-sans font-bold tabular-nums text-amber-600 dark:text-amber-400 truncate">
              {event.totalSizeFormatted || (event.totalSizeMB ? `${event.totalSizeMB} MB` : '0 MB')}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium truncate">
              QR Scans
            </span>
            <span className="text-sm font-sans font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {event.stats.qrScans}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-medium truncate">
              AI Matches
            </span>
            <span className="text-sm font-sans font-bold tabular-nums text-emerald-600 dark:text-emerald-500">
              {event.stats.matchesFound}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="space-y-2 pt-1">
          {isTrash ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(event);
                }}
                disabled={isRestoring}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Event</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPermanentDelete(event);
                }}
                className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Forever</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {isUpcoming ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartLiveShoot(event);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Live Shoot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(event.id);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Control Room</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintStand(event);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Print Table Stand Cards"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Stand</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenQR(event);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-500 border border-amber-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="View & Configure QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1 text-neutral-600 dark:text-neutral-400">
                {!isMoved ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToGallery(event);
                    }}
                    className="text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Move to Gallery</span>
                  </button>
                ) : (
                  <Link
                    to={`/dashboard/gallery/${event.associatedGalleryId || 'gal-lake-como'}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-600 dark:text-emerald-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>View in Gallery</span>
                  </Link>
                )}

                <Link
                  to={`/events/${event.slug || event.id}`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  className="hover:text-neutral-900 dark:hover:text-white text-neutral-600 dark:text-neutral-400 flex items-center gap-1 transition-colors"
                  title="Open client scanning template"
                >
                  <span>Client Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
