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
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { LiveEvent } from '../../types/event';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../ui/Toast';
import { useUpdateEventQR } from '@/hooks/useAtelierQueries';
import { getExpiryDateHoursAhead } from '../../data/eventData';

interface EventQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
  onOpenPrintStand?: () => void;
}

export const EventQRCodeModal: React.FC<EventQRCodeModalProps> = ({
  isOpen,
  onClose,
  event,
  onOpenPrintStand,
}) => {
  const { updateQRExpiry } = useEvent();
  const { showToast } = useToast();
  const { mutateAsync: updateEventQRApi } = useUpdateEventQR();

  const [copied, setCopied] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(
    event.qrSettings.durationHours || 4
  );
  const [customDateTime, setCustomDateTime] = useState<string>(() => {
    return event.qrSettings.expiresAt ? event.qrSettings.expiresAt.substring(0, 16) : '';
  });

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
  const guestUrl = `${window.location.origin}/events/${event.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(
    guestUrl
  )}&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    showToast('Guest Link Copied', 'Share this link with attendees or venue coordinators.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDurationPreset = async (hours: number) => {
    setSelectedDuration(hours);
    const newExpiresAt = getExpiryDateHoursAhead(hours);
    try {
      await updateEventQRApi({
        eventId: event.id,
        durationHours: hours,
        expiresAt: newExpiresAt,
        pinCode: event.qrSettings.pinCode,
        allowGuestUploads: event.qrSettings.allowGuestUploads,
      });
    } catch {
      // offline/fallback
    }
    updateQRExpiry(event.id, newExpiresAt, hours);
    showToast(
      'QR Validity Updated',
      `Event link will remain active for the next ${hours} hours.`,
      'info'
    );
  };

  const handleSaveCustomExpiry = async () => {
    if (!customDateTime) return;
    const dateObj = new Date(customDateTime);
    if (isNaN(dateObj.getTime())) {
      showToast('Invalid Date', 'Please choose a valid expiration date and time.', 'error');
      return;
    }
    const iso = dateObj.toISOString();
    setSelectedDuration('custom');
    try {
      await updateEventQRApi({
        eventId: event.id,
        durationHours: 'custom',
        expiresAt: iso,
        pinCode: event.qrSettings.pinCode,
        allowGuestUploads: event.qrSettings.allowGuestUploads,
      });
    } catch {
      // offline/fallback
    }
    updateQRExpiry(event.id, iso, 'custom');
    showToast('Custom Expiry Set', `Active until ${dateObj.toLocaleString()}`, 'success');
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
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                  Event Link Target
                </span>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">{event.title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{event.venue}</p>
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

              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Editorial Template with AI-Only Search</span>
              </div>
            </div>
          </div>

          {/* Set Validity Time Period */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Set QR Validity Duration</span>
              </label>
              <span className="text-[11px] font-mono text-neutral-500">Auto-closes afterwards</span>
            </div>

            {/* Duration Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 8, 24].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => handleDurationPreset(hours)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedDuration === hours
                      ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20 ring-2 ring-amber-400'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-800'
                  }`}
                >
                  {hours === 24 ? '24 Hours' : `${hours} Hours`}
                </button>
              ))}
            </div>

            {/* Custom Date/Time Expiry */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveCustomExpiry}
                className="px-4 py-2.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Apply Date
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
