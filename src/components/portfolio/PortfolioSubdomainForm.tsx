import React, { useState } from 'react';
import { useSubdomainSettings } from '../../hooks/useSubdomainSettings';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { ShareQrModal } from './ShareQrModal';
import type { SubdomainStatus } from '../../types/portfolio';

export interface PortfolioSubdomainFormProps {
  currentSubdomain?: string | null;
  currentStatus?: SubdomainStatus | null;
  studioName?: string;
  onSubdomainUpdated?: (newSubdomain: string, fullUrl: string) => void;
  className?: string;
}

export const PortfolioSubdomainForm: React.FC<PortfolioSubdomainFormProps> = ({
  currentSubdomain,
  currentStatus,
  studioName,
  onSubdomainUpdated,
  className = '',
}) => {
  const {
    subdomainInput,
    statusData,
    availability,
    isChecking,
    isSubmitting,
    isRetrying,
    retryCooldown,
    errorMessage,
    onInputChange,
    claimSubdomain,
    retryProvisioning,
  } = useSubdomainSettings(
    currentSubdomain,
    (claimed, fullUrl) => {
      toast.success(`Subdomain '${claimed}' claimed and active immediately via Wildcard DNS!`, {
        description: `Your signature showcase is live at ${fullUrl}`,
      });
      if (onSubdomainUpdated) {
        onSubdomainUpdated(claimed, fullUrl);
      }
    },
    currentStatus || undefined
  );

  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Active status determination
  const isCurrentlyActive = statusData?.status === 'active';
  const confirmedSubdomain = statusData?.subdomain || currentSubdomain || '';
  const isInputModified =
    subdomainInput.trim().toLowerCase() !== confirmedSubdomain.trim().toLowerCase();

  const activeUrl = confirmedSubdomain
    ? `https://${confirmedSubdomain}.exshare.ai`
    : statusData?.url || '';

  const previewLiveUrl = subdomainInput
    ? `https://${subdomainInput}.exshare.ai`
    : 'https://yourstudio.exshare.ai';

  const copyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    const success = await claimSubdomain();
    if (success) {
      // Trigger instant UI feedback
    }
  };

  // Determine button state
  const isInputEmpty = !subdomainInput || subdomainInput.length < 3;
  const isTaken = availability && !availability.available && !availability.is_current_owner;
  const isSameAsActive = isCurrentlyActive && !isInputModified;
  const canSubmit = !isSubmitting && !isInputEmpty && !isTaken && (!isCurrentlyActive || isInputModified);

  return (
    <div
      className={`w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-neutral-100 shadow-2xl backdrop-blur-md relative overflow-hidden ${className}`}
    >
      {/* Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-start sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Studio Subdomain</h2>
            {isCurrentlyActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live &amp; Active
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed">
            Instant vanity address for your portfolio. Powered by automatic Wildcard DNS with zero wait times.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-300 font-semibold tracking-wider shrink-0">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Wildcard DNS</span>
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {/* Active Address Showcase Banner (if already active) */}
        {isCurrentlyActive && confirmedSubdomain && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-neutral-950 to-neutral-950 border border-emerald-500/30 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="truncate">
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Your Published Web Address</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-white truncate mt-1">
                  {activeUrl}
                </div>
              </div>

              {/* Action Buttons: Open, Copy, Share QR */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <span>Open Showcase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => copyUrl(activeUrl)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border border-neutral-700 active:scale-95"
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border border-neutral-700 active:scale-95"
                  title="Generate QR code"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share QR Code</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Field with Prefix / Suffix Visual */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
            {isCurrentlyActive ? 'Change / Update Subdomain' : 'Choose Your Studio Handle'}
          </label>

          {/* Clean prefix / input / suffix visual container */}
          <div className="flex items-center rounded-2xl bg-neutral-950 border border-neutral-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 overflow-hidden transition-all shadow-inner">
            {/* Prefix: https:// */}
            <span className="px-3.5 sm:px-4 py-3.5 bg-neutral-900/80 text-neutral-500 font-mono text-xs sm:text-sm select-none border-r border-neutral-800 shrink-0">
              https://
            </span>

            {/* Subdomain Input */}
            <input
              type="text"
              value={subdomainInput}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={isSubmitting}
              placeholder="your-studio"
              className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-3.5 text-white font-mono text-sm sm:text-base outline-none disabled:opacity-50 tracking-tight"
              maxLength={63}
              autoComplete="off"
              spellCheck="false"
            />

            {/* Suffix: .exshare.ai */}
            <span className="px-3.5 sm:px-4 py-3.5 bg-neutral-900/80 text-amber-400/90 font-mono text-xs sm:text-sm select-none border-l border-neutral-800 shrink-0 font-medium">
              .exshare.ai
            </span>
          </div>

          {/* Live Debounced Validation (400ms) Feedback */}
          <div className="mt-2.5 text-xs min-h-[22px] flex items-center gap-2">
            {isChecking && (
              <span className="text-amber-400 font-medium flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking availability...</span>
              </span>
            )}

            {!isChecking && availability && (
              <>
                {availability.available ? (
                  availability.is_current_owner ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Your active subdomain address.</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Available! Claim this address now.</span>
                    </span>
                  )
                ) : (
                  <>
                    {availability.reason === 'reserved' ? (
                      <span className="text-amber-400 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{availability.error || 'The name is reserved for platform infrastructure.'}</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{availability.error || 'Already claimed by another studio.'}</span>
                      </span>
                    )}
                  </>
                )}
              </>
            )}

            {!isChecking && !availability && subdomainInput && subdomainInput.length < 3 && (
              <span className="text-neutral-500 font-mono text-[11px]">
                Must be at least 3 lowercase characters (letters, numbers, or hyphens).
              </span>
            )}
          </div>
        </div>

        {/* Live URL Preview Pill (when modifying or setting up) */}
        {(!isCurrentlyActive || isInputModified) && (
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between gap-4">
            <div className="truncate">
              <div className="text-[11px] text-neutral-500 font-mono uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Live Address Preview</span>
              </div>
              <div className="text-sm font-mono text-neutral-200 truncate mt-0.5 font-medium">
                {previewLiveUrl}
              </div>
            </div>
          </div>
        )}

        {/* Error / Failed State Banner & Retry Button */}
        {statusData?.status === 'failed' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs">
              <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Provisioning Failed</span>
              </p>
              <p className="text-rose-200/80 mt-0.5">
                {statusData.error || errorMessage || 'An unexpected DNS conflict occurred.'}
              </p>
            </div>
            <button
              type="button"
              onClick={retryProvisioning}
              disabled={isRetrying || retryCooldown > 0}
              className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              {isRetrying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{retryCooldown > 0 ? `Wait ${retryCooldown}s` : isRetrying ? 'Retrying...' : 'Retry Now'}</span>
            </button>
          </div>
        )}

        {/* Generic Error Message Banner */}
        {errorMessage && statusData?.status !== 'failed' && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bottom CTA Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-neutral-800 gap-4">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Wildcard DNS activation with zero propagation delay.</span>
          </div>

          <button
            type="button"
            onClick={handleClaim}
            disabled={!canSubmit || isSameAsActive}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wider transition disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-xl shadow-amber-500/10 shrink-0"
          >
            {isSubmitting
              ? 'Claiming...'
              : isCurrentlyActive && isInputModified
              ? 'Update Subdomain'
              : 'Claim & Publish Subdomain'}
          </button>
        </div>
      </div>

      {/* QR Code Share Modal */}
      <ShareQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={activeUrl}
        subdomain={confirmedSubdomain}
        studioName={studioName}
      />
    </div>
  );
};
