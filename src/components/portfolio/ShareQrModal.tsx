import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  subdomain: string;
  studioName?: string;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  isOpen,
  onClose,
  url,
  subdomain,
  studioName,
}) => {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Portfolio link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    try {
      if (!svgRef.current) return;
      const svgElement = svgRef.current.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // High-resolution export (1024x1024)
      const size = 1024;
      canvas.width = size;
      canvas.height = size;

      img.onload = () => {
        if (!ctx) return;
        // Background fill
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Draw QR code with margin
        const padding = 80;
        ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

        // Convert to PNG download
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${subdomain}-exshare-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('High-resolution QR code downloaded!');
      };

      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    } catch {
      toast.error('Failed to export QR code.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl z-10 overflow-hidden"
        >
          {/* Ambient Corner Glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Description */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
              <QrCode className="w-3 h-3" />
              <span>Studio QR Code</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {studioName || `${subdomain}.exshare.ai`}
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Scan to view your live portfolio showcase. Print on business cards or share on Instagram stories.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex justify-center my-6">
            <div
              ref={svgRef}
              className="p-5 bg-white rounded-2xl shadow-xl border-4 border-amber-400/20 flex items-center justify-center"
            >
              <QRCodeSVG
                value={url}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#0a0a0a"
                bgColor="#ffffff"
              />
            </div>
          </div>

          {/* URL Pill */}
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
            <span className="text-xs font-mono text-neutral-300 select-all truncate block">
              {url}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-neutral-700 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Direct Link to Open */}
          <div className="mt-4 text-center">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-400 transition"
            >
              <span>Visit live address in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
