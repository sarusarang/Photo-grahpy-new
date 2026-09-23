import React from 'react';
import { X, Printer, Sparkles, Camera, ArrowRight, ShieldCheck } from 'lucide-react';
import type { LiveEvent } from '../../types/event';

interface EventPrintStandModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
  studioName?: string;
}

export const EventPrintStandModal: React.FC<EventPrintStandModalProps> = ({
  isOpen,
  onClose,
  event,
  studioName = 'ATELIER PHOTOGRAPHY',
}) => {
  if (!isOpen) return null;

  const guestUrl = `${window.location.origin}/events/${event.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    guestUrl
  )}&margin=15`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-900 dark:text-white shadow-2xl my-auto modal-animate max-h-[min(92vh,840px)] flex flex-col overflow-hidden">
        {/* Modal Controls (Fixed Header) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-[#101117] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Printable Guest Table Stand
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-400/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Card (A5 / 5x7)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Card Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100/70 dark:bg-neutral-950/50 flex justify-center">
          {/* Printable Card (styled with print-friendly layout) */}
          <div
            id="printable-stand-card"
            className="w-full bg-white text-neutral-900 rounded-2xl p-6 sm:p-10 border border-neutral-200 shadow-xl flex flex-col items-center text-center space-y-6 relative overflow-hidden my-auto"
          >
            {/* Subtle Luxury Border Accent */}
            <div className="absolute inset-2 border border-neutral-200/80 rounded-xl pointer-events-none" />
            <div className="absolute inset-3 border border-amber-600/30 rounded-lg pointer-events-none" />

            {/* Studio Top Line */}
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] text-neutral-500 uppercase block font-semibold">
                {studioName} PRESENTS
              </span>
              <div className="h-px w-16 bg-amber-500/60 mx-auto mt-1" />
            </div>

            {/* Event Celebration Title */}
            <div className="space-y-2 relative z-10 max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight leading-snug">
                {event.title}
              </h2>
              <p className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                {event.venue} • {event.eventDate}
              </p>
            </div>

            {/* QR Code in High-Contrast Border */}
            <div className="relative z-10 p-4 bg-neutral-50 border-2 border-neutral-900 rounded-2xl shadow-xl">
              <img
                src={qrApiUrl}
                alt="Scan Event QR"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            </div>

            {/* AI Face Recognition Instructions */}
            <div className="space-y-3 relative z-10 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Instant AI Face Recognition</span>
              </div>

              <h3 className="text-lg font-serif font-bold text-neutral-900">
                Find Your Photos In Seconds
              </h3>

              <p className="text-xs text-neutral-600 leading-relaxed font-light">
                1. Point your smartphone camera at the QR code above.<br />
                2. Upload or snap a quick selfie.<br />
                3. Our AI instantly finds every photograph you appear in today!
              </p>
            </div>

            {/* Footer Note */}
            <div className="pt-2 text-[10px] font-mono text-neutral-400 relative z-10 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Private & Secure • Powered by Atelier AI Live Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
