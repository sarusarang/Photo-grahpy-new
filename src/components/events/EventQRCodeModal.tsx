import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  QrCode,
  Clock,
  Copy,
  Check,
  Download,
  Printer,
  Loader2,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { LiveEvent } from '../../types/event';
import { useToast } from '../ui/Toast';
import { useUpdateEventQR } from '@/hooks/useAtelierQueries';
import { getExpiryDateHoursAhead } from './eventConstants';
import { getEventShareUrl } from '@/utils/domain';

interface EventQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
  onOpenPrintStand?: () => void;
  onUpdated?: () => void;
}

export const EventQRCodeModal: React.FC<EventQRCodeModalProps> = ({
  isOpen,
  onClose,
  event,
  onOpenPrintStand,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const { mutateAsync: updateEventQRApi } = useUpdateEventQR();

  const [copied, setCopied] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(
    event.qrSettings.durationHours || 4
  );
  const [customDateTime, setCustomDateTime] = useState<string>(() => {
    return event.qrSettings.expiresAt ? event.qrSettings.expiresAt.substring(0, 16) : '';
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state whenever event data updates from server
  useEffect(() => {
    queueMicrotask(() => {
      setSelectedDuration(event.qrSettings.durationHours || 4);
      if (event.qrSettings.expiresAt) {
        setCustomDateTime(event.qrSettings.expiresAt.substring(0, 16));
      }
    });
  }, [event.qrSettings.durationHours, event.qrSettings.expiresAt]);

  // Calculate live remaining time
  const [timeLeftText, setTimeLeftText] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const expiry = new Date(event.qrSettings.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeftText('Expired');
      } else {
        setIsExpired(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeLeftText(`${days}d ${hours % 24}h remaining`);
        } else {
          setTimeLeftText(
            `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(
              seconds
            ).padStart(2, '0')}s remaining`
          );
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.qrSettings.expiresAt]);

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

  // The public URL for guests scanning the QR
  const guestUrl = getEventShareUrl(event.slug || event.id);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(
    guestUrl
  )}&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    showToast('Guest Link Copied', 'Share this link with attendees or venue coordinators.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello! Check out the live photography collection for "${event.title}" on EX SHARE: ${guestUrl}\nFind your photos instantly with AI Face Search!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Explore live photos from "${event.title}" on EX SHARE with instant AI face discovery!`);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(guestUrl)}&text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} — Live Event Stream`,
          text: `Find your photos from "${event.title}" with instant AI face search!`,
          url: guestUrl,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDurationPreset = async (hours: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    const newExpiresAt = getExpiryDateHoursAhead(hours);
    try {
      await updateEventQRApi({
        eventId: event.id,
        durationHours: hours,
        expiresAt: newExpiresAt,
        pinCode: event.qrSettings.pinCode,
        allowGuestUploads: event.qrSettings.allowGuestUploads,
      });
      setSelectedDuration(hours);
      showToast(
        'QR Validity Updated',
        `Event link will remain active for the next ${hours >= 24 ? `${hours / 24} day(s)` : `${hours} hours`}.`,
        'success'
      );
      onUpdated?.();
    } catch (err: unknown) {
      // Revert selected state on error
      setSelectedDuration(event.qrSettings.durationHours || 4);
      showToast('QR Update Failed', (err as Error)?.message || 'Failed to update validity on server.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCustomExpiry = async () => {
    if (!customDateTime || isUpdating) return;
    const dateObj = new Date(customDateTime);
    if (isNaN(dateObj.getTime())) {
      showToast('Invalid Date', 'Please choose a valid expiration date and time.', 'error');
      return;
    }
    const iso = dateObj.toISOString();
    setIsUpdating(true);
    try {
      await updateEventQRApi({
        eventId: event.id,
        durationHours: 'custom',
        expiresAt: iso,
        pinCode: event.qrSettings.pinCode,
        allowGuestUploads: event.qrSettings.allowGuestUploads,
      });
      setSelectedDuration('custom');
      showToast('Custom Expiry Set', `Active until ${dateObj.toLocaleString()}`, 'success');
      onUpdated?.();
    } catch (err: unknown) {
      setSelectedDuration(event.qrSettings.durationHours || 4);
      showToast('QR Expiry Update Failed', (err as Error)?.message || 'Failed to update expiration on server.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${event.slug}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('QR Code Downloaded', 'High-res PNG image saved.', 'success');
    } catch {
      // Direct link fallback
      window.open(qrApiUrl, '_blank');
    }
  };

  const handleShareQRImage = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const cleanName = `${event.slug || 'event'}-qr-code.png`;
      const file = new File([blob], cleanName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${event.title} — QR Code`,
          text: `Scan this QR Code to access live photos from "${event.title}": ${guestUrl}`,
        });
        showToast('QR Code Shared', 'Shared successfully via apps.', 'success');
        return;
      }

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        showToast('QR Image Copied', 'QR Code image copied to clipboard!', 'success');
        return;
      }

      handleDownloadQR();
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        handleDownloadQR();
      }
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl rounded-3xl my-auto modal-animate max-h-[min(90vh,760px)] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Live Guest Access
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Event QR Code & Time Validity
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* QR Code Card & Live Status */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-5">
            {/* QR Canvas Container */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-neutral-200 group flex items-center justify-center">
                <QRCodeSVG value={guestUrl} size={176} level="H" includeMargin />
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                Scan with any mobile camera
              </span>
            </div>

            {/* QR Information & Live Status */}
            <div className="sm:col-span-7 space-y-3.5 text-left">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                {event.bannerUrl && (
                  <img
                    src={event.bannerUrl}
                    alt={event.title}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Event Target & Hero Banner
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{event.title}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{event.venue || event.city || 'Live Stream'}</p>
                </div>
              </div>

              {/* Live Expiry Status Pill */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isExpired
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                }`}
              >
                <Clock
                  className={`w-4 h-4 shrink-0 ${isExpired ? 'text-rose-500' : 'text-amber-500 animate-pulse'}`}
                />
                <div className="text-xs font-mono">
                  <span className="font-bold block">
                    {isExpired ? 'QR Code Expired' : 'Active & Scanning'}
                  </span>
                  <span className="text-[11px] opacity-80">{timeLeftText}</span>
                </div>
              </div>

              {/* Quick Social Share for Event */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Share to WhatsApp with hero banner"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.771.889 2.796.889 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.374 8.163c-.144.405-.837.774-1.17.823-.312.045-.694.062-2.181-.555-1.902-.788-3.129-2.735-3.224-2.86-.095-.125-.771-1.026-.771-1.956 0-.93.488-1.386.662-1.576.174-.19.38-.238.507-.238.127 0 .253.002.364.007.119.005.277-.045.433.329.164.394.557 1.358.605 1.457.048.099.08.214.016.341-.064.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.195.198-.084.388.111.19.493.813 1.058 1.317.728.648 1.341.849 1.531.944.19.095.301.079.412-.048.111-.127.476-.555.603-.745.127-.19.254-.159.428-.095.175.064 1.111.524 1.301.619.19.095.317.143.365.222.048.079.048.46-.096.865z" />
                  </svg>
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleTwitterShare}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Share to Twitter / X"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Twitter</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Share via device apps"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Set Validity Time Period */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="atelier-label mb-0">
                <span className="flex items-center gap-2 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Set QR Validity Duration</span>
                </span>
              </label>
              <span className="text-[11px] font-mono text-neutral-500">Auto-closes afterwards</span>
            </div>

            {/* Duration Presets */}
            <div className="p-1.5 rounded-2xl bg-neutral-100/90 dark:bg-[#07080e] border border-neutral-200/80 dark:border-white/[0.06] shadow-inner grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[4, 8, 24, 48, 168].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleDurationPreset(hours)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer text-center disabled:opacity-50 flex items-center justify-center ${
                    selectedDuration === hours
                      ? 'bg-white dark:bg-gradient-to-b dark:from-[#262015] dark:to-[#17140e] text-neutral-950 dark:text-amber-300 border border-amber-500/40 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/10'
                      : 'border-transparent bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  {isUpdating && selectedDuration === hours ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : hours === 24 ? (
                    '24h (1d)'
                  ) : hours === 48 ? (
                    '48h (2d)'
                  ) : hours === 168 ? (
                    '7 Days'
                  ) : (
                    `${hours} Hours`
                  )}
                </button>
              ))}
            </div>

            {/* Custom Date/Time Expiry */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="datetime-local"
                  disabled={isUpdating}
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="atelier-input font-mono text-xs disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveCustomExpiry}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-mono font-bold transition-all active:scale-[0.98] shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Date</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Copy, Download, Print Stand Card (Fixed Footer) */}
        <div className="p-4 sm:p-6 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-[#101117]/90 backdrop-blur-xs flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-500" />
                <span>Copy Guest Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareQRImage}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-400/20"
            title="Share QR Code image directly via WhatsApp, AirDrop or apps"
          >
            <Share2 className="w-4 h-4 stroke-[2.2]" />
            <span>Share QR</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Download PNG QR image"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Download PNG</span>
          </button>

          {onOpenPrintStand && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrintStand();
              }}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Stand</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
