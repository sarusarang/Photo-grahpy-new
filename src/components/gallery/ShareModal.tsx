import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Gallery } from '../../types';
import { useToast } from '../ui/Toast';
import { useGallery } from '../../context/GalleryContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  getExpiryStatus,
  calculateExpiryPreset,
  extendExpiryByDays,
  EXPIRY_PRESETS,
  type ExpiryPresetId,
} from '../../utils/expiryUtils';
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
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, gallery }) => {
  const { showToast } = useToast();
  const { updateGallery } = useGallery();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showCustomExpiry, setShowCustomExpiry] = useState(false);

  // Formatted expiry details
  const expiryStatus = getExpiryStatus(gallery.expiresAt);

  const [customDateTime, setCustomDateTime] = useState(() => {
    if (gallery.expiresAt) {
      try {
        return new Date(gallery.expiresAt).toISOString().slice(0, 16);
      } catch {
        return '';
      }
    }
    return '';
  });

  // Lock background scroll
  useScrollLock(isOpen);

  if (!isOpen) return null;

  // Build full public URL
  const publicUrl = `${window.location.origin}/gallery/${gallery.slug || gallery.id}`;

  const expiryNote =
    expiryStatus.hasExpiry && !expiryStatus.isExpired
      ? ` • Access valid until ${expiryStatus.humanFormatted}`
      : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showToast('Link Copied!', 'Client gallery URL copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${gallery.clientName}! Your private photography collection "${gallery.title}" is ready for viewing here: ${publicUrl}${expiryNote}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(`Private Photo Gallery: ${gallery.title}${expiryNote}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`, '_blank');
  };

  const handleSnapchat = () => {
    window.open(`https://www.snapchat.com/share?link=${encodeURIComponent(publicUrl)}`, '_blank');
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Link Copied for Instagram!', 'Paste the gallery link in your Instagram Story, Bio, or DM.', 'success');
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 500);
    } catch {
      window.open('https://www.instagram.com/', '_blank');
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Your Photo Gallery: ${gallery.title}`);
    const body = encodeURIComponent(
      `Dear ${gallery.clientName},\n\nYour private photos and cinematic collection are ready to view and download at:\n${publicUrl}\n\n${
        expiryStatus.hasExpiry && !expiryStatus.isExpired
          ? `Please note that this gallery link is scheduled to remain active until ${expiryStatus.humanFormatted}.\n\n`
          : ''
      }Best regards,\n${gallery.title}`
    );
    window.location.href = `mailto:${gallery.clientEmail || ''}?subject=${subject}&body=${body}`;
  };

  // Expiry preset selection
  const handleSelectPreset = (presetId: ExpiryPresetId) => {
    if (presetId === 'custom') {
      setShowCustomExpiry(true);
      return;
    }
    setShowCustomExpiry(false);
    const nextIso = calculateExpiryPreset(presetId);
    updateGallery(gallery.id, { expiresAt: nextIso });
    const status = getExpiryStatus(nextIso);
    showToast(
      'Link Validity Updated',
      nextIso
        ? `Link active until ${status.humanFormatted} (${status.remainingText}).`
        : 'Link set to permanent access with no expiry.',
      'success'
    );
  };

  const handleApplyCustomExpiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateTime) return;
    const nextIso = new Date(customDateTime).toISOString();
    updateGallery(gallery.id, { expiresAt: nextIso });
    const status = getExpiryStatus(nextIso);
    setShowCustomExpiry(false);
    showToast(
      'Custom Expiry Applied',
      `Client access scheduled to close on ${status.humanFormatted}.`,
      'success'
    );
  };

  const handleExtendDays = (days: number) => {
    const nextIso = extendExpiryByDays(days, gallery.expiresAt);
    updateGallery(gallery.id, { expiresAt: nextIso });
    const status = getExpiryStatus(nextIso);
    showToast('Access Extended', `Link renewed until ${status.humanFormatted}.`, 'success');
  };

  const handleRemoveExpiry = () => {
    updateGallery(gallery.id, { expiresAt: undefined });
    setShowCustomExpiry(false);
    showToast('Expiry Removed', 'Gallery link will now remain permanently accessible.', 'info');
  };

  return createPortal(
    <div data-lenis-prevent="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overlay-animate overscroll-contain">
      <div data-lenis-prevent="true" className="relative w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#0c0d12] border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-5 sm:p-7 pb-safe shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sheet-animate sm:modal-animate text-neutral-900 dark:text-neutral-100 overscroll-contain">
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">
                Share Client Gallery
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[240px] sm:max-w-[260px]">
                {gallery.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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

        {/* ─── LINK ACCESS TIME PERIOD & EXPIRATION CARD ─── */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-neutral-50 via-neutral-100/60 to-neutral-50 dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-neutral-900/90 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${expiryStatus.isExpired ? 'bg-rose-500/20 text-rose-500' : expiryStatus.hasExpiry ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                  Link Access Validity Window
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Control how long clients can view and download this template
                </span>
              </div>
            </div>

            {/* Current Status Badge */}
            <div>
              {expiryStatus.isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-bold">
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  <span>Access Expired</span>
                </span>
              ) : expiryStatus.hasExpiry ? (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                  expiryStatus.isExpiringSoon
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{expiryStatus.remainingText}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Permanent Access</span>
                </span>
              )}
            </div>
          </div>

          {/* If expired banner */}
          {expiryStatus.isExpired && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs text-rose-700 dark:text-rose-300 font-mono">
                Closed on {expiryStatus.humanFormatted}. Clients cannot view photos.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleExtendDays(7)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-mono text-[11px] font-bold transition-all cursor-pointer"
                >
                  +7 Days
                </button>
                <button
                  onClick={() => handleExtendDays(30)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white font-mono text-[11px] transition-all cursor-pointer"
                >
                  +30 Days
                </button>
              </div>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 dark:text-neutral-400 block font-semibold">
              Set Link Duration:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {[
                { id: '24h', label: '24 Hours' },
                { id: '48h', label: '48 Hours' },
                { id: '7d', label: '7 Days' },
                { id: '14d', label: '14 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: 'custom', label: 'Custom Date' },
                { id: 'never', label: 'Never Expires' },
              ].map((preset) => {
                const isSelected =
                  preset.id === 'never' && !expiryStatus.hasExpiry;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id as ExpiryPresetId)}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] transition-all cursor-pointer text-center truncate ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                        : 'bg-white dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Picker Accordion */}
          {showCustomExpiry && (
            <form onSubmit={handleApplyCustomExpiry} className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                required
                className="w-full sm:flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold font-mono text-xs cursor-pointer shadow-sm"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setShowCustomExpiry(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200 px-2 font-mono cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Detailed expiry info notice */}
          {expiryStatus.hasExpiry && !expiryStatus.isExpired && (
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-1">
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Valid until: <strong>{expiryStatus.humanFormatted}</strong></span>
              </span>
              <button
                onClick={handleRemoveExpiry}
                className="text-neutral-400 hover:text-rose-500 transition-colors ml-2 underline shrink-0 cursor-pointer"
              >
                Remove Limit
              </button>
            </div>
          )}
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

        {/* Social / Direct Share Buttons */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
            Instant Client Dispatch & Social Share
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>WhatsApp</span>
            </button>

            {/* Instagram */}
            <button
              onClick={handleInstagram}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-pink-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group cursor-pointer"
            >
              <svg className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </button>

            {/* Snapchat */}
            <button
              onClick={handleSnapchat}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-yellow-50 dark:hover:bg-yellow-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-yellow-400/50 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group cursor-pointer"
            >
              <svg className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M12.065 2.016c-3.155 0-5.74 2.457-5.77 5.753-.008.857.24 1.769.458 2.378.077.213.117.375.05.514-.092.19-.368.326-.777.424-.468.112-1.077.26-1.503.568-.316.228-.485.548-.465.882.028.47.382.812.87 1.002.584.228 1.348.167 1.956.118.232-.018.435-.035.592.008.204.056.326.232.228.468-.152.366-.549.924-1.092 1.488-.344.356-.708.68-1.082.964-.472.358-.696.782-.63 1.196.07.442.436.785.98.874.62.102 1.31-.05 1.94-.187.35-.076.696-.152 1.033-.178.337-.026.65.076.904.298.618.54 1.472 1.11 2.394 1.258.464.074.922.062 1.373-.036.312-.068.61-.176.892-.32.298-.154.582-.338.856-.546.22-.168.452-.27.702-.272.292-.002.59.138.868.406.494.478 1.168.89 1.956.902.13.002.262-.008.396-.03.542-.09 1.042-.37 1.448-.81.424-.46.684-1.054.772-1.768.046-.372.064-.78.05-1.218-.014-.438.072-.734.254-.922.18-.186.468-.266.858-.238.452.032.996.116 1.542.01.554-.108 1.026-.456 1.296-.954.272-.502.256-1.12-.044-1.698-.31-.598-.828-1.048-1.46-1.234-.41-.122-.844-.158-1.292-.108-.242.026-.474-.064-.622-.24-.15-.176-.188-.418-.106-.65.202-.572.438-1.458.442-2.316.014-3.298-2.584-5.755-5.74-5.755z" />
              </svg>
              <span>Snapchat</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegram}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
              <span>Telegram</span>
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/40 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all group cursor-pointer"
            >
              <Mail className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Email</span>
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all group cursor-pointer ${
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
            <ExternalLink className="w-3.5 h-3.5" /> Preview Client View
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
