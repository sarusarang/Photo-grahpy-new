import React, { useState } from 'react';
import { QrCode, Sliders, Copy, Check, Printer, Share2, Lock, Download } from 'lucide-react';
import { getEventShareUrl } from '@/utils/domain';
import { useToast } from '@/components/ui/Toast';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import type { LiveEvent } from '@/types/event';

export interface EventQRCardProps {
  event: LiveEvent;
  onOpenQRModal: () => void;
  onOpenPrintStand: () => void;
}

export const EventQRCard: React.FC<EventQRCardProps> = ({
  event,
  onOpenQRModal,
  onOpenPrintStand,
}) => {
  const { showToast } = useToast();
  const planQuota = usePlanQuota();
  const [copied, setCopied] = useState(false);

  const guestUrl = getEventShareUrl(event.slug || event.id);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    guestUrl
  )}&margin=8`;

  const handleCopyGuestLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    if (planQuota.isExpired) {
      showToast('Guest Link Suspended', 'Studio plan is expired. Attendees opening this URL will see an expiration notice until you renew.', 'warning');
    } else {
      showToast('Guest Link Copied', 'Share this link with attendees or venue coordinators.', 'success');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${event.slug || 'event'}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('QR Code Downloaded', 'High-res PNG image saved.', 'success');
    } catch {
      window.open(qrApiUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} — Live Event Stream`,
          text: `Find your photos from "${event.title}" with instant AI face search!`,
          url: guestUrl,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyGuestLink();
        }
      }
    } else {
      handleCopyGuestLink();
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Event QR Code & Stand
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenQRModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 active:bg-amber-400/30 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:border-amber-400/60 shadow-xs text-xs font-mono font-bold transition-all cursor-pointer group"
          title="Configure QR validity, expiration time & guest PIN"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
          <span>QR Settings & Expiry</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4">
        <div className="p-2 bg-white rounded-xl border border-neutral-200 shrink-0 shadow-xs">
          <img src={qrApiUrl} alt="QR Code" className="w-24 h-24 object-contain" />
        </div>
        <div className="space-y-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
          {planQuota.isExpired ? (
            <div className="flex items-center gap-1.5 text-rose-500 font-bold">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>Guest Link Suspended (Plan Expired)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Valid for Guests</span>
            </div>
          )}
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Expires: {new Date(event.qrSettings.expiresAt).toLocaleDateString()}{' '}
            {new Date(event.qrSettings.expiresAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleCopyGuestLink}
              className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Share event link to social media or apps"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
            <button
              onClick={handleDownloadQR}
              className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Download QR Code PNG image"
            >
              <Download className="w-3 h-3 text-amber-500" />
              <span>Download</span>
            </button>
            <button
              onClick={onOpenPrintStand}
              className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-500 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
