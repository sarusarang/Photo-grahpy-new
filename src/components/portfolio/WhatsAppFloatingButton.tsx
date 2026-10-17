import React, { useState } from 'react';
import { Settings, Check, X, ExternalLink, Smartphone } from 'lucide-react';
import type { PortfolioConfig } from '../../types/portfolio';

// ─────────────────────────────────────────────────────────────
// AUTHENTIC OFFICIAL WHATSAPP EMBLEM SVG
// High-precision vector icon according to brand guidelines
// ─────────────────────────────────────────────────────────────
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function cleanWhatsAppNumber(phone: string): string {
  // Strip non-digit characters except keep clean numerical representation
  return (phone || '').replace(/[^0-9]/g, '');
}

export interface WhatsAppFloatingButtonProps {
  config: PortfolioConfig;
  isEditable?: boolean;
  onUpdateConfig?: (updates: Partial<PortfolioConfig>) => void;
  theme?: 'light' | 'dark';
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  config,
  isEditable = false,
  onUpdateConfig,
  theme: _theme = 'light',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fallback chain for phone number
  const effectiveNumber = config.whatsappNumber || config.contactPhone || '';
  const isEnabled = config.whatsappEnabled !== false;
  const buttonLabel = config.whatsappButtonLabel || 'Chat on WhatsApp';
  const prefillMessage =
    config.whatsappPrefillMessage ||
    `Hi, I'm interested in booking a photography session with ${config.studioName || 'your studio'}!`;

  // Local state for edit modal
  const [localEnabled, setLocalEnabled] = useState(isEnabled);
  const [localNumber, setLocalNumber] = useState(effectiveNumber);
  const [localMessage, setLocalMessage] = useState(prefillMessage);
  const [localLabel, setLocalLabel] = useState(buttonLabel);

  const openEditor = (e: React.MouseEvent) => {
    if (isEditable) {
      e.preventDefault();
      e.stopPropagation();
      setLocalEnabled(config.whatsappEnabled !== false);
      setLocalNumber(config.whatsappNumber || config.contactPhone || '');
      setLocalMessage(
        config.whatsappPrefillMessage ||
          `Hi, I'm interested in booking a photography session with ${config.studioName || 'your studio'}!`
      );
      setLocalLabel(config.whatsappButtonLabel || 'Chat on WhatsApp');
      setIsModalOpen(true);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateConfig) {
      onUpdateConfig({
        whatsappEnabled: localEnabled,
        whatsappNumber: localNumber,
        whatsappPrefillMessage: localMessage,
        whatsappButtonLabel: localLabel,
      });
    }
    setIsModalOpen(false);
  };

  const cleanedNumber = cleanWhatsAppNumber(effectiveNumber);
  const whatsappUrl = cleanedNumber
    ? `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(prefillMessage)}`
    : '#';

  // If not in edit mode and button is disabled or has no phone number, do not render
  if (!isEditable && (!isEnabled || !cleanedNumber)) {
    return null;
  }

  return (
    <>
      {/* ─── FLOATING ACTION BADGE ─── */}
      <aside
        aria-label="Direct WhatsApp Contact"
        className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 flex items-center group pointer-events-auto"
      >
        {isEditable ? (
          /* EDITABLE TRIGGER */
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={openEditor}
              className={`relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
                isEnabled
                  ? 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-[#25D366]/40 hover:shadow-[#25D366]/60'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700 shadow-black/40'
              }`}
              title="Click to customize WhatsApp button"
            >
              <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span className="text-xs sm:text-sm font-bold tracking-wide font-sans">
                {isEnabled ? buttonLabel : 'WhatsApp (Disabled)'}
              </span>

              {/* Edit Indicator Badge */}
              <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-neutral-950 shadow-md ring-2 ring-neutral-900 flex items-center justify-center">
                <Settings className="w-3 h-3 stroke-[2.5]" />
              </span>
            </button>
          </div>
        ) : (
          /* PUBLIC VISITOR LINK */
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white shadow-2xl shadow-[#25D366]/35 hover:shadow-[#25D366]/60 transition-all duration-300 group cursor-pointer"
            title={`${buttonLabel} (${effectiveNumber})`}
          >
            <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-110 transition-transform duration-300" />
            
            {/* Expandable Label on Desktop */}
            <span className="text-xs sm:text-sm font-bold tracking-wide font-sans drop-shadow-sm select-none">
              {buttonLabel}
            </span>

            {/* Subtle Pulse Rings */}
            <span className="absolute -inset-1 rounded-full bg-[#25D366]/20 animate-ping pointer-events-none -z-10 group-hover:hidden" />
          </a>
        )}
      </aside>

      {/* ─── LIVE TEMPLATE EDIT MODAL ─── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 text-white shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    WhatsApp Floating Button
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Live Edit
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Let clients message and inquire with your studio in 1 tap.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-5">
              {/* Toggle Enable Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-white block">
                    Show Floating WhatsApp Icon
                  </span>
                  <span className="text-xs text-neutral-400 block">
                    Displays floating action button at the bottom of all portfolio pages.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalEnabled(!localEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    localEnabled ? 'bg-[#25D366]' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      localEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>WhatsApp Phone Number *</span>
                  <span className="text-[10px] text-amber-400 font-sans">Include Country Code</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required={localEnabled}
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#25D366] transition-colors font-mono"
                  />
                  <Smartphone className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Example: <code className="text-neutral-300 font-mono">+1 555 123 4567</code> (US) or <code className="text-neutral-300 font-mono">+91 98765 43210</code> (India).
                </p>
              </div>

              {/* Button Text / Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
                  Button Label / Tooltip
                </label>
                <input
                  type="text"
                  value={localLabel}
                  onChange={(e) => setLocalLabel(e.target.value)}
                  placeholder="Chat on WhatsApp"
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>

              {/* Pre-filled Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
                  Default Pre-filled Client Message
                </label>
                <textarea
                  rows={3}
                  value={localMessage}
                  onChange={(e) => setLocalMessage(e.target.value)}
                  placeholder="Hi, I'm interested in booking a photography session!"
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-[#25D366] transition-colors resize-none"
                />
                <p className="text-[11px] text-neutral-500">
                  This greeting text will be automatically typed in WhatsApp when clients click the button.
                </p>
              </div>

              {/* Live Preview & Direct Test Link */}
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-mono uppercase text-[10px] tracking-wider">Button Preview:</span>
                  {cleanWhatsAppNumber(localNumber) && (
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(localNumber)}?text=${encodeURIComponent(localMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <span>Test Chat Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold shadow-md">
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>{localLabel || 'Chat on WhatsApp'}</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-[#25D366]/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save &amp; Apply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
