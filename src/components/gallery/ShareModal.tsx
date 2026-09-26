import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Gallery } from '../../types';
import { useToast } from '../ui/Toast';
import { useGallery } from '../../context/GalleryContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useUpdateGallery, useGalleryShareDetails } from '@/hooks/useAtelierQueries';
import {
  getExpiryStatus,
  calculateExpiryPreset,
  extendExpiryByDays,
  type ExpiryPresetId,
} from '../../utils/expiryUtils';
import { getInitialGalleryCover, handleCoverImageError } from '../../utils/coverImageUtils';
import { SocialShareButton } from './share/SocialShareButton';
import { ShareUrlBar } from './share/ShareUrlBar';
import {
  X,
  QrCode,
  Image as ImageIcon,
  ExternalLink,
  Send,
  Mail,
  Share2,
  Lock,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, gallery }) => {
  const { showToast } = useToast();
  const { updateGallery } = useGallery();
  const { mutate: updateGalleryApi } = useUpdateGallery();
  const { data: shareDetails } = useGalleryShareDetails(gallery.id);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'qr' | 'preview'>('qr');
  const [showCustomExpiry, setShowCustomExpiry] = useState(false);

  // Formatted expiry details
  const expiryStatus = getExpiryStatus(shareDetails?.expires_at || gallery.expiresAt);

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

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset view mode to QR Code when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('qr');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Canonical production front-end share link: https://exshare.ai/gallery/...
  const publicUrl = `https://exshare.ai/gallery/${encodeURIComponent(gallery.slug || gallery.id)}`;

  const expiryNote =
    expiryStatus.hasExpiry && !expiryStatus.isExpired
      ? ` • Access valid until ${expiryStatus.humanFormatted}`
      : '';

  const shareText = `Check out the private photography collection "${gallery.title}" for ${gallery.clientName || 'our client'}`;

  // Native Web Share API (Mobile & modern desktop browsers)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: gallery.title,
          text: `${shareText}${expiryNote}`,
          url: publicUrl,
        });
        showToast('Shared Successfully', 'Thank you for sharing!', 'success');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showToast('Link Copied!', 'Client gallery URL copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Social Sharing Handlers
  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${gallery.clientName}! Your private photography collection "${gallery.title}" is ready for viewing here: ${publicUrl}${expiryNote}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}&quote=${encodeURIComponent(
        shareText
      )}`,
      '_blank',
      'width=600,height=500'
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        publicUrl
      )}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=450'
    );
  };

  const handlePinterest = () => {
    const mediaUrl = gallery.coverImage || getInitialGalleryCover(gallery.templateId);
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        publicUrl
      )}&media=${encodeURIComponent(mediaUrl)}&description=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=750,height=600'
    );
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

  const handleTelegram = () => {
    const text = encodeURIComponent(`Private Photo Gallery: ${gallery.title}${expiryNote}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`, '_blank');
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
    updateGalleryApi({ id: gallery.id, updates: { expires_at: nextIso } });
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
    updateGalleryApi({ id: gallery.id, updates: { expires_at: nextIso } });
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
    updateGalleryApi({ id: gallery.id, updates: { expires_at: nextIso } });
    const status = getExpiryStatus(nextIso);
    showToast('Access Extended', `Link renewed until ${status.humanFormatted}.`, 'success');
  };

  const handleRemoveExpiry = () => {
    updateGallery(gallery.id, { expiresAt: undefined });
    updateGalleryApi({ id: gallery.id, updates: { expires_at: null } });
    setShowCustomExpiry(false);
    showToast('Expiry Removed', 'Gallery link will now remain permanently accessible.', 'info');
  };

  return createPortal(
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overlay-animate overscroll-contain"
      onClick={onClose}
    >
      <div
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-3xl lg:max-w-4xl bg-neutral-950 border-t sm:border border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-4 sm:p-6 pb-safe shadow-2xl shadow-black/90 text-neutral-100 sheet-animate sm:modal-animate max-h-[92vh] sm:max-h-[88vh] flex flex-col overscroll-contain"
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-700/80 mx-auto mb-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight leading-tight">
                Share Client Gallery
              </h2>
              <p className="text-xs text-neutral-400 truncate max-w-[210px] sm:max-w-md">
                {gallery.title} {gallery.clientName ? `• ${gallery.clientName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800/80 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: 2-Column on Tablet/Desktop, Smooth Mobile Scroll */}
        <div
          data-lenis-prevent="true"
          className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-5 overflow-y-auto pr-0.5 sm:pr-1 overscroll-contain"
        >
          {/* Left Column: QR Code Display Card & Cover Toggle */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 flex flex-col gap-2.5">
              {/* Segmented View Switcher: QR Code (Default) vs Cover Preview */}
              <div className="flex items-center p-1 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('qr')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'qr'
                      ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
                      : 'text-neutral-400 hover:text-amber-300'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Cover Photo</span>
                </button>
              </div>

              {/* Main Display Area */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                {viewMode === 'qr' ? (
                  <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 text-center animate-in zoom-in-95 duration-200">
                    <div className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-xl ring-2 ring-white/10 flex items-center justify-center">
                      <QRCodeSVG
                        value={publicUrl}
                        size={136}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-200 mt-2.5">
                      Scan with phone camera to open
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      Permanent direct gallery link
                    </p>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={gallery.coverImage || getInitialGalleryCover(gallery.templateId)}
                      alt={gallery.title}
                      loading="lazy"
                      onError={(e) => handleCoverImageError(e, getInitialGalleryCover(gallery.templateId))}
                      className="w-full h-full object-cover animate-in fade-in duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-amber-400 border border-white/10 uppercase">
                      {gallery.templateId || 'Editorial'} Theme
                    </span>
                  </div>
                )}
              </div>

              {/* Gallery Info & Metadata */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                    {gallery.title}
                  </h4>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
                    title="Preview Live Client View"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open</span>
                  </a>
                </div>

                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Client: {gallery.clientName || 'Valued Client'}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-mono text-neutral-400">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50">
                    {gallery.media.length} {gallery.media.length === 1 ? 'item' : 'items'}
                  </span>

                  {gallery.isPasswordProtected && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> PIN: {gallery.password || 'Protected'}
                    </span>
                  )}

                  {expiryStatus.isExpired ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Expired
                    </span>
                  ) : expiryStatus.hasExpiry ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {expiryStatus.remainingText}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/50 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Permanent
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Native Share, Expiry Window, Social Grid, Link Bar, Actions */}
          <div className="md:col-span-7 flex flex-col justify-between gap-3 sm:gap-4">
            {/* Quick Native App Share (Instagram, Messages, AirDrop) */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-amber-400/20 active:scale-[0.99] cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Share via Apps (Instagram, AirDrop, Messages)</span>
            </button>

            {/* Link Access Validity Window Card */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${expiryStatus.isExpired ? 'bg-rose-500/20 text-rose-500' : expiryStatus.hasExpiry ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Link Access Validity Window
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Control how long clients can view and download this gallery
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {expiryStatus.isExpired ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
                      <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                      <span>Access Expired</span>
                    </span>
                  ) : expiryStatus.hasExpiry ? (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      expiryStatus.isExpiringSoon
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{expiryStatus.remainingText}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono border border-neutral-700/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Permanent Access</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Expired Action Banner */}
              {expiryStatus.isExpired && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-rose-300 font-mono">
                    Closed on {expiryStatus.humanFormatted}.
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleExtendDays(7)}
                      className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-mono text-[10px] font-bold transition-all cursor-pointer"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExtendDays(30)}
                      className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] transition-all cursor-pointer"
                    >
                      +30 Days
                    </button>
                  </div>
                </div>
              )}

              {/* Duration Presets Grid */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block font-semibold">
                  Set Link Duration:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
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
                    const isSelected = preset.id === 'never' && !expiryStatus.hasExpiry;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id as ExpiryPresetId)}
                        className={`px-2 py-1.5 rounded-lg font-mono text-[10px] transition-all cursor-pointer text-center truncate ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                            : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
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
                <form onSubmit={handleApplyCustomExpiry} className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    required
                    className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold font-mono text-xs cursor-pointer shadow-sm"
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

              {/* Expiry Status Line */}
              {expiryStatus.hasExpiry && !expiryStatus.isExpired && (
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>Valid until: <strong className="text-neutral-200">{expiryStatus.humanFormatted}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveExpiry}
                    className="text-neutral-400 hover:text-rose-400 transition-colors ml-2 underline shrink-0 cursor-pointer"
                  >
                    Remove Limit
                  </button>
                </div>
              )}
            </div>

            {/* Social Share Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Share to Social Media
                </p>
                {viewMode === 'preview' ? (
                  <button
                    type="button"
                    onClick={() => setViewMode('qr')}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Show QR Code</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Show Cover Photo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* WhatsApp */}
                <SocialShareButton
                  label="WhatsApp"
                  onClick={handleWhatsApp}
                  accentBg="bg-emerald-500/15"
                  accentText="text-emerald-400"
                  hoverBg="hover:bg-emerald-950/40"
                  hoverBorder="hover:border-emerald-500/40"
                  icon={
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.771.889 2.796.889 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.374 8.163c-.144.405-.837.774-1.17.823-.312.045-.694.062-2.181-.555-1.902-.788-3.129-2.735-3.224-2.86-.095-.125-.771-1.026-.771-1.956 0-.93.488-1.386.662-1.576.174-.19.38-.238.507-.238.127 0 .253.002.364.007.119.005.277-.045.433.329.164.394.557 1.358.605 1.457.048.099.08.214.016.341-.064.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.195.198-.084.388.111.19.493.813 1.058 1.317.728.648 1.341.849 1.531.944.19.095.301.079.412-.048.111-.127.476-.555.603-.745.127-.19.254-.159.428-.095.175.064 1.111.524 1.301.619.19.095.317.143.365.222.048.079.048.46-.096.865z" />
                    </svg>
                  }
                />

                {/* Instagram */}
                <SocialShareButton
                  label="Instagram"
                  onClick={handleInstagram}
                  accentBg="bg-pink-500/15"
                  accentText="text-pink-400"
                  hoverBg="hover:bg-pink-950/40"
                  hoverBorder="hover:border-pink-500/40"
                  icon={
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  }
                />

                {/* Snapchat */}
                <SocialShareButton
                  label="Snapchat"
                  onClick={handleSnapchat}
                  accentBg="bg-yellow-400/15"
                  accentText="text-yellow-400"
                  hoverBg="hover:bg-yellow-950/40"
                  hoverBorder="hover:border-yellow-400/50"
                  icon={
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.065 2.016c-3.155 0-5.74 2.457-5.77 5.753-.008.857.24 1.769.458 2.378.077.213.117.375.05.514-.092.19-.368.326-.777.424-.468.112-1.077.26-1.503.568-.316.228-.485.548-.465.882.028.47.382.812.87 1.002.584.228 1.348.167 1.956.118.232-.018.435-.035.592.008.204.056.326.232.228.468-.152.366-.549.924-1.092 1.488-.344.356-.708.68-1.082.964-.472.358-.696.782-.63 1.196.07.442.436.785.98.874.62.102 1.31-.05 1.94-.187.35-.076.696-.152 1.033-.178.337-.026.65.076.904.298.618.54 1.472 1.11 2.394 1.258.464.074.922.062 1.373-.036.312-.068.61-.176.892-.32.298-.154.582-.338.856-.546.22-.168.452-.27.702-.272.292-.002.59.138.868.406.494.478 1.168.89 1.956.902.13.002.262-.008.396-.03.542-.09 1.042-.37 1.448-.81.424-.46.684-1.054.772-1.768.046-.372.064-.78.05-1.218-.014-.438.072-.734.254-.922.18-.186.468-.266.858-.238.452.032.996.116 1.542.01.554-.108 1.026-.456 1.296-.954.272-.502.256-1.12-.044-1.698-.31-.598-.828-1.048-1.46-1.234-.41-.122-.844-.158-1.292-.108-.242.026-.474-.064-.622-.24-.15-.176-.188-.418-.106-.65.202-.572.438-1.458.442-2.316.014-3.298-2.584-5.755-5.74-5.755z" />
                    </svg>
                  }
                />

                {/* Facebook */}
                <SocialShareButton
                  label="Facebook"
                  onClick={handleFacebook}
                  accentBg="bg-blue-500/15"
                  accentText="text-blue-400"
                  hoverBg="hover:bg-blue-950/40"
                  hoverBorder="hover:border-blue-500/40"
                  icon={
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  }
                />

                {/* X / Twitter */}
                <SocialShareButton
                  label="X (Twitter)"
                  onClick={handleTwitter}
                  accentBg="bg-neutral-800"
                  accentText="text-white"
                  hoverBg="hover:bg-neutral-800"
                  hoverBorder="hover:border-neutral-600"
                  icon={
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  }
                />

                {/* Pinterest */}
                <SocialShareButton
                  label="Pinterest"
                  onClick={handlePinterest}
                  accentBg="bg-rose-500/15"
                  accentText="text-rose-400"
                  hoverBg="hover:bg-rose-950/40"
                  hoverBorder="hover:border-rose-500/40"
                  icon={
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                    </svg>
                  }
                />

                {/* Telegram */}
                <SocialShareButton
                  label="Telegram"
                  onClick={handleTelegram}
                  accentBg="bg-sky-500/15"
                  accentText="text-sky-400"
                  hoverBg="hover:bg-sky-950/40"
                  hoverBorder="hover:border-sky-500/40"
                  icon={<Send className="w-4 h-4" />}
                />

                {/* Email */}
                <SocialShareButton
                  label="Email"
                  onClick={handleEmail}
                  accentBg="bg-amber-500/15"
                  accentText="text-amber-400"
                  hoverBg="hover:bg-amber-950/40"
                  hoverBorder="hover:border-amber-500/40"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Direct Shareable URL Bar */}
            <ShareUrlBar url={publicUrl} onCopy={handleCopyLink} copied={copied} />

            {/* Bottom Actions Footer */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 hidden sm:inline font-mono">
                Press ESC to dismiss
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
