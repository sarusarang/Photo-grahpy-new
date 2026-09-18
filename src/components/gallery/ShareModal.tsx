import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Gallery } from '../../types';
import { useToast } from '../ui/Toast';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  X,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  Share2,
  Lock,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, gallery }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Lock background scroll
  useScrollLock(isOpen);

  if (!isOpen) return null;

  // Build full public URL
  const publicUrl = `${window.location.origin}/gallery/${gallery.slug || gallery.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showToast('Link Copied!', 'Client gallery URL copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${gallery.clientName}! Your private photography collection "${gallery.title}" is ready for viewing and download here: ${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(`Private Photo Gallery: ${gallery.title}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Your Photo Gallery: ${gallery.title}`);
    const body = encodeURIComponent(
      `Dear ${gallery.clientName},\n\nYour photos and videos are ready to view and download at:\n${publicUrl}\n\nBest regards,\n${gallery.title}`
    );
    window.location.href = `mailto:${gallery.clientEmail || ''}?subject=${subject}&body=${body}`;
  };

  return createPortal(
    <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md overlay-animate overscroll-contain">
      <div data-lenis-prevent="true" className="relative w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-neutral-950 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-5 sm:p-7 pb-safe shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sheet-animate sm:modal-animate text-neutral-900 dark:text-neutral-100 overscroll-contain">
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">Share Client Gallery</h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[240px] sm:max-w-[260px]">{gallery.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery Info Preview */}
        <div className="mt-5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3.5">
          <img
            src={gallery.coverImage}
            alt={gallery.title}
            className="w-14 h-14 rounded-xl object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{gallery.title}</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Client: {gallery.clientName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                {gallery.media.length} items
              </span>
              {gallery.isPasswordProtected && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3" /> PIN: {gallery.password || 'Protected'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Direct Link Box */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
            Direct Shareable URL
          </label>
          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 flex-1 px-2 focus:outline-none select-all font-mono truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social / Direct Share Buttons matching reference */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
            Instant Client Dispatch
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTelegram}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group"
            >
              <Send className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
              <span>Telegram</span>
            </button>

            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group"
            >
              <Mail className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Email</span>
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all group ${
                showQR
                  ? 'bg-amber-400/15 border-amber-400 text-amber-700 dark:text-amber-300'
                  : 'bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <QrCode className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* QR Code section if toggled */}
        {showQR && (
          <div className="mt-5 p-4 rounded-2xl bg-neutral-100 dark:bg-white text-neutral-950 text-center flex flex-col items-center overlay-animate">
            <div className="p-3 bg-white dark:bg-neutral-50 rounded-xl border border-neutral-200 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  publicUrl
                )}`}
                alt="Gallery QR Code"
                className="w-40 h-40"
              />
            </div>
            <p className="text-xs font-bold text-neutral-900 mt-2">{gallery.title}</p>
            <p className="text-[11px] text-neutral-500">Scan to open on iPhone, iPad, or Android</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Preview Client Gallery
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
