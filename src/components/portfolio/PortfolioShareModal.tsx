import React, { useState } from 'react';
import type { PortfolioConfig } from '../../types/portfolio';
import { useToast } from '../ui/Toast';
import { QRCodeStudioBox } from '../gallery/share/QRCodeStudioBox';
import { SocialShareButton } from '../gallery/share/SocialShareButton';
import {
  X,
  Share2,
  Copy,
  ExternalLink,
  Smartphone,
  QrCode,
  MapPin,
  Check,
} from 'lucide-react';

interface PortfolioShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PortfolioConfig;
  publicUrl: string;
}

export const PortfolioShareModal: React.FC<PortfolioShareModalProps> = ({
  isOpen,
  onClose,
  config,
  publicUrl,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showToast('Portfolio Link Copied!', 'Share link copied to your clipboard.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Copy Failed', 'Please copy link manually.', 'error');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! View my latest photography portfolio and selected works at: ${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Link Copied for Instagram!', 'Paste the portfolio link in your Instagram Story, Bio, or DM.', 'success');
      window.open('https://www.instagram.com/', '_blank');
    } catch {
      window.open('https://www.instagram.com/', '_blank');
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${config.studioName} — Photography Portfolio & Selected Works`);
    const body = encodeURIComponent(
      `Hi,\n\nI invite you to explore our photography portfolio and creative collections here:\n${publicUrl}\n\nWarm regards,\n${config.artistName}\n${config.studioName}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${config.studioName} Portfolio`,
          text: `Explore ${config.studioName}'s photography portfolio and curated works.`,
          url: publicUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#11131c] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-white space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-500">
              <Share2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Share Portfolio
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Send your portfolio and collections to clients worldwide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Preview Card */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white shadow-md">
          <div className="relative aspect-[16/8] w-full overflow-hidden">
            <img
              src={config.bannerUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80'}
              alt={config.studioName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Online Portfolio
              </span>
              <h4 className="text-lg font-bold tracking-tight text-white line-clamp-1">
                {config.studioName}
              </h4>
              <p className="text-xs text-neutral-300 line-clamp-1">
                {config.tagline}
              </p>
            </div>
          </div>
          <div className="p-3 bg-neutral-900 flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{config.location || 'Worldwide'}</span>
            </span>
            <span className="text-neutral-500">
              {config.featuredWorks?.length || 0} Featured Works
            </span>
          </div>
        </div>

        {/* Quick Link Bar */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
            Public Portfolio URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Native Mobile Share Button */}
        {'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Share via Apps (AirDrop, Messages, Instagram)</span>
          </button>
        )}

        {/* Social Share Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
            Direct Share Channels
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* WhatsApp */}
            <SocialShareButton
              label="WhatsApp"
              onClick={handleWhatsApp}
              accentBg="bg-emerald-500/15"
              accentText="text-emerald-500"
              hoverBg="hover:bg-emerald-500/20"
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
              accentText="text-pink-500"
              hoverBg="hover:bg-pink-500/20"
              hoverBorder="hover:border-pink-500/40"
              icon={
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              }
            />

            {/* Email */}
            <SocialShareButton
              label="Email"
              onClick={handleEmail}
              accentBg="bg-blue-500/15"
              accentText="text-blue-500"
              hoverBg="hover:bg-blue-500/20"
              hoverBorder="hover:border-blue-500/40"
              icon={
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              }
            />

            {/* QR Code toggle */}
            <SocialShareButton
              label="QR Code"
              onClick={() => setShowQR(!showQR)}
              accentBg="bg-amber-400/15"
              accentText="text-amber-500"
              hoverBg="hover:bg-amber-400/20"
              hoverBorder="hover:border-amber-400/40"
              icon={<QrCode className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* QR Code Box */}
        {showQR && (
          <div className="pt-2 animate-in fade-in duration-200">
            <QRCodeStudioBox
              url={publicUrl}
              title={config.studioName}
              subtitle={`Portfolio by ${config.artistName}`}
              initialOpen={true}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-amber-500 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Page</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
