import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Clock,
  Copy,
  Check,
  Download,
  Printer,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { LiveEvent } from '../../types/event';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../ui/Toast';
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

  const handleDurationPreset = (hours: number) => {
    setSelectedDuration(hours);
    const newExpiresAt = getExpiryDateHoursAhead(hours);
    updateQRExpiry(event.id, newExpiresAt, hours);
    showToast(
      'QR Validity Updated',
      `Event link will remain active for the next ${hours} hours.`,
      'info'
    );
  };

  const handleSaveCustomExpiry = () => {
    if (!customDateTime) return;
    const dateObj = new Date(customDateTime);
    if (isNaN(dateObj.getTime())) {
      showToast('Invalid Date', 'Please choose a valid expiration date and time.', 'error');
      return;
    }
    const iso = dateObj.toISOString();
    setSelectedDuration('custom');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overlay-animate overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#101117] border border-neutral-800 text-white shadow-2xl p-6 sm:p-8 my-8 sheet-animate">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                Live Guest Access
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white tracking-tight">
              Event QR Code & Time Validity
            </h3>
          </div>
        </div>

        {/* QR Code Card & Live Status */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-5">
          {/* QR Canvas Container */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl border border-neutral-200 group">
              <img
                src={qrApiUrl}
                alt="Event QR Code"
                className="w-44 h-44 object-contain rounded-lg"
              />
              <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/10 transition-colors rounded-2xl flex items-center justify-center" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-2 text-center">
              Scan with any mobile camera
            </span>
          </div>

          {/* QR Information & Live Status */}
          <div className="sm:col-span-7 space-y-3.5 text-left">
            <div>
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                Event Link Target
              </span>
              <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
              <p className="text-xs text-neutral-400 line-clamp-1">{event.venue}</p>
            </div>

            {/* Live Expiry Status Pill */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                isExpired
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <Clock
                className={`w-4 h-4 shrink-0 ${isExpired ? 'text-rose-400' : 'text-amber-400 animate-pulse'}`}
              />
              <div className="text-xs font-mono">
                <span className="font-bold block">
                  {isExpired ? 'QR Code Expired' : 'Active & Scanning'}
                </span>
                <span className="text-[11px] opacity-80">{timeLeftText}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Editorial Template with AI-Only Search</span>
            </div>
          </div>
        </div>

        {/* Set Validity Time Period */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
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
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveCustomExpiry}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Apply Date
            </button>
          </div>
        </div>

        {/* Action Buttons: Copy, Download, Print Stand Card */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Guest Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Download PNG QR image"
          >
            <Download className="w-4 h-4 text-amber-400" />
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
    </div>
  );
};
