import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Upload,
  QrCode,
  Layers,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Play,
  Pause,
} from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../../components/ui/Toast';
import { EventQRCodeModal } from '../../components/events/EventQRCodeModal';
import { EventPrintStandModal } from '../../components/events/EventPrintStandModal';
import { ChangeBannerModal } from '../../components/events/ChangeBannerModal';
import { MoveToGalleryModal } from '../../components/events/MoveToGalleryModal';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const {
    getEventByIdOrSlug,
    addMediaToEvent,
    removeMediaFromEvent,
    simulateTetherShot,
    toggleAutoSync,
  } = useEvent();
  const { showToast } = useToast();

  const event = getEventByIdOrSlug(eventId || '');

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPrintStandOpen, setIsPrintStandOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isMoveToGalleryOpen, setIsMoveToGalleryOpen] = useState(false);

  // Link copy state
  const [copied, setCopied] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-sync tethering simulation interval
  useEffect(() => {
    if (!event || !event.autoSyncEnabled || event.status !== 'live') return;

    const interval = setInterval(() => {
      const newMedia = simulateTetherShot(event.id);
      if (newMedia) {
        showToast(
          'Live Tether Shot Received',
          `${newMedia.title} automatically synced from camera buffer.`,
          'info'
        );
      }
    }, 10000); // every 10 seconds a new shot lands when tethering is active

    return () => clearInterval(interval);
  }, [event?.autoSyncEnabled, event?.status, event?.id, simulateTetherShot, showToast]);

  if (!event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white">
          Event Not Found
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          The requested event could not be located in your studio workspace.
        </p>
        <Link
          to="/dashboard/events"
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase"
        >
          Return to Events
        </Link>
      </div>
    );
  }

  const guestUrl = `${window.location.origin}/events/${event.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    guestUrl
  )}&margin=8`;

  const handleCopyGuestLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    showToast('Guest Link Copied', 'Share with attendees or venue coordinators.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualTetherShot = () => {
    const shot = simulateTetherShot(event.id);
    if (shot) {
      showToast('Camera Shot Synced', `Added ${shot.title} to live stream.`, 'success');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newItems: Array<{
      type: 'photo';
      url: string;
      thumbnailUrl?: string;
      title: string;
      caption?: string;
      sectionTitle?: string;
      aspectRatio: number;
      width: number;
      height: number;
      sizeMB: number;
    }> = [];

    let processed = 0;
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        newItems.push({
          type: 'photo',
          url: dataUrl,
          thumbnailUrl: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ''),
          caption: 'Uploaded live during event',
          sectionTitle: 'CEREMONY',
          aspectRatio: 1.5,
          width: 2400,
          height: 1600,
          sizeMB: Number((file.size / (1024 * 1024)).toFixed(1)),
        });
        processed++;
        if (processed === files.length) {
          addMediaToEvent(event.id, newItems);
          setIsUploading(false);
          showToast(
            'Live Photos Uploaded',
            `Added ${newItems.length} photograph(s) instantly into event stream.`,
            'success'
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ─── Back Navigation & Actions ─── */}
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Guest View Link */}
          <Link
            to={`/events/${event.id}`}
            target="_blank"
            className="py-2 px-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-800 flex items-center gap-2 transition-colors"
          >
            <span>Guest QR View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Move to Gallery Button */}
          <button
            onClick={() => setIsMoveToGalleryOpen(true)}
            className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-md shadow-amber-400/20 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Move to Gallery</span>
          </button>
        </div>
      </div>

      {/* ─── Hero Banner Preview & Quick Controls ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl group">
        <div className="relative h-64 sm:h-72 w-full bg-neutral-900">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

          {/* Change Banner Button Overlay */}
          <button
            onClick={() => setIsBannerModalOpen(true)}
            className="absolute top-4 right-4 py-2 px-3.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer shadow-lg"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Change Editorial Banner</span>
          </button>

          {/* Event Metadata Overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[11px] font-mono tracking-widest uppercase text-amber-300 block font-semibold">
                {event.eventType} • {event.eventDate} {event.eventTime && `at ${event.eventTime}`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white drop-shadow-md">
                {event.title}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{event.venue} {event.city && `• ${event.city}`}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-neutral-300 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shrink-0">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Photos</span>
                <span className="text-base font-bold text-white">{event.media.length}</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Scans</span>
                <span className="text-base font-bold text-amber-400">{event.stats.qrScans}</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">AI Matches</span>
                <span className="text-base font-bold text-emerald-400">
                  {event.stats.matchesFound}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Control Grid: 1. Live Tethering & Upload | 2. QR Code & Expiry ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Tethering Simulator & Quick Upload (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tethering & Auto-Sync Widget */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
                    Live Camera Tethering & Instant Upload
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    Automatically syncs photos from your camera straight into this event.
                  </p>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <button
                type="button"
                onClick={() => toggleAutoSync(event.id)}
                className={`py-1.5 px-3 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  event.autoSyncEnabled
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-transparent'
                }`}
              >
                {event.autoSyncEnabled ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-950 animate-ping" />
                    <span>Auto-Sync ON</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Auto-Sync OFF</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Trigger Single Simulated Shot */}
              <button
                type="button"
                onClick={handleManualTetherShot}
                className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-800 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-500" />
                <span>Simulate 1 Live Shot</span>
              </button>

              {/* Dropzone File Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload Photos / Camera'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {event.autoSyncEnabled && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  <strong>Camera Tether Active:</strong> New shots taken on your camera land in
                  the guest stream in real time.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: QR Code & Time Validity Summary (5 cols) */}
        <div className="lg:col-span-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Event QR Code & Expiry
                </h3>
              </div>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="text-xs font-mono text-amber-600 dark:text-amber-500 hover:underline cursor-pointer"
              >
                Change Expiry
              </button>
            </div>

            <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4">
              <div className="p-2 bg-white rounded-xl border border-neutral-200 shrink-0 shadow-xs">
                <img src={qrApiUrl} alt="QR Code" className="w-24 h-24 object-contain" />
              </div>
              <div className="space-y-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Valid for Guests</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Expires: {new Date(event.qrSettings.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({event.qrSettings.durationHours}h preset)
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={handleCopyGuestLink}
                    className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors border border-neutral-300/60 dark:border-transparent"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    onClick={() => setIsPrintStandOpen(true)}
                    className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-500 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print Stand</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Live Event Photo Stream ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
              Live Photos Stream ({event.media.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            Instant AI Face Search is active for all photos
          </span>
        </div>

        {event.media.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-md mx-auto space-y-3">
            <Camera className="w-8 h-8 text-neutral-400 mx-auto stroke-1" />
            <p className="font-serif italic text-neutral-700 dark:text-neutral-300 text-base">
              No photos uploaded to this event yet
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Click "Upload Photos" above or simulate a live camera shot.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {event.media.map((item) => (
              <div
                key={item.id}
                className="group relative break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/80 shadow-xs"
              >
                <img
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Section title pill */}
                {item.sectionTitle && (
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-amber-300 uppercase font-bold border border-amber-400/20">
                    {item.sectionTitle}
                  </span>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeMediaFromEvent(event.id, item.id)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-rose-950/80 text-white hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove photo from event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Title & Caption */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <p className="text-xs font-serif italic line-clamp-1">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      <EventQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        event={event}
        onOpenPrintStand={() => {
          setIsQRModalOpen(false);
          setIsPrintStandOpen(true);
        }}
      />

      <EventPrintStandModal
        isOpen={isPrintStandOpen}
        onClose={() => setIsPrintStandOpen(false)}
        event={event}
      />

      <ChangeBannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        event={event}
      />

      <MoveToGalleryModal
        isOpen={isMoveToGalleryOpen}
        onClose={() => setIsMoveToGalleryOpen(false)}
        event={event}
      />
    </div>
  );
};
