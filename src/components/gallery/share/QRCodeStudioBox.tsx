import React, { useState, useId } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Share2, Download, Copy, Check, ChevronDown } from 'lucide-react';
import {
  downloadQrCanvas,
  shareQrImage,
  copyQrImageToClipboard,
  sanitizeFilename,
} from '@/utils/qrCodeUtils';
import { useToast } from '../../ui/Toast';

export interface QRCodeStudioBoxProps {
  url: string;
  title?: string;
  subtitle?: string;
  filenamePrefix?: string;
  initialOpen?: boolean;
  className?: string;
}

export const QRCodeStudioBox: React.FC<QRCodeStudioBoxProps> = ({
  url,
  title = 'Direct Share QR Code',
  subtitle = 'Scan with phone camera to open directly',
  filenamePrefix = 'qr-code',
  initialOpen = false,
  className = '',
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const canvasId = `qr-canvas-${useId().replace(/:/g, '')}`;

  const getCanvas = (): HTMLCanvasElement | null => {
    return document.getElementById(canvasId) as HTMLCanvasElement | null;
  };

  const handleDownload = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const cleanName = `${sanitizeFilename(filenamePrefix)}-qr.png`;
    const ok = downloadQrCanvas(canvas, cleanName);
    if (ok) {
      showToast('QR Code Downloaded', 'High-res PNG image saved to your device.', 'success');
    } else {
      showToast('Download Failed', 'Could not save QR code image.', 'error');
    }
  };

  const handleShare = async () => {
    const canvas = getCanvas();
    if (!canvas) return;
    setIsSharing(true);
    try {
      const cleanName = `${sanitizeFilename(filenamePrefix)}-qr.png`;
      await shareQrImage(canvas, {
        title,
        text: `Scan this QR Code to view: ${url}`,
        url,
        filename: cleanName,
        onToast: (toastTitle, toastMsg, type) => showToast(toastTitle, toastMsg, type),
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyImage = async () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ok = await copyQrImageToClipboard(canvas, (tTitle, tMsg, type) =>
      showToast(tTitle, tMsg, type)
    );
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* QR Code Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] touch-manipulation ${
          isOpen
            ? 'bg-neutral-900 border-amber-400/50 shadow-md ring-1 ring-amber-400/25 text-white'
            : 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-white leading-tight truncate">
              {isOpen ? 'Hide QR Code' : 'Scan & Share QR Code'}
            </p>
            <p className="text-[10px] text-neutral-400 leading-tight mt-0.5 truncate">
              Instant phone scan • Download or share QR image
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-medium shrink-0 ml-2">
          <span>{isOpen ? 'Close' : 'View QR'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expandable Interactive QR Studio Card */}
      {isOpen && (
        <div className="mt-2.5 p-3.5 sm:p-4 rounded-2xl bg-neutral-900/95 border border-neutral-800/90 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            {/* High-Resolution QR Canvas */}
            <div className="p-2.5 bg-white rounded-xl shadow-lg ring-1 ring-white/20 shrink-0">
              <QRCodeCanvas
                id={canvasId}
                value={url}
                size={132}
                level="H"
                includeMargin={false}
                className="block"
              />
            </div>

            {/* Explanatory Details */}
            <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {title}
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                {subtitle}
              </p>
              <p className="text-[10px] text-amber-400/90 font-mono truncate pt-0.5">
                {url}
              </p>
            </div>
          </div>

          {/* Action Row: Share, Download, Copy Image */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-400/20 disabled:opacity-50"
              title="Share QR Code image directly to WhatsApp, AirDrop, Messages or apps"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{isSharing ? 'Sharing...' : 'Share QR'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-95 text-white text-xs font-semibold border border-neutral-700/80 transition-all cursor-pointer"
              title="Download high-resolution PNG image of the QR Code"
            >
              <Download className="w-3.5 h-3.5 stroke-[2]" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-95 text-white text-xs font-semibold border border-neutral-700/80 transition-all cursor-pointer"
              title="Copy QR Code image directly to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Copy Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
